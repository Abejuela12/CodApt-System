const db = require('./backend/db');
(async () => {
  try {
    for (const table of ['users', 'daily_progress', 'user_profiles']) {
      const { rows } = await db.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [table]
      );
      console.log('TABLE', table);
      rows.forEach(r => console.log(`${r.column_name}:${r.data_type}`));
      console.log('---');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
