const db = require('./db');
(async () => {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'users'");
    if (!rows || rows.length === 0) {
      console.log('No users table found');
      process.exit(0);
    }
    const [cols] = await db.query("SHOW COLUMNS FROM users");
    console.log('Columns:');
    console.table(cols.map(c => ({Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Extra: c.Extra})));
    const [sample] = await db.query('SELECT * FROM users LIMIT 5');
    console.log('Sample rows:');
    console.table(sample);
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  }
})();
