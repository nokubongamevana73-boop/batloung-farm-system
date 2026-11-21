require('dotenv').config();
const mysql = require('mysql2/promise');

// Configure connection pool with credentials loaded strictly from environment variables
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'batloung_farm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create the connection pool
const pool = mysql.createPool(poolConfig);

let isConnected = false;

/**
 * Verifies database connection on startup.
 * Handles failures gracefully so the application does NOT crash unexpectedly.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    isConnected = true;
    console.log(`[Database] Successfully connected to MySQL database: ${poolConfig.database} on ${poolConfig.host}:${poolConfig.port}`);
    connection.release();
    return { success: true };
  } catch (error) {
    isConnected = false;
    console.error('\n[Database Warning] Could not establish connection to MySQL server:');
    console.error(`  Error Code   : ${error.code || 'UNKNOWN'}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Target Host  : ${poolConfig.host}:${poolConfig.port}`);
    console.error(`  Target DB    : ${poolConfig.database}`);
    console.error('[Database Tip] Check that MySQL service is running and credentials in your .env file are correct.\n');
    return { success: false, error: error.message };
  }
}

/**
 * Returns whether the database is currently connected.
 */
function getConnectionStatus() {
  return isConnected;
}

module.exports = {
  pool,
  testConnection,
  getConnectionStatus,
  poolConfig
};
