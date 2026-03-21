const mysql = require('mysql2/promise');

// Load .env only for LOCAL development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const logger = require('../utils/logger');

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Enforce SSL for Cloud DB
  ssl: {
    rejectUnauthorized: false 
  }
};

const pool = mysql.createPool(poolConfig);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection established');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed:', { message: error.message });
    throw error;
  }
};

// Query helper with error handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    logger.error('Query error:', { message: error.message, sql, params });
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