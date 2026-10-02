'use strict';

const db = require('../db');

const EXPECTED_COUNT = 36;

async function removeSyntheticDemoAccounts({ apply = false } = {}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    const { rows: users } = await client.query(
      `SELECT id, username, name, email, role,
              (SELECT COUNT(*)::int FROM user_profiles up WHERE up.user_id = u.id) AS profile_count,
              (SELECT COUNT(*)::int FROM daily_progress dp WHERE dp.user_id = u.id) AS daily_count,
              (SELECT COUNT(*)::int FROM submissions s WHERE s.user_id = u.id) AS submission_count
       FROM users u
       WHERE u.username LIKE 'synthetic_demo_%'
       ORDER BY u.username
       FOR UPDATE`,
    );

    if (users.length !== EXPECTED_COUNT) {
      throw new Error(`Expected exactly ${EXPECTED_COUNT} synthetic demo accounts; found ${users.length}. No accounts deleted.`);
    }

    const isExpectedDemo = users.every((user, index) => {
      const suffix = String(index + 1).padStart(2, '0');
      return user.username === `synthetic_demo_${suffix}` &&
        user.name === `SYNTHETIC DEMO ${suffix}` &&
        user.email === `synthetic-demo-${suffix}@codapt.invalid` &&
        user.role === 'student' &&
        user.profile_count === 1 &&
        user.daily_count === 1 &&
        user.submission_count === 0;
    });

    if (!isExpectedDemo) {
      throw new Error('A matched account does not have the exact synthetic-only identity/data shape. No accounts deleted.');
    }

    const { rows: beforeCounts } = await client.query(
      `SELECT COUNT(*)::int AS all_users,
              COUNT(*) FILTER (WHERE username NOT LIKE 'synthetic_demo_%')::int AS real_users
       FROM users`
    );

    console.log(`Validated ${users.length} exact SYNTHETIC DEMO accounts.`);
    console.log('Each has one profile row, one daily score, and zero submissions.');
    console.log(`Real user accounts preserved: ${beforeCounts[0].real_users}.`);
    console.log('Deleting only synthetic_demo_01 through synthetic_demo_36; linked synthetic profiles/scores will cascade with those accounts.');

    if (!apply) {
      await client.query('ROLLBACK');
      console.log('Dry run only; database unchanged. Re-run with --apply to delete these demo accounts.');
      return;
    }

    const ids = users.map(user => user.id);
    const { rowCount: deleted } = await client.query(
      `DELETE FROM users
       WHERE id = ANY($1::int[])
         AND username LIKE 'synthetic_demo_%'
       RETURNING id`,
      [ids]
    );
    if (deleted !== EXPECTED_COUNT) {
      throw new Error(`Expected to delete ${EXPECTED_COUNT} synthetic accounts; deleted ${deleted}. Rolling back.`);
    }

    const { rows: afterCounts } = await client.query(
      `SELECT COUNT(*)::int AS all_users,
              COUNT(*) FILTER (WHERE username NOT LIKE 'synthetic_demo_%')::int AS real_users,
              COUNT(*) FILTER (WHERE username LIKE 'synthetic_demo_%')::int AS synthetic_users
       FROM users`
    );
    if (
      afterCounts[0].real_users !== beforeCounts[0].real_users ||
      afterCounts[0].all_users !== beforeCounts[0].all_users - EXPECTED_COUNT ||
      afterCounts[0].synthetic_users !== 0
    ) {
      throw new Error('Post-delete account counts did not match the safe-delete plan. Rolling back.');
    }

    await client.query('COMMIT');
    console.log(`Deleted ${deleted} synthetic demo accounts. All ${afterCounts[0].real_users} real user accounts remain.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  removeSyntheticDemoAccounts({ apply: process.argv.includes('--apply') })
    .catch(error => {
      console.error(`Synthetic account removal stopped: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { removeSyntheticDemoAccounts };