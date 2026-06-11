// db.js (POSTGRES / SUPABASE)
require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
  
});

db.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

module.exports = db;