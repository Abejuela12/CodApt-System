const db=require('./db');
(async()=>{
  try {
    const sql = `SELECT u.id,u.name,u.username,u.email,u.photo,TO_CHAR(u.created_at,'YYYY-MM-DD') AS joined_date,COALESCE(SUM(up.tasks_completed),0) AS tasks_completed,COALESCE(SUM(up.total_tasks),0) AS total_tasks,CASE WHEN COALESCE(SUM(up.total_tasks),0)>0 THEN ROUND(SUM(up.tasks_completed)::numeric / SUM(up.total_tasks) * 100) ELSE 0 END AS progress,COALESCE(COUNT(DISTINCT up.concept),0) AS concepts_count,COALESCE(MAX(dp.progress_date)::text,'') AS last_active FROM users u LEFT JOIN user_profiles up ON up.user_id=u.id LEFT JOIN daily_progress dp ON dp.user_id=u.id GROUP BY u.id,u.created_at ORDER BY u.name ASC`;
    const { rows } = await db.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
