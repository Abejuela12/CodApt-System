'use strict';

const crypto = require('crypto');
const db = require('../db');
const { loadTrainingData } = require('./seedDemoProgress');

const SOURCE_USERNAMES = [
  'demoAccount',
  'cyrusaerol3',
  'ayherasophia',
  'cleirs0708',
  'arvymagimot',
  'enzobustria',
  'ggsgagG',
  'reneBaterbonia',
  'cabzerick31',
  'jericdaledolina',
];

const DEMO_ACCOUNTS = SOURCE_USERNAMES.map((_, index) => {
  const suffix = String(index + 1).padStart(2, '0');
  return {
    username: `synthetic_demo_${suffix}`,
    name: `SYNTHETIC DEMO ${suffix}`,
    email: `synthetic-demo-${suffix}@codapt.invalid`,
  };
});

function featureKey(row) {
  return [
    Number(row.success_rate),
    Number(row.avg_attempts),
    Number(row.avg_time_spent),
    Number(row.syntax_errors),
    Number(row.structural_errors),
    row.label,
  ].join('|');
}

function assertSamplesMatch(profiles, samples) {
  if (profiles.length !== samples.length) {
    throw new Error(`Expected ${samples.length} source profiles, found ${profiles.length}.`);
  }

  const expected = new Map();
  samples.forEach(sample => {
    const key = featureKey(sample);
    expected.set(key, (expected.get(key) || 0) + 1);
  });
  profiles.forEach(profile => {
    const key = featureKey(profile);
    if (!expected.has(key)) {
      throw new Error('A source profile does not match the supplied CSV; no changes were made.');
    }
    const remaining = expected.get(key) - 1;
    if (remaining === 0) expected.delete(key);
    else expected.set(key, remaining);
  });
  if (expected.size !== 0) {
    throw new Error('Some CSV samples are missing from the source accounts; no changes were made.');
  }
}

function createUnusablePasswordHash() {
  const randomSecret = crypto.randomBytes(48).toString('hex');
  return crypto.createHash('sha256').update(`${randomSecret}codapt_salt`).digest('hex');
}

async function moveProgress({ apply = false } = {}) {
  const samples = loadTrainingData();
  const client = await db.connect();

  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    const { rows: sources } = await client.query(
      `SELECT id, username
       FROM users
       WHERE username = ANY($1::text[])
       ORDER BY array_position($1::text[], username)
       FOR UPDATE`,
      [SOURCE_USERNAMES]
    );
    if (sources.length !== SOURCE_USERNAMES.length) {
      throw new Error('One or more original source accounts are missing; no changes were made.');
    }

    const { rows: activity } = await client.query(
      `SELECT u.username,
              (SELECT COUNT(*)::int FROM submissions s WHERE s.user_id = u.id) AS submissions,
              (SELECT COUNT(*)::int FROM user_profiles up WHERE up.user_id = u.id) AS profiles,
              (SELECT COUNT(*)::int FROM daily_progress dp WHERE dp.user_id = u.id) AS daily_rows
       FROM users u
       WHERE u.id = ANY($1::int[])
       ORDER BY array_position($1::int[], u.id)`,
      [sources.map(user => user.id)]
    );
    if (activity.some(user => user.submissions !== 0 || user.daily_rows !== 3)) {
      throw new Error('Source activity changed or does not match the seeded state; no changes were made.');
    }

    const { rows: profiles } = await client.query(
      `SELECT up.user_id, up.success_rate, up.avg_attempts, up.avg_time_spent,
              up.syntax_errors, up.structural_errors,
              up.performance_level AS label
       FROM user_profiles up
       WHERE up.user_id = ANY($1::int[])
       ORDER BY up.id`,
      [sources.map(user => user.id)]
    );
    assertSamplesMatch(profiles, samples);

    const { rows: collisions } = await client.query(
      `SELECT username, email
       FROM users
       WHERE username = ANY($1::text[]) OR email = ANY($2::text[])`,
      [
        DEMO_ACCOUNTS.map(account => account.username),
        DEMO_ACCOUNTS.map(account => account.email),
      ]
    );
    if (collisions.length) {
      throw new Error('A synthetic demo account name or email already exists; no changes were made.');
    }

    console.log(`Matched all ${samples.length} source profile rows to the CSV.`);
    console.log(`Confirmed ${activity.reduce((sum, user) => sum + user.daily_rows, 0)} derived daily-score rows and zero submissions.`);
    console.log('Planned demo accounts:');
    DEMO_ACCOUNTS.forEach((account, index) => {
      console.log(`${SOURCE_USERNAMES[index]} -> ${account.username} (${account.name})`);
    });

    if (!apply) {
      await client.query('ROLLBACK');
      console.log('Dry run only; database unchanged. Re-run with --apply to move these rows.');
      return;
    }

    const demoUsers = [];
    for (const account of DEMO_ACCOUNTS) {
      const { rows: inserted } = await client.query(
        `INSERT INTO users (name, username, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'student')
         RETURNING id, username`,
        [account.name, account.username, account.email, createUnusablePasswordHash()]
      );
      demoUsers.push(inserted[0]);
    }

    const sourceIds = sources.map(user => user.id);
    const targetIds = demoUsers.map(user => user.id);
    const { rowCount: movedProfiles } = await client.query(
      `UPDATE user_profiles AS up
       SET user_id = mapping.new_id
       FROM unnest($1::int[], $2::int[]) AS mapping(old_id, new_id)
       WHERE up.user_id = mapping.old_id`,
      [sourceIds, targetIds]
    );
    if (movedProfiles !== samples.length) {
      throw new Error(`Expected to move ${samples.length} profiles, moved ${movedProfiles}; rolling back.`);
    }

    const { rowCount: movedDaily } = await client.query(
      `UPDATE daily_progress AS dp
       SET user_id = mapping.new_id
       FROM unnest($1::int[], $2::int[]) AS mapping(old_id, new_id)
       WHERE dp.user_id = mapping.old_id`,
      [sourceIds, targetIds]
    );
    if (movedDaily !== SOURCE_USERNAMES.length * 3) {
      throw new Error(`Expected to move 30 daily scores, moved ${movedDaily}; rolling back.`);
    }

    const { rows: sourceCheck } = await client.query(
      `SELECT COUNT(*)::int AS row_count
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE u.username = ANY($1::text[])
       UNION ALL
       SELECT COUNT(*)::int
       FROM daily_progress dp
       JOIN users u ON u.id = dp.user_id
       WHERE u.username = ANY($1::text[])`,
      [SOURCE_USERNAMES]
    );
    if (sourceCheck.some(row => row.row_count !== 0)) {
      throw new Error('Synthetic source rows remain on original accounts; rolling back.');
    }

    await client.query('COMMIT');
    console.log(`Moved ${movedProfiles} CSV profiles and ${movedDaily} daily scores to clearly labeled synthetic demo accounts.`);
    console.log('Original accounts retain their user records and submissions; no submissions were changed.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  moveProgress({ apply: process.argv.includes('--apply') })
    .catch(error => {
      console.error(`Synthetic demo migration stopped: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { assertSamplesMatch, featureKey, DEMO_ACCOUNTS };