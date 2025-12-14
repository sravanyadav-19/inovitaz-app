const mysql = require('mysql2/promise');

// Load .env only for LOCAL development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const poolConfig = {
  host: process.env.DB_HOST,                     // TiDB host
  port: Number(process.env.DB_PORT),            // 4000
  user: process.env.DB_USER,                    // 256HsJ85VeRhi2V.root
  password: process.env.DB_PASSWORD,            // your TiDB password
  database: process.env.DB_NAME,                // MUST be "test"
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
};

const pool = mysql.createPool(poolConfig);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

// Query helper with error handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};