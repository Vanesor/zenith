#!/usr/bin/env node

// Test database connection to Supabase
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Show configuration (without password)
  console.log('Configuration:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log('');

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false }
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
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Make sure you ran the schema setup.');
    }
    
    // Test sample data
    console.log('\n👥 Checking sample data...');
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    const clubsResult = await client.query('SELECT COUNT(*) as club_count FROM clubs');
    
    console.log(`   - Users: ${usersResult.rows[0].user_count}`);
    console.log(`   - Clubs: ${clubsResult.rows[0].club_count}`);
    
    client.release();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Tips:');
      console.log('   - Check your DB_HOST in .env.local');
      console.log('   - Make sure your Supabase project is running');
    } else if (error.code === '28P01') {
      console.log('\n💡 Tips:');
      console.log('   - Check your DB_PASSWORD in .env.local');
      console.log('   - Verify your database password in Supabase dashboard');
    } else if (error.code === '3D000') {
      console.log('\n💡 Tips:');
      console.log('   - Check your DB_NAME in .env.local (should be "postgres")');
    }
  } finally {
    await pool.end();
  }
}

testConnection().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
