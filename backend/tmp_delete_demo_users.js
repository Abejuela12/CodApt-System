const db = require('./db');
(async () => {
  try {
    const ids = [42, 43, 44];
    const res = await db.query("SELECT table_name FROM information_schema.columns WHERE column_name = 'user_id' AND table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name).filter(n => n !== 'users');
    console.log('Deleting demo data from tables:', tables);
    for (const table of tables) {
      const q = `DELETE FROM ${table} WHERE user_id = ANY($1::int[])`;
      const r = await db.query(q, [ids]);
      console.log(`${table} deleted ${r.rowCount}`);
    }
    const r2 = await db.query('DELETE FROM users WHERE id = ANY($1::int[])', [ids]);
    console.log('users deleted', r2.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
