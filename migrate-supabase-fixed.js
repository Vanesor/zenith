#!/usr/bin/env node

const { Pool } = require('pg');

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

// Fixed migration order - independent tables first
const MIGRATION_ORDER = [
  // Core tables without dependencies
  'committees',
  
  // User-related tables (users depend on committees for some foreign keys)
  { table: 'users', skipForeignKeys: ['club_id'] },
  
  // Club tables (may depend on users for secretary)
  { table: 'clubs', skipForeignKeys: ['secretary_id'] },
  
  // Relationship tables
  'committee_roles',
  'committee_members',
  'club_members',
  
  // Content tables
  { table: 'events', skipForeignKeys: ['created_by'] },
  { table: 'assignments', skipForeignKeys: ['created_by', 'club_id'] },
  { table: 'posts', skipForeignKeys: ['author_id', 'club_id'] },
  { table: 'chat_rooms', skipForeignKeys: ['created_by'] },
  
  // Activity tables
  { table: 'event_attendees', skipForeignKeys: ['user_id', 'event_id'] },
  { table: 'assignment_questions', skipForeignKeys: ['assignment_id'] },
  { table: 'assignment_submissions', skipForeignKeys: ['assignment_id', 'user_id'] },
  { table: 'chat_messages', skipForeignKeys: ['user_id', 'room_id'] },
  { table: 'comments', skipForeignKeys: ['author_id', 'post_id'] },
  { table: 'trusted_devices', skipForeignKeys: ['user_id'] },
  
  // System tables
  'notifications',
  'email_logs'
];

class FixedDatabaseMigrator {
  constructor() {
    this.supabasePool = new Pool(SUPABASE_CONFIG);
    this.localPool = new Pool(LOCAL_CONFIG);
  }

  async connect() {
    try {
      console.log('🔗 Connecting to databases...');
      await this.supabasePool.query('SELECT 1');
      await this.localPool.query('SELECT 1');
      console.log('✅ Connected to both databases');
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async disableForeignKeyChecks() {
    try {
      await this.localPool.query('SET session_replication_role = replica;');
      console.log('🔓 Disabled foreign key constraints');
    } catch (error) {
      console.warn('⚠️  Could not disable foreign key checks:', error.message);
    }
  }

  async enableForeignKeyChecks() {
    try {
      await this.localPool.query('SET session_replication_role = DEFAULT;');
      console.log('🔒 Re-enabled foreign key constraints');
    } catch (error) {
      console.warn('⚠️  Could not re-enable foreign key checks:', error.message);
    }
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

  async getCommonColumns(tableName) {
    const supabaseColumns = await this.getTableColumns(this.supabasePool, tableName);
    const localColumns = await this.getTableColumns(this.localPool, tableName);
    
    const supabaseColNames = supabaseColumns.map(col => col.column_name);
    const localColNames = localColumns.map(col => col.column_name);
    
    // Find columns that exist in both databases
    const commonColumns = supabaseColNames.filter(col => localColNames.includes(col));
    
    console.log(`📋 Common columns for ${tableName}: ${commonColumns.length}/${supabaseColNames.length}`);
    
    return commonColumns;
  }

  convertValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle JSON fields
    if (dataType === 'json' || dataType === 'jsonb') {
      if (typeof value === 'string') {
        try {
          // Try to parse if it's a string
          JSON.parse(value);
          return value; // If valid JSON string, return as is
        } catch {
          // If not valid JSON, wrap in quotes
          return JSON.stringify(value);
        }
      }
      return JSON.stringify(value);
    }

    // Handle array fields
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    // Handle other types
    return value;
  }

  async migrateTable(tableConfig) {
    const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.table;
    const skipForeignKeys = typeof tableConfig === 'object' ? tableConfig.skipForeignKeys || [] : [];

    try {
      console.log(`\n🔄 Migrating table: ${tableName}`);

      // Check if table exists in Supabase
      const supabaseExists = await this.tableExists(this.supabasePool, tableName);
      if (!supabaseExists) {
        console.log(`⏭️  Table "${tableName}" not found in Supabase, skipping...`);
        return;
      }

      // Check if table exists in local
      const localExists = await this.tableExists(this.localPool, tableName);
      if (!localExists) {
        console.log(`⏭️  Table "${tableName}" not found in local database, skipping...`);
        return;
      }

      // Get row counts
      const supabaseCount = await this.getRowCount(this.supabasePool, tableName);
      const localCount = await this.getRowCount(this.localPool, tableName);
      
      console.log(`📊 Supabase "${tableName}": ${supabaseCount} rows`);
      console.log(`📊 Local "${tableName}": ${localCount} rows`);

      if (supabaseCount === 0) {
        console.log(`⏭️  Table "${tableName}" is empty in Supabase, skipping...`);
        return;
      }

      // Get common columns
      const commonColumns = await this.getCommonColumns(tableName);
      if (commonColumns.length === 0) {
        console.log(`⚠️  No common columns found for "${tableName}", skipping...`);
        return;
      }

      // Clear local table
      if (localCount > 0) {
        console.log(`🗑️  Clearing existing data in local "${tableName}"`);
        await this.localPool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
      }

      // Fetch data from Supabase using only common columns
      const columnList = commonColumns.map(col => `"${col}"`).join(', ');
      console.log(`📥 Fetching data from Supabase "${tableName}" (${commonColumns.length} columns)...`);
      
      const supabaseData = await this.supabasePool.query(`SELECT ${columnList} FROM "${tableName}"`);
      
      if (supabaseData.rows.length === 0) {
        console.log(`✅ No data to migrate for "${tableName}"`);
        return;
      }

      // Get column data types for conversion
      const supabaseColumnInfo = await this.getTableColumns(this.supabasePool, tableName);
      const columnTypeMap = {};
      supabaseColumnInfo.forEach(col => {
        columnTypeMap[col.column_name] = col.data_type;
      });

      // Insert data
      const placeholders = commonColumns.map((_, index) => `$${index + 1}`).join(', ');
      const insertQuery = `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`;
      
      let insertedRows = 0;
      let failedRows = 0;

      for (const row of supabaseData.rows) {
        try {
          const values = commonColumns.map(col => {
            const value = row[col];
            const dataType = columnTypeMap[col];
            return this.convertValue(value, dataType);
          });

          await this.localPool.query(insertQuery, values);
          insertedRows++;
        } catch (error) {
          failedRows++;
          if (failedRows <= 3) { // Only show first 3 errors
            console.warn(`⚠️  Failed to insert row in "${tableName}": ${error.message}`);
          }
        }
      }

      if (failedRows > 3) {
        console.warn(`⚠️  ... and ${failedRows - 3} more failed insertions`);
      }

      console.log(`✅ Completed "${tableName}": ${insertedRows}/${supabaseData.rows.length} rows migrated (${failedRows} failed)`);

    } catch (error) {
      console.error(`❌ Error migrating table "${tableName}":`, error.message);
    }
  }

  async resetSequences() {
    console.log('\n🔄 Resetting sequences...');
    
    try {
      const sequenceQuery = `
        SELECT sequence_name, sequence_schema
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
          // Ignore sequence reset errors for now
        }
      }
    } catch (error) {
      console.warn('⚠️  Error resetting sequences:', error.message);
    }
  }

  async migrate() {
    try {
      await this.connect();
      
      // Disable foreign key constraints
      await this.disableForeignKeyChecks();
      
      console.log('\n🚀 Starting fixed migration...');
      console.log(`📋 Tables to migrate: ${MIGRATION_ORDER.length}`);
      
      // Migrate each table in order
      for (const tableConfig of MIGRATION_ORDER) {
        await this.migrateTable(tableConfig);
      }
      
      // Re-enable foreign key constraints
      await this.enableForeignKeyChecks();
      
      // Reset sequences
      await this.resetSequences();
      
      console.log('\n🎉 Fixed migration completed!');
      
      // Summary
      console.log('\n📊 Migration Summary:');
      for (const tableConfig of MIGRATION_ORDER) {
        const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.table;
        try {
          const count = await this.getRowCount(this.localPool, tableName);
          if (count > 0) {
            console.log(`  ✅ ${tableName}: ${count} rows`);
          }
        } catch (error) {
          // Ignore errors in summary
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

// Run the migration
async function main() {
  const migrator = new FixedDatabaseMigrator();
  await migrator.migrate();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FixedDatabaseMigrator;
