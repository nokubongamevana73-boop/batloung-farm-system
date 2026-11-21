
require('dotenv').config();

const mysql = require('mysql2/promise');

async function runSetup() {
  console.log('==============================================');
  console.log(' Batloung Farm Distribution System - DB Setup');
  console.log('==============================================');

  

  const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
    },
    multipleStatements: true
  };

  let connection;

  try {
    console.log('Connecting to TiDB Cloud...');

    connection = await mysql.createConnection(dbConfig);

    console.log('Successfully connected to TiDB Cloud.');

    const dbName = process.env.DB_NAME || 'batloung_farm_db';

    console.log(`Creating database '${dbName}' if needed...`);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    await connection.query(`USE \`${dbName}\``);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating database tables...');
    await connection.query(schemaSql);

    const sampleDataPath = path.join(__dirname, 'sample_data.sql');
    const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');

    console.log('Adding sample data...');
    await connection.query(sampleDataSql);

    console.log('==============================================');
    console.log('Database setup completed successfully!');
    console.log('==============================================');

  } catch (error) {
    console.error('Database setup failed.');
    console.error('Error Code:', error.code || 'UNKNOWN');
    console.error('Error Message:', error.message);
    process.exitCode = 1;

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runSetup();
}

module.exports = runSetup;
