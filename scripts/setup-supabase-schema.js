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
    // Try to run the query via the exec_sql function
    const { data, error } = await supabase.rpc('exec_sql_with_results', {
      sql_query: sql
    });
    
    if (error) {
      // If that fails, try using the REST API
      try {
        // Try querying via REST API
        const queryParams = new URLSearchParams();
        queryParams.append('q', sql);
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'params=single-object'
          }
        });
        
        const responseData = await response.json();
        
        // Handle different query return types
        if (sql.includes('EXISTS')) {
          return responseData && responseData.length > 0 && responseData[0].exists;
        }
        
        if (sql.includes('COUNT')) {
          return responseData && responseData.length > 0 && responseData[0].count > 0;
        }
        
        return false;
      } catch (restError) {
        console.error(`REST API check failed: ${restError.message}`);
        
        // Try querying information_schema directly
        if (sql.includes('table_name = ')) {
          const tableName = sql.match(/table_name\s*=\s*'([^']+)'/)[1];
          if (tableName) {
            const { data: tableData, error: tableError } = await supabase
              .from('information_schema.tables')
              .select('table_name')
              .eq('table_schema', 'public')
              .eq('table_name', tableName);
              
            return !tableError && tableData && tableData.length > 0;
          }
        }
        
        if (sql.includes('proname = ')) {
          const functionName = sql.match(/proname\s*=\s*'([^']+)'/)[1];
          if (functionName) {
            const { data: functionData, error: functionError } = await supabase
              .from('pg_proc')
              .select('proname')
              .eq('proname', functionName);
              
            return !functionError && functionData && functionData.length > 0;
          }
        }
        
        console.error(`Check condition failed: ${error.message}`);
        return false;
      }
    }
    
    // Handle standard query results
    if (sql.includes('EXISTS')) {
      return data && data.length > 0 && data[0].exists;
    }
    
    if (sql.includes('COUNT')) {
      return data && data.length > 0 && data[0].count > 0;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking condition: ${error.message}`);
    
    // Fallback to direct table check for common queries
    if (sql.includes('table_name = ')) {
      try {
        const tableName = sql.match(/table_name\s*=\s*'([^']+)'/)[1];
        if (tableName) {
          const { data: tableData, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', tableName);
            
          return !tableError && tableData && tableData.length > 0;
        }
      } catch (fallbackError) {
        console.error(`Fallback check failed: ${fallbackError.message}`);
      }
    }
    
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
    // First check if we can execute the SQL directly
    console.log('Checking if we can execute SQL directly...');
    
    try {
      // Try creating the exec_sql function using direct SQL
      const { data: directData, error: directError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
          RETURNS VOID AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (!directError) {
        console.log('✅ exec_sql function created directly');
      } else {
        throw new Error('Direct execution failed');
      }
    } catch (directError) {
      // If direct execution fails, use REST API
      console.log('Direct SQL execution not available. Using REST API to create function...');
      
      // Use the REST API to create the function
      const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
      
      try {
        console.log('Attempting to access PostgreSQL functions via REST...');
        
        // Try to get the function info from pg_proc
        const response = await fetch(`${SUPABASE_URL}/rest/v1/pg_proc?select=*&proname=eq.exec_sql`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        
        const pgProcData = await response.json();
        
        if (Array.isArray(pgProcData) && pgProcData.length > 0) {
          console.log('✅ exec_sql function already exists');
        } else {
          console.log('🔧 exec_sql function not found. Please create it manually in the Supabase dashboard');
          console.log('SQL statement to create the function:');
          console.log(`
          CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
          RETURNS VOID AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;`);
          
          console.log('\n📋 Instructions:');
          console.log('1. Go to the Supabase Dashboard for your project');
          console.log('2. Click on "SQL Editor" or "Database"');
          console.log('3. Create a new query and paste the SQL above');
          console.log('4. Execute the query to create the function');
          console.log('5. Then run this script again');
          
          process.exit(1);
        }
      } catch (restError) {
        console.error('❌ Failed to check for exec_sql function:', restError.message);
        console.log('Please create the exec_sql function manually in the Supabase dashboard and run this script again.');
        process.exit(1);
      }
    }
    
    // If we got here, the function exists or was created successfully

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
