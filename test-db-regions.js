require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testDatabase() {
  console.log('Testing direct PostgreSQL connection...');
  
  // Test with ap-south-1 region pooler
  console.log('\n--- Testing with ap-south-1 region pooler (6543 port) ---');
  await testConnection("postgresql://postgres.qpulpytptbwwumicyzwr:ascendasterachievers@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
  
  // Test with ap-south-1 region direct
  console.log('\n--- Testing with ap-south-1 region direct (5432 port) ---');
  await testConnection("postgresql://postgres.qpulpytptbwwumicyzwr:ascendasterachievers@aws-0-ap-south-1.pooler.supabase.com:5432/postgres");
  
  // Test with us-east-1 region pooler
  console.log('\n--- Testing with us-east-1 region pooler (6543 port) ---');
  await testConnection("postgresql://postgres.qpulpytptbwwumicyzwr:ascendasterachievers@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
  
  // Test with us-east-1 region direct
  console.log('\n--- Testing with us-east-1 region direct (5432 port) ---');
  await testConnection("postgresql://postgres.qpulpytptbwwumicyzwr:ascendasterachievers@aws-0-us-east-1.pooler.supabase.com:5432/postgres");
}

async function testConnection(connectionString) {
  console.log(`Connection string: ${connectionString}`);
  
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000, // 5 seconds
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to the database');
    
    const result = await client.query('SELECT current_timestamp, version()');
    console.log(`✅ Query successful: Server time is ${result.rows[0].current_timestamp}`);
    console.log(`✅ Database version: ${result.rows[0].version}`);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testDatabase().catch(error => {
  console.error('Error in test script:', error);
});
