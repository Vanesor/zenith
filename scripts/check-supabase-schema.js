/**
 * Simple Supabase Schema Check
 * This script checks if the required tables exist and have some basic data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local file');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY defined');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// List of required tables
const requiredTables = [
  'users',
  'clubs',
  'club_members',
  'posts',
  'comments',
  'likes',
  'chat_rooms',
  'chat_room_members',
  'messages',
  'events',
  'event_attendees',
  'assignments',
  'assignment_submissions',
  'notifications',
  'sessions'
];

/**
 * Check if a table exists and get its record count
 */
async function checkTable(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      return { exists: false, count: 0, error: error.message };
    }
    
    return { exists: true, count: count || 0, error: null };
  } catch (error) {
    return { exists: false, count: 0, error: error.message };
  }
}

/**
 * Check a sample of columns in a table
 */
async function checkColumns(tableName, sampleColumns) {
  try {
    // Try to select just these columns
    const { data, error } = await supabase
      .from(tableName)
      .select(sampleColumns.join(','))
      .limit(1);
      
    if (error) {
      return { allPresent: false, missing: sampleColumns, error: error.message };
    }
    
    return { allPresent: true, missing: [], error: null };
  } catch (error) {
    return { allPresent: false, missing: sampleColumns, error: error.message };
  }
}

/**
 * Verify the database schema
 */
async function checkSchema() {
  console.log('Checking Zenith database schema...');
  console.log('====================================');
  
  const results = {
    tables: {
      present: [],
      missing: []
    },
    totalRecords: 0
  };
  
  // Check each required table
  for (const tableName of requiredTables) {
    console.log(`Checking table: ${tableName}`);
    const tableCheck = await checkTable(tableName);
    
    if (tableCheck.exists) {
      results.tables.present.push(tableName);
      results.totalRecords += tableCheck.count;
      console.log(`  ✓ Table ${tableName} exists with ${tableCheck.count} records`);
    } else {
      results.tables.missing.push(tableName);
      console.log(`  ✗ Table ${tableName} is missing or not accessible: ${tableCheck.error}`);
    }
  }
  
  // Check a few important relationships
  if (results.tables.present.includes('users') && results.tables.present.includes('clubs')) {
    console.log('\nChecking relationships...');
    
    // Check if clubs have a created_by column pointing to users
    const clubsCheck = await checkColumns('clubs', ['created_by']);
    if (clubsCheck.allPresent) {
      console.log('  ✓ Clubs have created_by column');
    } else {
      console.log('  ✗ Clubs missing created_by column');
    }
    
    // Check if posts link to users and clubs
    if (results.tables.present.includes('posts')) {
      const postsCheck = await checkColumns('posts', ['author_id', 'club_id']);
      if (postsCheck.allPresent) {
        console.log('  ✓ Posts have author_id and club_id columns');
      } else {
        console.log('  ✗ Posts missing relationship columns');
      }
    }
  }
  
  // Display summary
  console.log('\nDatabase Schema Summary:');
  console.log('=======================');
  console.log(`Total tables present: ${results.tables.present.length}/${requiredTables.length}`);
  console.log(`Total records across all tables: ${results.totalRecords}`);
  
  if (results.tables.missing.length > 0) {
    console.log('\nMissing tables:');
    for (const table of results.tables.missing) {
      console.log(`  - ${table}`);
    }
    
    console.log('\nRecommendation: Run the schema setup script again');
  } else {
    console.log('\n✅ All required tables are present in the database');
  }
}

// Run the check
checkSchema().catch(error => {
  console.error('Schema check failed:', error);
  process.exit(1);
});
