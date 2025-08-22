#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_CONFIG = {
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qpulpytptbwwumicyzwr',
  password: 'ascendasterachievers',
  ssl: { rejectUnauthorized: false }
};

const LOCAL_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'zenith',
  user: 'zenithpostgres',
  password: 'AtharvaAyush'
};

// Tables to migrate (in dependency order)
const TABLES_TO_MIGRATE = [
  'users',
  'clubs',
  'committees',
  'committee_roles',
  'committee_members',
  'club_members',
  'events',
  'event_attendees',
  'assignments',
  'assignment_questions',
  'assignment_question_options',
  'assignment_submissions',
  'assignment_submission_answers',
  'assignment_violations',
  'posts',
  'post_likes',
  'comments',
  'chat_rooms',
  'chat_room_members',
  'chat_messages',
  'notifications',
  'user_sessions',
  'trusted_devices',
  'email_logs',
  'proctoring_sessions',
  'system_metrics'
];

class DatabaseMigrator {
  constructor() {
    this.supabasePool = new Pool(SUPABASE_CONFIG);
    this.localPool = new Pool(LOCAL_CONFIG);
  }

  async connect() {
    try {
      console.log('🔗 Connecting to Supabase...');
      await this.supabasePool.query('SELECT 1');
      console.log('✅ Connected to Supabase');

      console.log('🔗 Connecting to Local PostgreSQL...');
      await this.localPool.query('SELECT 1');
      console.log('✅ Connected to Local PostgreSQL');
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async getTableColumns(pool, tableName) {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    const result = await pool.query(query, [tableName]);
    return result.rows;
  }

  async tableExists(pool, tableName) {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const result = await pool.query(query, [tableName]);
    return result.rows[0].exists;
  }

  async getRowCount(pool, tableName) {
    try {
      const result = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0;
    }
  }

  async createTableIfNotExists(tableName, columns) {
    try {
      const columnDefinitions = columns.map(col => {
        let definition = `"${col.column_name}" ${col.data_type}`;
        
        // Handle specific data types
        if (col.data_type === 'character varying') {
          definition = `"${col.column_name}" VARCHAR`;
        } else if (col.data_type === 'timestamp without time zone') {
          definition = `"${col.column_name}" TIMESTAMP`;
        } else if (col.data_type === 'timestamp with time zone') {
          definition = `"${col.column_name}" TIMESTAMPTZ`;
        } else if (col.data_type === 'uuid') {
          definition = `"${col.column_name}" UUID`;
        }
        
        // Handle nullable
        if (col.is_nullable === 'NO') {
          definition += ' NOT NULL';
        }
        
        // Handle defaults
        if (col.column_default) {
          definition += ` DEFAULT ${col.column_default}`;
        }
        
        return definition;
      }).join(',\n  ');

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          ${columnDefinitions}
        );
      `;

      await this.localPool.query(createTableQuery);
      console.log(`📋 Created table structure for "${tableName}"`);
    } catch (error) {
      console.warn(`⚠️  Could not create table "${tableName}":`, error.message);
    }
  }

  async migrateTable(tableName) {
    try {
      console.log(`\n🔄 Migrating table: ${tableName}`);

      // Check if table exists in Supabase
      const supabaseExists = await this.tableExists(this.supabasePool, tableName);
      if (!supabaseExists) {
        console.log(`⏭️  Table "${tableName}" not found in Supabase, skipping...`);
        return;
      }

      // Get row count from Supabase
      const supabaseCount = await this.getRowCount(this.supabasePool, tableName);
      console.log(`📊 Supabase "${tableName}": ${supabaseCount} rows`);

      if (supabaseCount === 0) {
        console.log(`⏭️  Table "${tableName}" is empty, skipping...`);
        return;
      }

      // Get table structure from Supabase
      const columns = await this.getTableColumns(this.supabasePool, tableName);
      
      // Create table in local database if not exists
      await this.createTableIfNotExists(tableName, columns);

      // Check local row count
      const localCount = await this.getRowCount(this.localPool, tableName);
      console.log(`📊 Local "${tableName}": ${localCount} rows`);

      // Clear local table if it has data
      if (localCount > 0) {
        console.log(`🗑️  Clearing existing data in local "${tableName}"`);
        await this.localPool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
      }

      // Fetch data from Supabase
      console.log(`📥 Fetching data from Supabase "${tableName}"...`);
      const supabaseData = await this.supabasePool.query(`SELECT * FROM "${tableName}"`);
      
      if (supabaseData.rows.length === 0) {
        console.log(`✅ No data to migrate for "${tableName}"`);
        return;
      }

      // Prepare column names for insert
      const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      
      // Insert data in batches
      const batchSize = 100;
      const totalRows = supabaseData.rows.length;
      let insertedRows = 0;

      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = supabaseData.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            const values = columns.map(col => row[col.column_name]);
            await this.localPool.query(
              `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
              values
            );
            insertedRows++;
          } catch (error) {
            console.warn(`⚠️  Failed to insert row in "${tableName}":`, error.message);
          }
        }

        console.log(`📤 Inserted ${Math.min(i + batchSize, totalRows)}/${totalRows} rows in "${tableName}"`);
      }

      console.log(`✅ Completed "${tableName}": ${insertedRows} rows migrated`);

    } catch (error) {
      console.error(`❌ Error migrating table "${tableName}":`, error.message);
    }
  }

  async resetSequences() {
    console.log('\n🔄 Resetting sequences...');
    
    try {
      // Get all sequences
      const sequenceQuery = `
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      `;
      
      const sequences = await this.localPool.query(sequenceQuery);
      
      for (const seq of sequences.rows) {
        const sequenceName = seq.sequence_name;
        const tableName = sequenceName.replace(/_id_seq$/, '');
        
        try {
          const maxIdResult = await this.localPool.query(`SELECT MAX(id) FROM "${tableName}"`);
          const maxId = maxIdResult.rows[0].max;
          
          if (maxId) {
            await this.localPool.query(`SELECT setval('${sequenceName}', ${maxId})`);
            console.log(`🔢 Reset sequence ${sequenceName} to ${maxId}`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not reset sequence ${sequenceName}:`, error.message);
        }
      }
    } catch (error) {
      console.warn('⚠️  Error resetting sequences:', error.message);
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-before-migration-${timestamp}.sql`;
    
    console.log(`\n💾 Creating backup: ${backupFile}`);
    
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync(`pg_dump -h localhost -p 5432 -U zenithpostgres -d zenith > ${backupFile}`);
      console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
      console.warn('⚠️  Could not create backup:', error.message);
    }
  }

  async migrate() {
    try {
      await this.connect();
      
      // Create backup
      await this.createBackup();
      
      console.log('\n🚀 Starting migration...');
      console.log(`📋 Tables to migrate: ${TABLES_TO_MIGRATE.length}`);
      
      // Migrate each table
      for (const tableName of TABLES_TO_MIGRATE) {
        await this.migrateTable(tableName);
      }
      
      // Reset sequences
      await this.resetSequences();
      
      console.log('\n🎉 Migration completed successfully!');
      
      // Summary
      console.log('\n📊 Migration Summary:');
      for (const tableName of TABLES_TO_MIGRATE) {
        const count = await this.getRowCount(this.localPool, tableName);
        if (count > 0) {
          console.log(`  ✅ ${tableName}: ${count} rows`);
        }
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      await this.supabasePool.end();
      await this.localPool.end();
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📦 Supabase to Local PostgreSQL Migration Tool

Usage: node migrate-supabase-to-local.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be migrated without actually doing it
  --table <name> Migrate only specific table

Examples:
  node migrate-supabase-to-local.js
  node migrate-supabase-to-local.js --dry-run
  node migrate-supabase-to-local.js --table users
    `);
    return;
  }

  if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No data will be modified');
    // Add dry run logic here
    return;
  }

  const tableIndex = args.indexOf('--table');
  if (tableIndex !== -1 && args[tableIndex + 1]) {
    const specificTable = args[tableIndex + 1];
    console.log(`🎯 Migrating specific table: ${specificTable}`);
    TABLES_TO_MIGRATE.length = 0;
    TABLES_TO_MIGRATE.push(specificTable);
  }

  const migrator = new DatabaseMigrator();
  await migrator.migrate();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseMigrator;
