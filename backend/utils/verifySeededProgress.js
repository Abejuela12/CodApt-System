'use strict';

const assert = require('node:assert/strict');
const db = require('../db');
const { loadTrainingData } = require('./seedDemoProgress');

const USERNAMES = Array.from({ length: 36 }, (_, index) =>
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

async function verify() {
  const samples = loadTrainingData();
  const { rows: profiles } = await db.query(
    `SELECT u.username, up.success_rate, up.avg_attempts, up.avg_time_spent,
            up.syntax_errors, up.structural_errors,
            up.performance_level AS label
     FROM user_profiles up
     JOIN users u ON u.id = up.user_id
     WHERE u.username = ANY($1::text[])`,
    [USERNAMES]
  );
  assert.equal(profiles.length, samples.length, 'all CSV profile rows must be present');

  const expected = new Map();
  samples.forEach(sample => {
    const key = featureKey(sample);
    expected.set(key, (expected.get(key) || 0) + 1);
  });
  profiles.forEach(profile => {
    const key = featureKey(profile);
    assert(expected.has(key), `unexpected profile row for ${profile.username}`);
    const remaining = expected.get(key) - 1;
    if (remaining === 0) expected.delete(key);
    else expected.set(key, remaining);
  });
  assert.equal(expected.size, 0, 'every CSV feature row must be represented exactly once');

  const { rows: userCounts } = await db.query(
    `SELECT u.username, COUNT(*)::int AS profile_count
     FROM user_profiles up
     JOIN users u ON u.id = up.user_id
     WHERE u.username = ANY($1::text[])
     GROUP BY u.username`,
    [USERNAMES]
  );
  assert.equal(userCounts.length, USERNAMES.length, 'all 36 seeded accounts must be present');
  assert.equal(
    userCounts.reduce((sum, user) => sum + user.profile_count, 0),
    samples.length,
    'profile distribution must include all CSV rows'
  );
  assert(userCounts.every(user => user.profile_count === 1), 'each account must have exactly one CSV profile');

  const { rows: dailyRows } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM daily_progress dp
     JOIN users u ON u.id = dp.user_id
     WHERE u.username = ANY($1::text[])`,
    [USERNAMES]
  );
  assert.equal(dailyRows[0].count, USERNAMES.length, 'each account must have one derived daily score');

  const { rows: adminRows } = await db.query(
    `SELECT u.username,
            COALESCE(lp.progress, 0)::int AS progress
     FROM users u
     LEFT JOIN LATERAL (
       SELECT GREATEST(
         COALESCE(
           (SELECT ROUND(AVG(concept_completion) * 100)
            FROM (
              SELECT CASE
                       WHEN total_tasks > 0
                        AND tasks_completed >= total_tasks
                        AND success_rate >= 0.60 THEN 1
                       ELSE 0
                     END AS concept_completion
              FROM user_profiles
              WHERE user_id = u.id
            ) concept_progress),
           0
         ),
         COALESCE(
           (SELECT ROUND(AVG(best_score))
            FROM (
              SELECT language, MAX(score) AS best_score
              FROM daily_progress
              WHERE user_id = u.id
              GROUP BY language
            ) best_scores),
           0
         )
       ) AS progress
     ) lp ON true
     WHERE u.username = ANY($1::text[])`,
    [USERNAMES]
  );
  assert.equal(adminRows.length, USERNAMES.length, 'admin query must return all seeded accounts');

  const { rows: originalRows } = await db.query(
    `SELECT u.username,
            (SELECT COUNT(*)::int FROM user_profiles up WHERE up.user_id = u.id) AS profiles,
            (SELECT COUNT(*)::int FROM daily_progress dp WHERE dp.user_id = u.id) AS daily_rows
     FROM users u
     WHERE u.username = ANY($1::text[])`,
    [ORIGINAL_USERNAMES]
  );
  assert.equal(originalRows.length, ORIGINAL_USERNAMES.length, 'original accounts must remain present');
  assert(originalRows.every(user => user.profiles === 0 && user.daily_rows === 0), 'original accounts must not contain synthetic progress');

  const { rows: labels } = await db.query(
    `SELECT username, name
     FROM users
     WHERE username = ANY($1::text[])`,
    [USERNAMES]
  );
  assert.equal(labels.length, 36, 'all 36 demo accounts must be returned');
  assert(labels.every(user => user.name.startsWith('SYNTHETIC DEMO ')), 'demo accounts must be visibly labeled synthetic');

  const progressValues = adminRows.map(user => user.progress);
  const nonzeroProgressCount = progressValues.filter(value => value > 0).length;
  console.log(
    `PASS: all ${samples.length} CSV rows match exactly; ${userCounts.length} visibly synthetic accounts have one row each; ` +
    `${dailyRows[0].count} daily scores exist; API progress range is ${Math.min(...progressValues)}-${Math.max(...progressValues)}% ` +
    `(${nonzeroProgressCount} nonzero under existing progress rules); original accounts have no synthetic profiles/scores.`
  );
}

verify()
  .catch(error => {
    console.error(`Seeded-progress verification failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());