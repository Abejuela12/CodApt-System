const db = require("./db");
(async () => {
  try {
    const patterns = [
      "%resume_verify%",
      "%resumeverify%",
      "%resumecheck%",
      "%stepverify%",
      "%verifyfix%",
      "%test@test.com%",
      "%test%",
      "%profilefix%",
      "%profilecheck%",
      "%profileprop%",
      "%persist%",
      "%traceuid%",
      "%debugdom%",
      "%userflow%",
      "%backenduser%"
    ];
    for (const pat of patterns) {
      const res = await db.query(
        "SELECT id,email,username,name,created_at FROM users WHERE email ILIKE $1 OR username ILIKE $1 OR name ILIKE $1 ORDER BY created_at DESC",
        [pat]
      );
      if (res.rowCount) {
        console.log('PATTERN', pat);
        console.log(JSON.stringify(res.rows, null, 2));
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await db.end();
  }
})();
