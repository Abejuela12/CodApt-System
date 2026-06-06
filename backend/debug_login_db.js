const db = require('./db');
(async ()=>{
  const [rows] = await db.query(`SELECT id, email, username, password_hash FROM users WHERE email = 'learner1@codapt.test' OR username = 'learner1' LIMIT 1`);
  console.log(rows);
  process.exit(0);
})();
