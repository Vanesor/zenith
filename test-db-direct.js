require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testDatabase() {
  console.log('Testing direct PostgreSQL connection...');
  
  // Test with DATABASE_URL
  console.log('\n--- Testing CONNECTION 1: DATABASE_URL ---');
  await testConnection(process.env.DATABASE_URL);
  
  // Test with DIRECT_URL
  console.log('\n--- Testing CONNECTION 2: DIRECT_URL ---');
  await testConnection(process.env.DIRECT_URL);
  
  // Test with original ZenithForum password and direct connection
  console.log('\n--- Testing CONNECTION 3: Direct with original password ---');
  const originalConn = "postgresql://postgres:ZenithForum@123@db.qpulpytptbwwumicyzwr.supabase.co:5432/postgres";
  await testConnection(originalConn);
  
  // Test with ascendasterachievers password and direct connection
  console.log('\n--- Testing CONNECTION 4: Direct with new password ---');
  const newConn = "postgresql://postgres:ascendasterachievers@db.qpulpytptbwwumicyzwr.supabase.co:5432/postgres";
  await testConnection(newConn);
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
    
    const result = await client.query('SELECT current_timestamp');
    console.log(`✅ Query successful: Server time is ${result.rows[0].current_timestamp}`);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testDatabase().catch(error => {
  console.error('Error in test script:', error);
});
