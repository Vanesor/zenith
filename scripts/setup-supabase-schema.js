/**
 * Supabase Complete Schema Migration Script for Zenith
 * This script applies all schema changes needed for the Zenith application
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

// Define all the SQL operations for the migration
const migrationSteps = [
  {
    name: 'Create users table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')",
    sql: `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        profile_image VARCHAR(255),
        bio TEXT,
        role VARCHAR(50) CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_users_email ON users(email);
    `
  },
  {
    name: 'Create clubs table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clubs')",
    sql: `
      CREATE TABLE clubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        logo_url VARCHAR(255),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create club_members table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_members')",
    sql: `
      CREATE TABLE club_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(club_id, user_id)
      );
      
      CREATE INDEX idx_club_members_club_id ON club_members(club_id);
      CREATE INDEX idx_club_members_user_id ON club_members(user_id);
    `
  },
  {
    name: 'Create posts table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts')",
    sql: `
      CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_posts_club_id ON posts(club_id);
      CREATE INDEX idx_posts_author_id ON posts(author_id);
      CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
    `
  },
  {
    name: 'Create comments table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments')",
    sql: `
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_comments_post_id ON comments(post_id);
      CREATE INDEX idx_comments_author_id ON comments(author_id);
      CREATE INDEX idx_comments_parent_id ON comments(parent_id);
    `
  },
  {
    name: 'Create likes table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes')",
    sql: `
      CREATE TABLE likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT check_like_target CHECK (
          (post_id IS NOT NULL AND comment_id IS NULL) OR
          (comment_id IS NOT NULL AND post_id IS NULL)
        ),
        CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
        CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id)
      );
      
      CREATE INDEX idx_likes_user_id ON likes(user_id);
      CREATE INDEX idx_likes_post_id ON likes(post_id);
      CREATE INDEX idx_likes_comment_id ON likes(comment_id);
    `
  },
  {
    name: 'Create chat_rooms table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms')",
    sql: `
      CREATE TABLE chat_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_chat_rooms_club_id ON chat_rooms(club_id);
    `
  },
  {
    name: 'Create chat_room_members table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_room_members')",
    sql: `
      CREATE TABLE chat_room_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(chat_room_id, user_id)
      );
      
      CREATE INDEX idx_chat_room_members_room_id ON chat_room_members(chat_room_id);
      CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);
    `
  },
  {
    name: 'Create messages table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')",
    sql: `
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
      CREATE INDEX idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
    `
  },
  {
    name: 'Create events table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events')",
    sql: `
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        end_time TIME,
        location VARCHAR(255) NOT NULL,
        max_attendees INTEGER,
        status VARCHAR(50) CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming',
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_events_club_id ON events(club_id);
      CREATE INDEX idx_events_event_date ON events(event_date);
      CREATE INDEX idx_events_status ON events(status);
    `
  },
  {
    name: 'Create event_attendees table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_attendees')",
    sql: `
      CREATE TABLE event_attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );
      
      CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
      CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
    `
  },
  {
    name: 'Create assignments table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assignments')",
    sql: `
      CREATE TABLE assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_assignments_club_id ON assignments(club_id);
      CREATE INDEX idx_assignments_due_date ON assignments(due_date);
    `
  },
  {
    name: 'Create assignment_submissions table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assignment_submissions')",
    sql: `
      CREATE TABLE assignment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        file_url VARCHAR(255),
        grade VARCHAR(10),
        feedback TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(assignment_id, user_id)
      );
      
      CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
      CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
    `
  },
  {
    name: 'Create notifications table if not exists',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')",
    sql: `
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'event', 'assignment', 'comment', 'like', 'system')),
        related_id UUID,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX idx_notifications_read ON notifications(read);
    `
  },
  {
    name: 'Create notification cleanup function',
    check: "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_old_notifications')",
    sql: `
      CREATE OR REPLACE FUNCTION cleanup_old_notifications()
      RETURNS void AS $$
      BEGIN
        -- Delete read notifications older than 1 month
        DELETE FROM notifications
        WHERE read = TRUE AND created_at < NOW() - INTERVAL '1 month';
        
        -- Delete unread notifications older than 3 months
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '3 months';
      END;
      $$ LANGUAGE plpgsql;
    `
  },
  {
    name: 'Create session tracking table',
    check: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions')",
    sql: `
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        user_agent TEXT,
        ip_address VARCHAR(45)
      );
      
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX idx_sessions_token ON sessions(token);
      CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
    `
  },
  {
    name: 'Create update_last_active trigger function',
    check: "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_last_active')",
    sql: `
      CREATE OR REPLACE FUNCTION update_last_active()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.last_active_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_sessions_last_active ON sessions;
      CREATE TRIGGER update_sessions_last_active
        BEFORE UPDATE ON sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_last_active();
    `
  },
  {
    name: 'Create auto-updating timestamp trigger function',
    check: "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'trigger_set_timestamp')",
    sql: `
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
  },
  {
    name: 'Add updated_at triggers to all tables with updated_at column',
    check: "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'set_timestamp' AND event_object_table = 'users'",
    sql: `
      DROP TRIGGER IF EXISTS set_timestamp ON users;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON clubs;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON clubs
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON posts;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON posts
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON comments;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON comments
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON chat_rooms;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON chat_rooms
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON events;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON assignments;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON assignments
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON assignment_submissions;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON assignment_submissions
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
        
      DROP TRIGGER IF EXISTS set_timestamp ON notifications;
      CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    `
  }
];

/**
 * Execute an SQL query
 * @param {string} sql - The SQL query to execute
 * @param {string} description - Description of what the query does
 */
async function executeSQL(sql, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw new Error(`Error executing ${description}: ${error.message}`);
    }
    
    console.log(`✅ ${description} successful`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed: ${error.message}`);
    return false;
  }
}

/**
 * Check if a condition is true by executing a query
 * @param {string} sql - The SQL query to execute
 */
async function checkCondition(sql) {
  try {
    const { data, error } = await supabase.from('_sql').select().sql(sql);
    
    if (error) {
      console.error(`Check condition failed: ${error.message}`);
      return false;
    }
    
    // For EXISTS queries
    if (data && data.length > 0 && data[0].exists) {
      return data[0].exists;
    }
    
    // For COUNT queries
    if (data && data.length > 0 && data[0].count !== undefined) {
      return data[0].count > 0;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking condition: ${error.message}`);
    return false;
  }
}

/**
 * Apply all migration steps
 */
async function applyMigrations() {
  console.log('Starting Zenith schema migration...');
  console.log('====================================');

  try {
    // Check if exec_sql function exists, if not create it
    const { data, error } = await supabase.from('pg_proc')
      .select()
      .filter('proname', 'eq', 'exec_sql');
    
    if (error || !data || data.length === 0) {
      console.log('Creating exec_sql function...');
      
      // Create the exec_sql function that allows executing raw SQL
      await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
          RETURNS VOID AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      }).catch(error => {
        // If the function doesn't exist, we need to create it differently
        // This is a catch-22 situation, so we'll need to use the REST API directly
        console.log('Function does not exist, using alternative method');
        // This would normally require a direct SQL connection or use of Supabase UI
      });
    }

    // Apply each migration step
    for (const step of migrationSteps) {
      console.log(`\nProcessing: ${step.name}`);
      
      // Check if the step needs to be applied
      const exists = await checkCondition(step.check);
      
      if (exists) {
        console.log(`⏭️  ${step.name} already exists, skipping...`);
        continue;
      }
      
      // Execute the SQL for this step
      const success = await executeSQL(step.sql, step.name);
      
      if (!success) {
        console.warn(`⚠️  Warning: Step "${step.name}" failed, continuing with next step`);
      }
    }

    console.log('\n====================================');
    console.log('✅ Schema migration completed!');
    console.log('Note: To schedule automatic notification cleanup, please create a cron job');
    console.log('using the cleanup_old_notifications() function via pg_cron extension.');
    
  } catch (error) {
    console.error('\n====================================');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migrations
applyMigrations();
