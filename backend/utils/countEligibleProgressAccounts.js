'use strict';

const db = require('../db');

async function main() {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.name,
            EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = u.id) AS has_profiles,
            EXISTS (SELECT 1 FROM daily_progress dp WHERE dp.user_id = u.id) AS has_daily_progress,
            EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id) AS has_submissions,
            COALESCE(progress.admin_progress, 0)::int AS admin_progress
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
       ) AS admin_progress
     ) progress ON true
     WHERE u.role = 'student'
     ORDER BY u.created_at, u.id`
  );

  const completelyEmpty = rows.filter(user =>
    !user.has_profiles && !user.has_daily_progress && !user.has_submissions
  );
  const zeroAdminProgress = rows.filter(user => user.admin_progress === 0);
  const seededRows = 36;

  console.log(`Student accounts total: ${rows.length}`);
  console.log(`Completely empty accounts (no profiles, daily progress, or submissions): ${completelyEmpty.length}`);
  console.log(`Accounts with zero admin progress: ${zeroAdminProgress.length}`);
  console.log(`Empty accounts needed to distribute ${seededRows} rows at 3-4 rows each: ${Math.ceil(seededRows / 4)}-${Math.floor(seededRows / 3)}`);
  console.log('Completely empty accounts:');
  console.table(completelyEmpty.map(user => ({ id: user.id, username: user.username, name: user.name })));
  console.log('Accounts with zero admin progress and existing learning records:');
  console.table(zeroAdminProgress
    .filter(user => !completelyEmpty.includes(user))
    .map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      hasProfiles: user.has_profiles,
      hasDailyProgress: user.has_daily_progress,
      hasSubmissions: user.has_submissions,
    })));
  console.log('Those accounts have existing data and are not counted as completely empty targets.');
}

main()
  .catch(error => {
    console.error(`Account count failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());