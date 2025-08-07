#!/usr/bin/env node

// Check user data structure in database
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkUserData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking user data structure for profile...\n');
    
    // Check a specific user from the recent registrations
    const result = await pool.query(`
      SELECT id, email, name, username, role, club_id, avatar, bio, created_at
      FROM users 
      WHERE email = 'ayushkshirsagar28@gmail.com'
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Username: ${user.username || 'NULL'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Club: ${user.club_id}`);
      console.log(`   Avatar: ${user.avatar || 'NULL'}`);
      console.log(`   Bio: ${user.bio || 'NULL'}`);
      console.log(`   Created: ${user.created_at}`);
      
      // Check what the name field contains
      console.log('\n🔍 Name field analysis:');
      if (user.name) {
        const nameParts = user.name.split(' ');
        console.log(`   Full name: "${user.name}"`);
        console.log(`   Name parts: ${nameParts.length} parts`);
        if (nameParts.length >= 2) {
          console.log(`   Possible first name: "${nameParts[0]}"`);
          console.log(`   Possible last name: "${nameParts.slice(1).join(' ')}"`);
        }
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    // Check users table structure for profile-related fields
    console.log('\n📋 Users table profile fields:');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('name', 'username', 'bio', 'avatar')
      ORDER BY column_name
    `);
    
    if (structure.rows.length > 0) {
      structure.rows.forEach(col => {
        console.log(`   📝 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check if we need to add missing fields
    const expectedFields = ['first_name', 'last_name', 'username', 'bio', 'phone', 'location', 'social_links'];
    const existingFields = structure.rows.map(row => row.column_name);
    const missingFields = expectedFields.filter(field => !existingFields.includes(field));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing profile fields:');
      missingFields.forEach(field => {
        console.log(`   ❌ ${field}`);
      });
    } else {
      console.log('\n✅ All expected profile fields exist');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserData();
