const db = require('./db');
(async () => {
  try {
    const userId = 5;
    console.log('=== user_profiles ===');
    const r1 = await db.query(
      `SELECT id, language, concept, tasks_completed, total_tasks, success_rate FROM user_profiles WHERE user_id=$1 ORDER BY language, concept`,
      [userId]
    );
    console.table(r1.rows);

    console.log('=== daily_progress ===');
    const r2 = await db.query(
      `SELECT id, user_id, language, progress_date, score FROM daily_progress WHERE user_id=$1 ORDER BY progress_date DESC, language`,
      [userId]
    );
    console.table(r2.rows);

    console.log('=== admin users row ===');
    const r3 = await db.query(
      `SELECT u.id, u.name, COALESCE(SUM(up.tasks_completed), 0) AS tasks_completed, COALESCE(SUM(up.total_tasks), 0) AS total_tasks,
              COALESCE(lp.progress, 0) AS progress
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT GREATEST(
           COALESCE(
             (SELECT ROUND(AVG(concept_completion) * 100)
              FROM (
                SELECT CASE
                         WHEN total_tasks > 0 AND tasks_completed > 0 AND success_rate >= 0.80 THEN 1
                         WHEN total_tasks > 0 AND tasks_completed > 0 THEN LEAST(success_rate, 1)
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
                FROM daily_progress dp
                WHERE dp.user_id = u.id
                GROUP BY language
              ) best_scores),
             0
           )
         ) AS progress
       ) lp ON true
       LEFT JOIN LATERAL (
         SELECT TO_CHAR(MAX(progress_date), 'YYYY-MM-DD') AS last_active
         FROM daily_progress dp
         WHERE dp.user_id = u.id
       ) dp ON true
       WHERE u.id = $1
       GROUP BY u.id, u.created_at, dp.last_active, lp.progress`,
      [userId]
    );
    console.table(r3.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
