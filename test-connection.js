#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Supabase Database Connection...\n');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  let client;
  
  try {
    console.log('📡 Attempting to connect to Supabase...');
    console.log('🔗 Connection string:', process.env.DATABASE_URL ? 'Found' : 'Missing');
    
    client = await pool.connect();
    console.log('✅ Successfully connected to Supabase!');
    
    const result = await client.query('SELECT version(), now() as current_time');
    console.log('📊 Database version:', result.rows[0].version.substring(0, 50) + '...');
    console.log('🕐 Server time:', result.rows[0].current_time);
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Available tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in public schema');
    }
    
    console.log('\n🎉 Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ENETUNREACH') {
      console.log('\n🔧 IPv6 connectivity issue detected');
      console.log('This is likely a network configuration problem');
    }
    
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();
