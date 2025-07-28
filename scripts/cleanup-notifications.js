/**
 * Script to auto-delete notifications older than one month
 * This script can be run on a schedule using a cron job
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Create connection pool based on environment
let pool;

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // Use Supabase connection
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // We'll use supabase client directly instead of pool
  console.log('Using Supabase for notification cleanup');
} else {
  // Use regular PostgreSQL connection
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'zenith',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
  });
}

async function cleanupOldNotifications() {
  let client;
  
  try {
    console.log('Starting notification cleanup...');
    
    // Determine which client to use based on environment
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Use Supabase client
      const { createClient } = require('@supabase/supabase-js');
      
      client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      // Delete notifications older than 1 month directly
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { data, error, count } = await client
        .from('notifications')
        .delete()
        .lt('created_at', oneMonthAgo.toISOString())
        .select('id');
      
      if (error) throw error;
      
      console.log(`Deleted ${data?.length || 0} expired notifications from Supabase`);
      return { success: true, deletedCount: data?.length || 0 };
    } else {
      // Use PostgreSQL client
      client = await pool.connect();
      
      // Begin transaction
      await client.query('BEGIN');

      // Check if the expires_at column exists in the notifications table
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'expires_at'
      `);
      
      if (columnCheck.rows.length === 0) {
        // Add expires_at column if it doesn't exist
        console.log('Adding expires_at column to notifications table...');
        await client.query(`
          ALTER TABLE notifications 
          ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
        `);
        
        // Set default expiration date for existing records (1 month from creation)
        await client.query(`
          UPDATE notifications 
          SET expires_at = created_at + INTERVAL '1 month'
          WHERE expires_at IS NULL
        `);
        
        console.log('Column added and existing notifications updated with expiration dates');
      }
    
      // Delete notifications that have expired
      const deleteResult = await client.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '1 month'
        RETURNING id
      `);
      
      const deletedCount = deleteResult.rowCount || 0;
      console.log(`Deleted ${deletedCount} expired notifications`);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Notification cleanup completed successfully');
      
      return { success: true, deletedCount };
    }
  } catch (error) {
    // Rollback in case of error
    if (client && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await client.query('ROLLBACK').catch(console.error);
    }
    console.error('Error during notification cleanup:', error);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Release PostgreSQL client
        client.release();
        await pool.end().catch(console.error);
      }
    }
  }
}

// Run the cleanup
cleanupOldNotifications()
  .then(result => {
    if (result.success) {
      console.log(`Cleanup completed. Removed ${result.deletedCount} notifications.`);
      process.exit(0);
    } else {
      console.error('Cleanup failed:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
