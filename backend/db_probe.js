require('dotenv').config();
const db = require('./db');
(async () => {
  try {
    console.log('=== PROBLEMS ===');
    const { rows: problems } = await db.query(
      `SELECT id, title, language, concept, difficulty, problem_tier, required_construct, expected_output FROM problems ORDER BY id LIMIT 200`
    );
    console.log(JSON.stringify(problems, null, 2));

    console.log('\n=== USER PROFILES ===');
    const { rows: profiles } = await db.query(
      `SELECT user_id, language, concept, tasks_completed, total_tasks, success_rate, avg_attempts, avg_time_spent FROM user_profiles ORDER BY user_id, language, concept LIMIT 200`
    );
    console.log(JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
