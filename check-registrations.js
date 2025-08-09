#!/usr/bin/env node

// Check recent registrations
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkRegistrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking recent test registrations...\n');
    
    const result = await pool.query(`
      SELECT email, name, role, club_id, created_at 
      FROM users 
      WHERE email LIKE 'test.api.%' OR email LIKE 'test.%'
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Recent test registrations found:');
      result.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.email}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Club: ${row.club_id}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No test registrations found');
    }
    
    // Check total user count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total users in database: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkRegistrations();
