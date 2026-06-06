require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

(async () => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, password_hash FROM users WHERE password_hash IS NOT NULL"
    );

    const updates = [];
    for (const row of rows) {
      const hash = row.password_hash || '';
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        continue;
      }

      const newHash = await bcrypt.hash(hash, 10);
      updates.push({ id: row.id, email: row.email, password_hash: newHash });
    }

    if (updates.length === 0) {
      console.log('No plaintext password_hash values found.');
      process.exit(0);
    }

    for (const user of updates) {
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [user.password_hash, user.id]);
      console.log(`Updated user ${user.email} (id=${user.id})`);
    }

    console.log(`Migrated ${updates.length} user(s) to bcrypt password_hash.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
