/**
 * Script to auto-delete notifications older than one month
 * This script can be run on a schedule using a cron job
 */

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zenith',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

async function cleanupOldNotifications() {
  const client = await pool.connect();

  try {
    console.log('Starting notification cleanup...');
    
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
      WITH deleted_notifications AS (
        DELETE FROM user_notifications 
        WHERE notification_id IN (
          SELECT id FROM notifications 
          WHERE expires_at < NOW()
        )
        RETURNING notification_id
      )
      DELETE FROM notifications 
      WHERE id IN (SELECT notification_id FROM deleted_notifications)
      RETURNING id
    `);
    
    const deletedCount = deleteResult.rowCount || 0;
    console.log(`Deleted ${deletedCount} expired notifications`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Notification cleanup completed successfully');
    
    return { success: true, deletedCount };
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during notification cleanup:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
    await pool.end();
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
