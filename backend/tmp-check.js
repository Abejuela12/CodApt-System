require('dotenv').config();
const { Pool } = require('pg');

const conn = process.env.DATABASE_URL;
console.log('ENV DATABASE_URL=', conn);

const p = new Pool({ connectionString: conn, ssl:{rejectUnauthorized:false} });
console.log('pool options:', p.options || 'no options');
console.log('connectionParameters:', p.connectionParameters || p.database);

(async() => {
  try {
    const client = await p.connect();
    console.log('connected as', client.connectionParameters.user);
    const res = await client.query('SELECT current_user, session_user');
    console.log('query result', res.rows);
    client.release();
  } catch (err) {
    console.error('DB ERROR', err.message);
  } finally {
    await p.end();
    process.exit(0);
  }
})();
