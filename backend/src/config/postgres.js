const { Pool } = require('pg');
const config = require('./config');

let pool;

const getPool = () => {
  if (!config.databaseUrl) {
    const error = new Error('DATABASE_URL is not configured on the backend.');
    error.statusCode = 503;
    throw error;
  }
  if (!pool) {
    // Newer pg treats sslmode=require as verify-full; strip it so the
    // explicit ssl option below wins (self-signed proxy chains).
    const cleanUrl = config.databaseUrl.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '');
    const needsSsl = /sslmode=(require|verify-ca|verify-full|prefer)/.test(config.databaseUrl) || Boolean(config.db?.ssl);
    pool = new Pool({
      connectionString: cleanUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: Number(process.env.PG_POOL_MAX) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error.message));
  }
  return pool;
};

const query = (text, values) => getPool().query(text, values);

const withTransaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, withTransaction };
