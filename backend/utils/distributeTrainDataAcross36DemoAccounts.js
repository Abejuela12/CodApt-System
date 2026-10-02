'use strict';

const crypto = require('crypto');
const db = require('../db');
const { loadTrainingData } = require('./seedDemoProgress');

const SOURCE_USERNAMES = Array.from({ length: 10 }, (_, index) =>
  `synthetic_demo_${String(index + 1).padStart(2, '0')}`
);
const ORIGINAL_USERNAMES = [
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

function accountFor(index) {
  const suffix = String(index + 1).padStart(2, '0');
  return {
    username: `synthetic_demo_${suffix}`,
    name: `SYNTHETIC DEMO ${suffix}`,
    email: `synthetic-demo-${suffix}@codapt.invalid`,
  };
}

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

function matchProfilesToSamples(profiles, samples) {
  if (profiles.length !== samples.length) {
    throw new Error(`Expected ${samples.length} source rows, found ${profiles.length}.`);
  }

  const available = new Map();
  samples.forEach((sample, index) => {
    const key = featureKey(sample);
    const indices = available.get(key) || [];
    indices.push(index);
    available.set(key, indices);
  });

  return profiles.map(profile => {
    const key = featureKey(profile);
    const indices = available.get(key);
    if (!indices?.length) {
      throw new Error('A stored profile does not match an unused CSV row.');
    }
    return { profile, sampleIndex: indices.shift() };
  });
}

function createUnusablePasswordHash() {
  const randomSecret = crypto.randomBytes(48).toString('hex');
  return crypto.createHash('sha256').update(`${randomSecret}codapt_salt`).digest('hex');
}

async function distribute({ apply = false } = {}) {
  const samples = loadTrainingData();
  if (samples.length !== 36) {
    throw new Error(`Expected exactly 36 CSV rows, found ${samples.length}.`);
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    const { rows: sourceUsers } = await client.query(
      `SELECT id, username
       FROM users
       WHERE username = ANY($1::text[])
       ORDER BY username
       FOR UPDATE`,
      [SOURCE_USERNAMES]
    );
    if (sourceUsers.length !== SOURCE_USERNAMES.length) {
      throw new Error('The 10 current synthetic accounts were not all found. No changes were made.');
    }

    const sourceIds = sourceUsers.map(user => user.id);
    const { rows: counts } = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM user_profiles WHERE user_id = ANY($1::int[])) AS profiles,
         (SELECT COUNT(*)::int FROM daily_progress WHERE user_id = ANY($1::int[])) AS daily_rows,
         (SELECT COUNT(*)::int FROM submissions WHERE user_id = ANY($1::int[])) AS submissions`,
      [sourceIds]
    );
    if (counts[0].profiles !== 36 || counts[0].daily_rows !== 30 || counts[0].submissions !== 0) {
      throw new Error(
        `Unexpected source state (profiles=${counts[0].profiles}, daily=${counts[0].daily_rows}, ` +
        `submissions=${counts[0].submissions}); no changes were made.`
      );
    }

    const { rows: profiles } = await client.query(
      `SELECT id, user_id, language, concept, total_attempts, tasks_completed,
              total_tasks, success_rate, avg_time_spent, avg_attempts,
              syntax_errors, structural_errors, performance_level AS label
       FROM user_profiles
       WHERE user_id = ANY($1::int[])
       ORDER BY id
       FOR UPDATE`,
      [sourceIds]
    );
    const matchedProfiles = matchProfilesToSamples(profiles, samples);

    const targetNames = samples.map((_, index) => accountFor(index));
    const { rows: collisions } = await client.query(
      `SELECT id, username, email
       FROM users
       WHERE username = ANY($1::text[]) OR email = ANY($2::text[])`,
      [
        targetNames.map(account => account.username),
        targetNames.map(account => account.email),
      ]
    );
    const allowedExistingIds = new Set(sourceIds);
    if (collisions.some(user => !allowedExistingIds.has(user.id))) {
      throw new Error('A target synthetic username/email is already used by another account. No changes were made.');
    }

    const { rows: originalRows } = await client.query(
      `SELECT u.username,
              (SELECT COUNT(*)::int FROM submissions s WHERE s.user_id = u.id) AS submissions
       FROM users u
       WHERE u.username = ANY($1::text[])`,
      [ORIGINAL_USERNAMES]
    );
    if (originalRows.length !== ORIGINAL_USERNAMES.length || originalRows.some(user => user.submissions !== 0)) {
      throw new Error('Original student accounts changed or have submissions; no changes were made.');
    }

    console.log('Dry-run plan:');
    console.log(`- ${samples.length} CSV rows will be assigned one per labeled synthetic account.`);
    console.log('- 10 existing synthetic accounts will be retained; 26 more will be created.');
    console.log('- 30 old aggregate daily scores will be replaced by 36 individual demo-account scores.');
    console.log('- Original student accounts and all submissions remain untouched.');
    if (!apply) {
      await client.query('ROLLBACK');
      console.log('Dry run only; database unchanged. Re-run with --apply to commit.');
      return;
    }

    const demoUsers = [];
    for (let index = 0; index < targetNames.length; index += 1) {
      const account = targetNames[index];
      const existing = sourceUsers.find(user => user.username === account.username);
      if (existing) {
        const { rows: updated } = await client.query(
          `UPDATE users
           SET name = $1
           WHERE id = $2
           RETURNING id, username`,
          [account.name, existing.id]
        );
        demoUsers.push(updated[0]);
      } else {
        const { rows: inserted } = await client.query(
          `INSERT INTO users (name, username, email, password_hash, role)
           VALUES ($1, $2, $3, $4, 'student')
           RETURNING id, username`,
          [account.name, account.username, account.email, createUnusablePasswordHash()]
        );
        demoUsers.push(inserted[0]);
      }
    }

    const { rowCount: deletedDaily } = await client.query(
      'DELETE FROM daily_progress WHERE user_id = ANY($1::int[])',
      [sourceIds]
    );
    if (deletedDaily !== 30) {
      throw new Error(`Expected to replace 30 old daily scores, deleted ${deletedDaily}; rolling back.`);
    }

    for (const { profile, sampleIndex } of matchedProfiles) {
      const targetUser = demoUsers[sampleIndex];
      const { rowCount } = await client.query(
        `UPDATE user_profiles SET user_id = $1 WHERE id = $2 AND user_id = $3`,
        [targetUser.id, profile.id, profile.user_id]
      );
      if (rowCount !== 1) {
        throw new Error(`Could not move profile ${profile.id}; rolling back.`);
      }

      const score = Math.round(Number(profile.success_rate) * 100);
      const insertedDaily = await client.query(
        `INSERT INTO daily_progress (user_id, language, progress_date, score)
         VALUES ($1, $2, CURRENT_DATE, $3)`,
        [targetUser.id, profile.language, score]
      );
      if (insertedDaily.rowCount !== 1) {
        throw new Error(`Could not add daily score for ${targetUser.username}; rolling back.`);
      }
    }

    const { rows: finalCounts } = await client.query(
      `SELECT u.username,
              (SELECT COUNT(*)::int FROM user_profiles up WHERE up.user_id = u.id) AS profiles,
              (SELECT COUNT(*)::int FROM daily_progress dp WHERE dp.user_id = u.id) AS daily_rows
       FROM users u
       WHERE u.username LIKE 'synthetic_demo_%'
       ORDER BY u.username`
    );
    if (
      finalCounts.length !== 36 ||
      finalCounts.some(user => user.profiles !== 1 || user.daily_rows !== 1)
    ) {
      throw new Error('Final account distribution is not exactly one profile and score per account; rolling back.');
    }

    await client.query('COMMIT');
    console.log('Committed: exactly 36 labeled synthetic demo accounts, one CSV profile and one daily score each.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  distribute({ apply: process.argv.includes('--apply') })
    .catch(error => {
      console.error(`36-account distribution stopped: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { accountFor, featureKey, matchProfilesToSamples };