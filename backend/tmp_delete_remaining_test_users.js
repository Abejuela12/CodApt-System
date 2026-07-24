const db = require("./db");
(async () => {
  try {
    const patterns = [
      "%resume_verify%",
      "%resumeverify%",
      "%resumecheck%",
      "%stepverify%",
      "%verifyfix%",
      "%test@test.com%"
    ];
    let ids = new Set();
    for (const pat of patterns) {
      const res = await db.query(
        "SELECT id,email,username,name FROM users WHERE email ILIKE $1 OR username ILIKE $1 OR name ILIKE $1",
        [pat]
      );
      for (const row of res.rows) ids.add(row.id);
    }
    ids = Array.from(ids).sort((a,b)=>a-b);
    if (ids.length === 0) {
      console.log('No matching test users found.');
      return;
    }
    console.log('Deleting test users', ids);
    await db.query('DELETE FROM daily_progress WHERE user_id = ANY($1::int[])', [ids]);
    await db.query('DELETE FROM user_profiles WHERE user_id = ANY($1::int[])', [ids]);
    await db.query('DELETE FROM users WHERE id = ANY($1::int[])', [ids]);
    console.log('Deleted test users', ids);
  } catch (e) {
    console.error(e);
  } finally {
    await db.end();
  }
})();
