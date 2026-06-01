// db.js
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'codapt_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db.promise();