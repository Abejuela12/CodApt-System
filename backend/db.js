// db.js (POSTGRES / SUPABASE)
require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL?.trim();

let db;

if (!databaseUrl) {
  console.error('⚠️ DATABASE_URL is not set in environment variables! DB operations will fail until DATABASE_URL is configured in Vercel.');
  db = {
    query: async () => {
      throw new Error('DATABASE_URL is not configured in Vercel environment variables. Please add DATABASE_URL under Project Settings -> Environment Variables in Vercel.');
    },
    connect: async () => {
      throw new Error('DATABASE_URL is not configured.');
    },
    on: () => {}
  };
} else {
  console.log('🔐 DATABASE_URL (first 50 chars):', databaseUrl.substring(0, 50) + '...');

  db = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000
  });

  db.on('connect', (client) => {
    try {
      console.log('🔌 DB client connected as:', client.user || (client.connectionParameters && client.connectionParameters.user));
    } catch (e) {
      console.log('🔌 DB client connected');
    }
  });

  db.on('error', (err) => {
    console.error('❌ Unexpected DB pool error:', err.message);
  });
}

module.exports = db;