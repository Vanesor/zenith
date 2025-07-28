/**
 * Supabase Schema Synchronization Script
 * 
 * This script connects to a Supabase PostgreSQL database and ensures the schema
 * matches what we need for the Zenith application.
 * 
 * It reads connection details from .env.local and creates or updates tables as needed.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Validate environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_HOST',
  'SUPABASE_DB_PORT',
  'SUPABASE_DB_NAME',
  'SUPABASE_DB_USER',
  'SUPABASE_DB_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables in .env.local:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease add these variables to your .env.local file and try again.');
  process.exit(1);
}

// Establish connection to Supabase PostgreSQL
const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT || 5432,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Read schema from schema.txt
const readSchemaFile = () => {
  try {
    const schemaFilePath = path.join(__dirname, 'schema.txt');
    const schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Split the schema into individual table definitions
    const tableDefinitions = schemaContent.split(/CREATE TABLE/i)
      .filter(def => def.trim().length > 0)
      .map(def => `CREATE TABLE ${def.trim()}`);
    
    return tableDefinitions;
  } catch (error) {
    console.error('❌ Error reading schema file:', error.message);
    process.exit(1);
  }
};

// Parse table name from CREATE TABLE statement
const parseTableName = (createTableSql) => {
  const match = createTableSql.match(/CREATE TABLE\s+public\.(\w+)/i);
  return match ? match[1] : null;
};

// Check if a table exists in the database
const tableExists = async (tableName, client) => {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
};

// Check if user-defined types exist and create them if they don't
const ensureTypes = async (client) => {
  console.log('🔍 Checking for required user-defined types...');
  
  try {
    // Check if uuid-ossp extension is installed
    const extResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension WHERE extname = 'uuid-ossp'
      );
    `);
    
    if (!extResult.rows[0].exists) {
      console.log('📦 Creating uuid-ossp extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    }
    
    // You can add more type checks here if needed
    
    console.log('✅ Types and extensions verified');
  } catch (error) {
    console.error('❌ Error ensuring types:', error);
    throw error;
  }
};

// Create or update tables from schema
const syncSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting schema synchronization...');
    await client.query('BEGIN');
    
    // Ensure extensions and types exist
    await ensureTypes(client);
    
    // Get table definitions
    const tableDefinitions = readSchemaFile();
    
    for (const definition of tableDefinitions) {
      const tableName = parseTableName(definition);
      
      if (!tableName) {
        console.warn('⚠️ Could not parse table name from:', definition.substring(0, 100) + '...');
        continue;
      }
      
      const exists = await tableExists(tableName, client);
      
      if (!exists) {
        console.log(`📝 Creating table: ${tableName}`);
        try {
          await client.query(definition);
          console.log(`✅ Table ${tableName} created successfully`);
        } catch (error) {
          console.error(`❌ Error creating table ${tableName}:`, error.message);
          throw error; // Rolls back transaction
        }
      } else {
        console.log(`ℹ️ Table ${tableName} already exists`);
        
        // Here we could implement logic to alter existing tables if needed
        // For example, check for missing columns and add them
      }
    }
    
    await client.query('COMMIT');
    console.log('🎉 Schema synchronization completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Schema synchronization failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Create events table if needed
const ensureEventsTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking events table schema...');
    await client.query('BEGIN');
    
    // Check if events table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'events'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating events table...');
      await client.query(`
        CREATE TABLE public.events (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          title character varying NOT NULL,
          description text NOT NULL,
          club_id character varying,
          created_by uuid,
          event_date date NOT NULL,
          event_time time without time zone NOT NULL,
          end_time time without time zone,
          location character varying NOT NULL,
          max_attendees integer,
          status character varying DEFAULT 'upcoming'::character varying,
          type character varying DEFAULT 'meeting'::character varying,
          is_public boolean DEFAULT false,
          image_url text,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT events_pkey PRIMARY KEY (id),
          CONSTRAINT events_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
          CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
        );
      `);
      
      // Create indexes
      await client.query(`CREATE INDEX idx_events_club_id ON public.events(club_id);`);
      await client.query(`CREATE INDEX idx_events_date ON public.events(event_date);`);
      await client.query(`CREATE INDEX idx_events_status ON public.events(status);`);
      
      console.log('✅ Events table created successfully');
    } else {
      console.log('ℹ️ Events table already exists, checking for missing columns...');
      
      // Check for missing columns
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'events';
      `);
      
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('is_public')) {
        console.log('📝 Adding is_public column to events table...');
        await client.query(`ALTER TABLE public.events ADD COLUMN is_public BOOLEAN DEFAULT false;`);
      }
      
      if (!existingColumns.includes('end_time')) {
        console.log('📝 Adding end_time column to events table...');
        await client.query(`ALTER TABLE public.events ADD COLUMN end_time TIME;`);
      }
      
      if (!existingColumns.includes('type')) {
        console.log('📝 Adding type column to events table...');
        await client.query(`ALTER TABLE public.events ADD COLUMN type VARCHAR(50) DEFAULT 'meeting';`);
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
      console.log('📝 Creating event_attendees table...');
      await client.query(`
        CREATE TABLE public.event_attendees (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          event_id uuid,
          user_id uuid,
          registered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          attendance_status character varying DEFAULT 'registered'::character varying,
          CONSTRAINT event_attendees_pkey PRIMARY KEY (id),
          CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
          CONSTRAINT event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
        );
      `);
      
      // Create index
      await client.query(`CREATE INDEX idx_event_attendees_user ON public.event_attendees(user_id);`);
      await client.query(`CREATE INDEX idx_event_attendees_event ON public.event_attendees(event_id);`);
      
      console.log('✅ Event attendees table created successfully');
    }
    
    await client.query('COMMIT');
    console.log('✅ Events schema check completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in events schema check:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ensure notifications table has required structure
const ensureNotificationsTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking notifications table schema...');
    await client.query('BEGIN');
    
    // Check if notifications table exists
    const notificationsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
      );
    `);
    
    if (!notificationsCheck.rows[0].exists) {
      console.log('📝 Creating notifications table...');
      await client.query(`
        CREATE TABLE public.notifications (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          user_id uuid,
          title character varying NOT NULL,
          message text NOT NULL,
          type character varying NOT NULL,
          is_read boolean DEFAULT false,
          data jsonb DEFAULT '{}'::jsonb,
          reference_id uuid,
          reference_type character varying,
          scope character varying DEFAULT 'private',
          expires_at timestamp with time zone,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT notifications_pkey PRIMARY KEY (id),
          CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        );
      `);
      
      console.log('✅ Notifications table created');
      
      // Create indexes for notifications
      await client.query(`CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);`);
      await client.query(`CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);`);
      await client.query(`CREATE INDEX idx_notifications_expires ON public.notifications(expires_at);`);
    } else {
      console.log('ℹ️ Notifications table already exists, checking for missing columns...');
      
      // Check for missing columns
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications';
      `);
      
      const existingColumns = columnsCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('expires_at')) {
        console.log('📝 Adding expires_at column to notifications table...');
        await client.query(`ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;`);
        
        // Set default expiration date (1 month from creation)
        await client.query(`
          UPDATE public.notifications 
          SET expires_at = created_at + INTERVAL '1 month'
          WHERE expires_at IS NULL
        `);
      }
      
      if (!existingColumns.includes('reference_id')) {
        console.log('📝 Adding reference_id column to notifications table...');
        await client.query(`ALTER TABLE public.notifications ADD COLUMN reference_id UUID;`);
      }
      
      if (!existingColumns.includes('reference_type')) {
        console.log('📝 Adding reference_type column to notifications table...');
        await client.query(`ALTER TABLE public.notifications ADD COLUMN reference_type VARCHAR;`);
      }
      
      if (!existingColumns.includes('scope')) {
        console.log('📝 Adding scope column to notifications table...');
        await client.query(`ALTER TABLE public.notifications ADD COLUMN scope VARCHAR DEFAULT 'private';`);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Notifications schema check completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in notifications schema check:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ensure chat tables
const ensureChatTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking chat tables schema...');
    await client.query('BEGIN');
    
    // Check for chat_rooms table
    const roomsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chat_rooms'
      );
    `);
    
    if (!roomsCheck.rows[0].exists) {
      console.log('📝 Creating chat_rooms table...');
      await client.query(`
        CREATE TABLE public.chat_rooms (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          name varchar(255) NOT NULL,
          description text,
          club_id varchar REFERENCES public.clubs(id),
          type varchar(20) NOT NULL CHECK (type IN ('public', 'private', 'club')),
          created_by uuid NOT NULL REFERENCES public.users(id),
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
        );
      `);
      
      // Create indexes
      await client.query(`CREATE INDEX idx_chat_rooms_club_id ON public.chat_rooms(club_id);`);
      await client.query(`CREATE INDEX idx_chat_rooms_type ON public.chat_rooms(type);`);
      
      console.log('✅ Chat rooms table created successfully');
    }
    
    // Check for chat_messages table
    const messagesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chat_messages'
      );
    `);
    
    if (!messagesCheck.rows[0].exists) {
      console.log('📝 Creating chat_messages table...');
      await client.query(`
        CREATE TABLE public.chat_messages (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES public.users(id),
          message text NOT NULL,
          message_type varchar(20) DEFAULT 'text',
          attachment_url text,
          is_edited boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
        );
      `);
      
      // Create indexes
      await client.query(`CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);`);
      await client.query(`CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);`);
      
      console.log('✅ Chat messages table created successfully');
    }
    
    await client.query('COMMIT');
    console.log('✅ Chat tables schema check completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in chat tables schema check:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Main function to run the script
const main = async () => {
  try {
    console.log('🚀 Starting Zenith database schema setup with Supabase...');
    
    // First check connection
    await pool.query('SELECT NOW()');
    console.log('✅ Successfully connected to Supabase PostgreSQL database');
    
    // Run schema synchronization
    // await syncSchema(); // Uncomment this to sync all tables from schema.txt
    
    // Ensure specific tables have proper structure
    await ensureEventsTable();
    await ensureNotificationsTable();
    await ensureChatTables();
    
    console.log('🎉 All done! Database schema is ready for use.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the script
main();
