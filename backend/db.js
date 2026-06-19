// db.js (POSTGRES / SUPABASE)
require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Set it in backend/.env or your environment.');
}

console.log('🔐 DATABASE_URL (first 50 chars):', databaseUrl.substring(0, 50) + '...');

let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch (err) {
  throw new Error(`Invalid DATABASE_URL format: ${err.message}`);
}

// Validate all required credentials are present
if (!parsedUrl.hostname) throw new Error('DATABASE_URL missing hostname');
if (!parsedUrl.username) throw new Error('DATABASE_URL missing username');
if (!parsedUrl.password) throw new Error('DATABASE_URL missing password');

const parsedUsername = decodeURIComponent(parsedUrl.username);
const parsedPassword = decodeURIComponent(parsedUrl.password);
const parsedDatabase = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'postgres';

const poolConfig = {
  host: parsedUrl.hostname,
  port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
  user: parsedUsername,
  password: parsedPassword,
  database: parsedDatabase,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('✅ DB Pool Config Parsed:', { 
  host: poolConfig.host, 
  port: poolConfig.port, 
  user: poolConfig.user, 
  database: poolConfig.database,
  ssl: poolConfig.ssl,
  passwordLength: poolConfig.password.length
});

// Use the exact connection string so pg receives the original credentials
const db = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// Log when a new client is checked out from the pool
db.on('connect', (client) => {
  try {
    console.log('🔌 DB client connected as:', client.user || (client.connectionParameters && client.connectionParameters.user));
  } catch (e) {
    console.log('🔌 DB client connected (user unknown)');
  }
});

// Run a quick initial connection check to surface auth issues early
(async () => {
  try {
    const client = await db.connect();
    console.log('🔍 DB initial connection OK as', client.user || (client.connectionParameters && client.connectionParameters.user));
    client.release();
  } catch (err) {
    console.error('❌ DB initial connection failed:', err.message);
    console.error('   code:', err.code);
    console.error('   detail:', err.detail || 'N/A');
    console.error('   parsed username:', poolConfig.user);
    console.error('   using connectionString (first50):', databaseUrl.substring(0,50) + '...');
  }
})();

// Log connection errors
db.on('error', (err) => {
  console.error('❌ Unexpected DB pool error:', err.message);
  console.error('   Error code:', err.code);
  console.error('   Details:', err.detail || 'N/A');
});

// Wrap db.query to add detailed logging
const originalQuery = db.query.bind(db);
db.query = async function(text, values, callback) {
  const queryId = Math.random().toString(36).substring(7);
  const queryText = typeof text === 'string' ? text : text.text;
  const shortQuery = queryText.substring(0, 80).replace(/\n/g, ' ');
  
  console.log(`📝 [${queryId}] Query: ${shortQuery}${queryText.length > 80 ? '...' : ''}`);
  if (values && values.length > 0) {
    console.log(`   Values: ${JSON.stringify(values)}`);
  }
  
  try {
    const startTime = Date.now();
    const result = await originalQuery(text, values, callback);
    const duration = Date.now() - startTime;
    console.log(`✅ [${queryId}] Success (${duration}ms) - ${result.rowCount} rows`);
    return result;
  } catch (err) {
    console.error(`❌ [${queryId}] FAILED: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Query: ${shortQuery}${queryText.length > 80 ? '...' : ''}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);
    throw err;
  }
};

module.exports = db;