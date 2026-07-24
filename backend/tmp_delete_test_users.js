const db = require("./db");
(async () => {
  try {
    const ids = [27,28,29,30,31,32,33,34,35,36,37,38,39,41];
    console.log('Deleting test accounts', ids);
    await db.query('DELETE FROM daily_progress WHERE user_id = ANY($1::int[])', [ids]);
    await db.query('DELETE FROM user_profiles WHERE user_id = ANY($1::int[])', [ids]);
    await db.query('DELETE FROM users WHERE id = ANY($1::int[])', [ids]);
    console.log('Deleted test accounts');
  } catch (e) {
    console.error(e);
  } finally {
    await db.end();
  }
})();
