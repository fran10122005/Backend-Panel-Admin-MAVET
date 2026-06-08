const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
  console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));
  const client = new Client({
    connectionString,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connection successful with Client');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection error with Client:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
