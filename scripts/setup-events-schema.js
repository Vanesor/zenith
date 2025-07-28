/**
 * Migration script for events and notifications
 * This adds the correct schema for events, attendees and notifications
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Get Supabase connection details from .env.local
const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function createEventsSchema() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Creating/updating events table schema...');
    
    // Check if the events table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'events'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Create events table if it doesn't exist
      await client.query(`
        CREATE TABLE events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          event_date DATE NOT NULL,
          event_time TIME NOT NULL,
          end_time TIME,
          location VARCHAR(255) NOT NULL,
          club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          max_attendees INTEGER,
          status VARCHAR(50) DEFAULT 'upcoming',
          type VARCHAR(50) NOT NULL,
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('Events table created');
      
      // Create indexes
      await client.query(`CREATE INDEX idx_events_club_id ON events(club_id);`);
      await client.query(`CREATE INDEX idx_events_date ON events(event_date);`);
      await client.query(`CREATE INDEX idx_events_status ON events(status);`);
    } else {
      console.log('Events table exists, adding missing columns if needed');
      
      // Check for missing columns and add them if they don't exist
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'events';
      `);
      
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('is_public')) {
        await client.query(`ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT false;`);
        console.log('Added is_public column');
      }
      
      if (!existingColumns.includes('end_time')) {
        await client.query(`ALTER TABLE events ADD COLUMN end_time TIME;`);
        console.log('Added end_time column');
      }
      
      if (!existingColumns.includes('type')) {
        await client.query(`ALTER TABLE events ADD COLUMN type VARCHAR(50) DEFAULT 'meeting';`);
        console.log('Added type column');
      }
    }
    
    // Check if event_attendees table exists
    const attendeesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'event_attendees'
      );
    `);
    
    if (!attendeesCheck.rows[0].exists) {
      // Create event_attendees table
      await client.query(`
        CREATE TABLE event_attendees (
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (event_id, user_id)
        );
      `);
      console.log('Event attendees table created');
      
      // Create index
      await client.query(`CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);`);
    } else {
      console.log('Event attendees table already exists');
    }
    
    // Check if notifications table exists
    const notificationsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
      );
    `);
    
    if (!notificationsCheck.rows[0].exists) {
      // Create notifications table
      await client.query(`
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          reference_id UUID,
          reference_type VARCHAR(50),
          club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
          scope VARCHAR(20) NOT NULL CHECK (scope IN ('public', 'club', 'private')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log('Notifications table created');
      
      // Create user_notifications junction table
      await client.query(`
        CREATE TABLE user_notifications (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (user_id, notification_id)
        );
      `);
      console.log('User notifications table created');
      
      // Create indexes
      await client.query(`CREATE INDEX idx_notifications_type ON notifications(type);`);
      await client.query(`CREATE INDEX idx_notifications_scope ON notifications(scope);`);
      await client.query(`CREATE INDEX idx_notifications_expires ON notifications(expires_at);`);
      await client.query(`CREATE INDEX idx_user_notifications_read ON user_notifications(is_read);`);
    } else {
      console.log('Notifications table already exists');
      
      // Check for missing columns and add them if they don't exist
      const notifColumnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications';
      `);
      
      const existingNotifColumns = notifColumnsCheck.rows.map(row => row.column_name);
      
      if (!existingNotifColumns.includes('expires_at')) {
        await client.query(`ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;`);
        console.log('Added expires_at column to notifications');
        
        // Set default expiration date (1 month from creation)
        await client.query(`
          UPDATE notifications 
          SET expires_at = created_at + INTERVAL '1 month'
          WHERE expires_at IS NULL
        `);
      }
    }
    
    // Create example events for testing
    const eventCountCheck = await client.query(`SELECT COUNT(*) FROM events;`);
    if (parseInt(eventCountCheck.rows[0].count) === 0) {
      console.log('Adding sample events...');
      
      // Get club and user IDs for sample data
      const clubsCheck = await client.query(`SELECT id FROM clubs LIMIT 1;`);
      const usersCheck = await client.query(`SELECT id FROM users LIMIT 1;`);
      
      if (clubsCheck.rows.length > 0 && usersCheck.rows.length > 0) {
        const clubId = clubsCheck.rows[0].id;
        const userId = usersCheck.rows[0].id;
        
        // Create 3 sample events
        await client.query(`
          INSERT INTO events (
            title, 
            description, 
            event_date, 
            event_time, 
            end_time,
            location, 
            club_id, 
            created_by, 
            type, 
            status,
            is_public
          ) VALUES 
          (
            'Weekly Club Meeting', 
            'Regular weekly meeting to discuss club activities and projects',
            CURRENT_DATE + INTERVAL '7 days',
            '15:00',
            '16:30',
            'Main Hall, Building A',
            $1,
            $2,
            'meeting',
            'upcoming',
            true
          ),
          (
            'Tech Workshop: AI Basics', 
            'Learn the fundamentals of artificial intelligence in this hands-on workshop',
            CURRENT_DATE + INTERVAL '14 days',
            '10:00',
            '13:00',
            'Computer Lab 3',
            $1,
            $2,
            'workshop',
            'upcoming',
            true
          ),
          (
            'End of Semester Social', 
            'Join us to celebrate the end of the semester with food, music, and fun activities',
            CURRENT_DATE + INTERVAL '30 days',
            '18:00',
            '22:00',
            'Student Center Lounge',
            $1,
            $2,
            'social',
            'upcoming',
            true
          );
        `, [clubId, userId]);
        
        console.log('Sample events created');
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Events and notifications schema setup completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error setting up schema:', error);
  } finally {
    // Release the client
    client.release();
  }
}

// Run the migration
createEventsSchema()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
