#!/usr/bin/env node

// Test database connection to Supabase
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Show configuration (without password)
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('Configuration:');
  console.log(`DATABASE_URL: ${dbUrl.substring(0, 30)}...`);
  console.log('');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test basic query
    console.log('🧪 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`⏰ Current time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Test if our tables exist
    console.log('\n📊 Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Tables found:');
      tablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in public schema');
    }
    
    // Test users table specifically
    console.log('\n👥 Testing users table...');
    try {
      const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table exists with ${usersCount.rows[0].count} records`);
      
      // Check users table structure
      const usersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Users table structure:');
      usersStructure.rows.forEach(col => {
        console.log(`   📝 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
    } catch (error) {
      console.log(`❌ Users table error: ${error.message}`);
    }
    
    // Test clubs table
    console.log('\n🏢 Testing clubs table...');
    try {
      const clubsCount = await client.query('SELECT COUNT(*) as count FROM clubs');
      console.log(`✅ Clubs table exists with ${clubsCount.rows[0].count} records`);
      
      // Show available clubs
      const clubs = await client.query('SELECT id, name FROM clubs ORDER BY name');
      if (clubs.rows.length > 0) {
        console.log('🏢 Available clubs:');
        clubs.rows.forEach(club => {
          console.log(`   🔹 ${club.name} (ID: ${club.id})`);
        });
      }
    } catch (error) {
      console.log(`❌ Clubs table error: ${error.message}`);
    }
    
    client.release();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your DATABASE_URL is correct');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Check if your IP is whitelisted in Supabase');
    console.log('4. Ensure the database schema is properly set up');
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection().catch(console.error);
