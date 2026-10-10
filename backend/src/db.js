const { Pool } = require('pg');

function buildPool() {
  let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (connectionString) {
    const isSsl = process.env.POSTGRES_SSL === 'true' || connectionString.includes('sslmode=require') || connectionString.includes('supabase');
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
    return new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 15,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: 'forgecrm-backend',
    });
  }

  // Fallback to individual env vars.
  //
  // BOTH prefixes are accepted on purpose. The code originally read DB_* while
  // .env.example documented POSTGRES_* — so anyone following the template set
  // variables that were silently ignored and got 'localhost', which surfaces as
  // ECONNREFUSED 127.0.0.1:5432 with nothing pointing at the real cause.
  // POSTGRES_* wins because it matches the official postgres image's own names.
  const env = process.env;
  return new Pool({
    host: env.POSTGRES_HOST || env.DB_HOST || 'localhost',
    port: parseInt(env.POSTGRES_PORT || env.DB_PORT || '5432', 10),
    database: env.POSTGRES_DB || env.DB_NAME || 'postgres',
    user: env.POSTGRES_USER || env.DB_USER || 'postgres',
    password: env.POSTGRES_PASSWORD || env.DB_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    application_name: 'forgecrm-backend',
  });
}

const pool = buildPool();

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

module.exports = pool;
