// db.js
require('dotenv').config();
const mysql = require('mysql2');

const dbPassword = process.env.DB_PASSWORD !== undefined
  ? process.env.DB_PASSWORD
  : process.env.DB_PASS || 'root';

const db = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user:     process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'codapt_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db.promise();