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

async function manualDataCopy() {
  const supabase = new Pool(SUPABASE_CONFIG);
  const local = new Pool(LOCAL_CONFIG);

  try {
    console.log('🔗 Connecting to databases...');
    await supabase.query('SELECT 1');
    await local.query('SELECT 1');
    console.log('✅ Connected to both databases');

    // Drop all foreign key constraints from local database
    console.log('\n🔓 Dropping foreign key constraints...');
    
    const constraintsQuery = `
      SELECT 
        conname,
        conrelid::regclass AS table_name
      FROM pg_constraint 
      WHERE contype = 'f' 
      AND connamespace = 'public'::regnamespace;
    `;
    
    const constraints = await local.query(constraintsQuery);
    const droppedConstraints = [];
    
    for (const constraint of constraints.rows) {
      try {
        await local.query(`ALTER TABLE ${constraint.table_name} DROP CONSTRAINT ${constraint.conname}`);
        droppedConstraints.push(constraint);
        console.log(`   Dropped: ${constraint.conname} from ${constraint.table_name}`);
      } catch (error) {
        console.warn(`   Failed to drop ${constraint.conname}: ${error.message}`);
      }
    }

    console.log(`🗑️  Dropped ${droppedConstraints.length} foreign key constraints`);

    // Copy data table by table
    const essentialTables = [
      'committees',
      'users', 
      'clubs',
      'committee_roles',
      'committee_members',
      'events',
      'assignments',
      'posts',
      'chat_rooms',
      'notifications'
    ];

    console.log('\n📦 Copying data...');
    
    for (const tableName of essentialTables) {
      try {
        console.log(`\n🔄 Processing ${tableName}...`);

        // Check if table exists in both databases
        const supabaseExists = await supabase.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);

        const localExists = await local.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);

        if (!supabaseExists.rows[0].exists) {
          console.log(`⏭️  Table ${tableName} doesn't exist in Supabase, skipping...`);
          continue;
        }

        if (!localExists.rows[0].exists) {
          console.log(`⏭️  Table ${tableName} doesn't exist locally, skipping...`);
          continue;
        }

        // Get data from Supabase
        const supabaseData = await supabase.query(`SELECT * FROM "${tableName}"`);
        console.log(`📥 Found ${supabaseData.rows.length} rows in Supabase ${tableName}`);

        if (supabaseData.rows.length === 0) {
          console.log(`⏭️  Skipping empty table ${tableName}`);
          continue;
        }

        // Get local table columns
        const localColumns = await local.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);

        const localColumnInfo = {};
        localColumns.rows.forEach(col => {
          localColumnInfo[col.column_name] = col.data_type;
        });

        // Find common columns
        const supabaseColumnNames = Object.keys(supabaseData.rows[0]);
        const localColumnNames = Object.keys(localColumnInfo);
        const commonColumns = supabaseColumnNames.filter(col => localColumnNames.includes(col));
        
        console.log(`📋 Using ${commonColumns.length}/${supabaseColumnNames.length} common columns`);

        if (commonColumns.length === 0) {
          console.log(`⚠️  No common columns for ${tableName}, skipping...`);
          continue;
        }

        // Clear local table
        await local.query(`DELETE FROM "${tableName}"`);
        console.log(`🗑️  Cleared local ${tableName}`);

        // Insert data with proper type handling
        let successCount = 0;
        let errorCount = 0;
        
        for (const row of supabaseData.rows) {
          try {
            const values = commonColumns.map(col => {
              let value = row[col];
              const dataType = localColumnInfo[col];
              
              // Handle null values
              if (value === null || value === undefined) {
                return null;
              }
              
              // Handle array types (convert to PostgreSQL array format)
              if (Array.isArray(value)) {
                if (dataType && dataType.includes('[]')) {
                  // PostgreSQL array type
                  return `{${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')}}`;
                } else {
                  // JSON array
                  return JSON.stringify(value);
                }
              }
              
              // Handle JSON types
              if (value !== null && typeof value === 'object') {
                return JSON.stringify(value);
              }
              
              return value;
            });

            const columnList = commonColumns.map(col => `"${col}"`).join(', ');
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            await local.query(
              `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
              values
            );
            successCount++;
          } catch (error) {
            errorCount++;
            if (errorCount <= 3) {
              console.warn(`⚠️  Row error: ${error.message.substring(0, 80)}...`);
            }
          }
        }

        if (errorCount > 3) {
          console.warn(`⚠️  ... and ${errorCount - 3} more errors`);
        }

        console.log(`✅ ${tableName}: ${successCount}/${supabaseData.rows.length} rows copied (${errorCount} errors)`);

      } catch (error) {
        console.error(`❌ Error with table ${tableName}:`, error.message);
      }
    }

    console.log('\n🎉 Data copy completed!');

    // Show final summary
    console.log('\n📊 Final Summary:');
    for (const tableName of essentialTables) {
      try {
        const result = await local.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`  ✅ ${tableName}: ${count} rows`);
        }
      } catch (error) {
        // Ignore errors in summary
      }
    }

    console.log('\n⚠️  Note: Foreign key constraints have been dropped from local database');
    console.log('   You may need to recreate them manually if required for your application');

  } catch (error) {
    console.error('❌ Copy failed:', error);
  } finally {
    await supabase.end();
    await local.end();
  }
}

manualDataCopy().catch(console.error);
