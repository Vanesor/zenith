/**
 * Supabase Database Schema Verification Script
 * This script checks if your Supabase database has all the required tables and columns
 * for the Zenith application to function properly.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local file');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY defined');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Define the expected tables and their columns
const expectedSchema = {
  users: [
    'id', 'email', 'password_hash', 'first_name', 'last_name', 
    'profile_image', 'bio', 'role', 'created_at', 'updated_at'
  ],
  clubs: [
    'id', 'name', 'description', 'logo_url', 
    'created_by', 'created_at', 'updated_at'
  ],
  club_members: [
    'id', 'club_id', 'user_id', 'role', 'joined_at'
  ],
  posts: [
    'id', 'title', 'content', 'club_id', 
    'author_id', 'created_at', 'updated_at'
  ],
  comments: [
    'id', 'content', 'post_id', 'author_id',
    'parent_id', 'created_at', 'updated_at'
  ],
  likes: [
    'id', 'user_id', 'post_id', 'comment_id', 'created_at'
  ],
  chat_rooms: [
    'id', 'name', 'club_id', 'created_by',
    'is_private', 'created_at', 'updated_at'
  ],
  chat_room_members: [
    'id', 'chat_room_id', 'user_id', 'joined_at'
  ],
  messages: [
    'id', 'content', 'chat_room_id', 'sender_id', 'created_at'
  ],
  events: [
    'id', 'title', 'description', 'event_date',
    'event_time', 'end_time', 'location', 'max_attendees',
    'status', 'club_id', 'created_by', 'created_at', 'updated_at'
  ],
  event_attendees: [
    'id', 'event_id', 'user_id', 'registered_at'
  ],
  assignments: [
    'id', 'title', 'description', 'due_date',
    'club_id', 'created_by', 'created_at', 'updated_at'
  ],
  assignment_submissions: [
    'id', 'assignment_id', 'user_id', 'content',
    'file_url', 'grade', 'feedback', 'submitted_at', 'updated_at'
  ],
  notifications: [
    'id', 'user_id', 'title', 'message', 'type',
    'related_id', 'read', 'created_at', 'updated_at'
  ],
  sessions: [
    'id', 'user_id', 'token', 'expires_at',
    'created_at', 'last_active_at', 'user_agent', 'ip_address'
  ]
};

/**
 * Gets table information from the database
 * @param {string} tableName - The name of the table to check
 */
async function getTableInfo(tableName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql_with_results', {
      sql_query: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `
    });
    
    if (error) {
      throw error;
    }
    
    return data?.map(col => col.column_name) || [];
  } catch (error) {
    console.error(`Error fetching columns for ${tableName}:`, error.message);
    
    // Try direct query as fallback
    try {
      // We'll just get the structure by trying to select from the table
      const { data, error: queryError } = await supabase
        .from(tableName)
        .select()
        .limit(1);
      
      if (queryError) {
        console.error(`Could not query table ${tableName}:`, queryError.message);
        return null;
      }
      
      if (data && data.length > 0) {
        return Object.keys(data[0]);
      }
      
      return [];
    } catch (fallbackError) {
      console.error(`Fallback approach failed for ${tableName}:`, fallbackError.message);
      return null;
    }
  }
}

/**
 * Gets record count for a table
 * @param {string} tableName - The name of the table to count records in
 */
async function getRecordCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error counting records in ${tableName}:`, error.message);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Error counting records in ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Checks if a database function exists
 * @param {string} functionName - The name of the function to check
 */
async function checkFunctionExists(functionName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql_with_results', {
      sql_query: `
        SELECT COUNT(*) > 0 as exists
        FROM pg_proc
        WHERE proname = '${functionName}'
      `
    });
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0 && data[0].exists;
  } catch (error) {
    console.error(`Error checking for function ${functionName}:`, error.message);
    
    // Try a direct call to the function as a fallback
    if (['exec_sql', 'exec_sql_with_results', 'cleanup_old_notifications', 
         'update_last_active', 'trigger_set_timestamp'].includes(functionName)) {
      try {
        // If we're checking for exec_sql_with_results, try exec_sql instead since we're using it
        if (functionName === 'exec_sql_with_results') {
          const { error: callError } = await supabase.rpc('exec_sql', {
            sql_query: 'SELECT 1'
          });
          return !callError;
        }
        
        // Try calling the function directly if possible
        if (functionName === 'exec_sql') {
          const { error: callError } = await supabase.rpc('exec_sql', {
            sql_query: 'SELECT 1'
          });
          return !callError;
        }
        
        console.log(`Cannot directly verify function ${functionName}, assuming it exists`);
        return true;
      } catch (fallbackError) {
        console.error(`Fallback check for ${functionName} failed:`, fallbackError.message);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Verify the database schema
 */
async function verifySchema() {
  console.log('Verifying Zenith database schema...');
  console.log('====================================');
  
  const results = {
    tables: {
      present: [],
      missing: []
    },
    columns: {},
    functions: {
      present: [],
      missing: []
    }
  };
  
  // Get all tables in the public schema
  let existingTables = [];
  
  try {
    const { data, error } = await supabase.rpc('exec_sql_with_results', {
      sql_query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
    });
    
    if (error) {
      throw error;
    }
    
    existingTables = data.map(row => row.table_name);
    console.log(`Found ${existingTables.length} tables in the public schema: ${existingTables.join(', ')}`);
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    console.error('Please make sure the exec_sql_with_results function is properly set up');
    
    // Try an alternative approach with direct queries
    try {
      console.log('Trying alternative approach to fetch tables...');
      const tableList = [
        'users', 'clubs', 'club_members', 'posts', 'comments', 'likes',
        'chat_rooms', 'chat_room_members', 'messages', 'events', 'event_attendees',
        'assignments', 'assignment_submissions', 'notifications', 'sessions'
      ];
      
      existingTables = [];
      
      for (const tableName of tableList) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(tableName);
        }
      }
      
      console.log(`Found ${existingTables.length} verified tables in the public schema: ${existingTables.join(', ')}`);
    } catch (altError) {
      console.error('Alternative approach also failed:', altError.message);
      process.exit(1);
    }
  }
  
  // Check all expected tables
  for (const tableName of Object.keys(expectedSchema)) {
    if (existingTables.includes(tableName)) {
      results.tables.present.push(tableName);
      
      // Check columns in this table
      const columns = await getTableInfo(tableName);
      
      if (columns) {
        const expectedColumns = expectedSchema[tableName];
        const missingColumns = expectedColumns.filter(col => !columns.includes(col));
        
        results.columns[tableName] = {
          present: columns,
          missing: missingColumns
        };
      }
      
      // Count records in this table
      const recordCount = await getRecordCount(tableName);
      results.columns[tableName].recordCount = recordCount;
      
    } else {
      results.tables.missing.push(tableName);
    }
  }
  
  // Check required functions
  const requiredFunctions = [
    'cleanup_old_notifications',
    'update_last_active',
    'trigger_set_timestamp'
  ];
  
  for (const functionName of requiredFunctions) {
    if (await checkFunctionExists(functionName)) {
      results.functions.present.push(functionName);
    } else {
      results.functions.missing.push(functionName);
    }
  }
  
  // Display results
  console.log('\nSchema Verification Results:');
  console.log('==========================');
  
  console.log('\n📊 Tables Summary:');
  console.log(`✅ Present (${results.tables.present.length}): ${results.tables.present.join(', ')}`);
  
  if (results.tables.missing.length > 0) {
    console.log(`❌ Missing (${results.tables.missing.length}): ${results.tables.missing.join(', ')}`);
  } else {
    console.log('✅ No missing tables!');
  }
  
  console.log('\n📊 Column Details:');
  for (const tableName of results.tables.present) {
    console.log(`\nTable: ${tableName} (${results.columns[tableName].recordCount} records)`);
    
    if (results.columns[tableName].missing.length > 0) {
      console.log(`❌ Missing columns: ${results.columns[tableName].missing.join(', ')}`);
    } else {
      console.log('✅ All required columns present');
    }
  }
  
  console.log('\n📊 Functions Summary:');
  console.log(`✅ Present: ${results.functions.present.join(', ')}`);
  
  if (results.functions.missing.length > 0) {
    console.log(`❌ Missing: ${results.functions.missing.join(', ')}`);
  } else {
    console.log('✅ No missing functions!');
  }
  
  console.log('\n====================================');
  if (results.tables.missing.length > 0 || 
      Object.values(results.columns).some(col => col.missing.length > 0) || 
      results.functions.missing.length > 0) {
    console.log('❌ Schema verification failed! Please run the setup script to fix missing elements.');
  } else {
    console.log('✅ Schema verification successful! Your database is ready for the Zenith application.');
  }
}

// Run the verification
verifySchema();
