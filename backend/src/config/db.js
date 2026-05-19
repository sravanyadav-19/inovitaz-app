/**
 * PostgreSQL Database Configuration
 * Using pg (node-postgres)
 */

const { Pool } = require("pg");
require("dotenv").config();

const logger = require("../utils/logger");

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "inovitaz_db",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (process.env.NODE_ENV === "production") {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    logger.info(`Database connected - Server time: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    logger.error("Database connection failed", { message: error.message });
    throw error;
  }
};

/**
 * IMPORTANT:
 * This helper returns result.rows directly, not the full pg result.
 */
const query = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error("Query error", {
      message: error.message,
      sql,
    });
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};