require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSetup() {
  console.log('====================================================');
  console.log('  Batloung Farm Distribution System - DB Setup');
  console.log('====================================================');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);

  let connection;
  try {
    //  Initial connection (without DB selected) to ensure DB exists
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Successfully connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'batloung_farm_db';
    console.log(`Ensuring database '${dbName}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`✓ Using database '${dbName}'.`);

    //  Read and run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Creating tables and constraints from schema.sql...');
    await connection.query(schemaSql);
    console.log('✓ Successfully created all 8 relational tables and constraints.');

    //  Read and run sample_data.sql
    const sampleDataPath = path.join(__dirname, 'sample_data.sql');
    const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');
    console.log('Seeding realistic sample data from sample_data.sql...');
    await connection.query(sampleDataSql);
    console.log('✓ Successfully seeded sample data across all tables.');

    console.log('====================================================');
    console.log(' Database initialization completed successfully!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n✗ Database setup failed:');
    console.error(`  Code: ${error.code || 'UNKNOWN'}`);
    console.error(`  Message: ${error.message}`);
    console.log('\nTIP: Please check your .env file credentials.');
    console.log('Make sure DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD match your local MySQL Server.');
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
