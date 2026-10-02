'use strict';

const assert = require('node:assert/strict');
const db = require('../db');

async function verifyRemoval() {
  const { rows } = await db.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE username LIKE 'synthetic_demo_%') AS synthetic_users,
       (SELECT COUNT(*)::int FROM users WHERE username NOT LIKE 'synthetic_demo_%') AS remaining_users,
       (SELECT COUNT(*)::int FROM user_profiles up JOIN users u ON u.id = up.user_id WHERE u.username LIKE 'synthetic_demo_%') AS synthetic_profiles,
       (SELECT COUNT(*)::int FROM daily_progress dp JOIN users u ON u.id = dp.user_id WHERE u.username LIKE 'synthetic_demo_%') AS synthetic_scores,
       (SELECT COUNT(*)::int FROM submissions s JOIN users u ON u.id = s.user_id WHERE u.username LIKE 'synthetic_demo_%') AS synthetic_submissions`
  );

  const result = rows[0];
  assert.equal(result.synthetic_users, 0);
  assert.equal(result.synthetic_profiles, 0);
  assert.equal(result.synthetic_scores, 0);
  assert.equal(result.synthetic_submissions, 0);
  assert.equal(result.remaining_users, 50);

  console.log(
    `PASS: ${result.synthetic_users} synthetic accounts, profiles, scores, or submissions remain; ` +
    `${result.remaining_users} non-synthetic user accounts are still present.`
  );
}

verifyRemoval()
  .catch(error => {
    console.error(`Synthetic removal verification failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());