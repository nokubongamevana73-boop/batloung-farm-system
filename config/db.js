
require('dotenv').config();
const mysql = require('mysql2/promise');


const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'batloung_farm_db',

  ssl: {},

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(poolConfig);

let isConnected = false;

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    isConnected = true;

    console.log(
      `[Database] Successfully connected to TiDB: ${poolConfig.database}`
    );

    connection.release();
    return { success: true };

  } catch (error) {
    isConnected = false;

    console.error('[Database Warning] Connection failed.');
    console.error('Error Code:', error.code || 'UNKNOWN');
    console.error('Error Message:', error.message);

    return { success: false, error: error.message };
  }
}

function getConnectionStatus() {
  return isConnected;
}

module.exports = {
  pool,
  testConnection,
  getConnectionStatus,
  poolConfig
};
