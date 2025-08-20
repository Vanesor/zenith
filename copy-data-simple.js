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

async function copyDataIgnoringConstraints() {
  const supabase = new Pool(SUPABASE_CONFIG);
  const local = new Pool(LOCAL_CONFIG);

  try {
    console.log('🔗 Connecting to databases...');
    await supabase.query('SELECT 1');
    await local.query('SELECT 1');
    console.log('✅ Connected to both databases');

    // Disable all constraints
    console.log('🔓 Disabling all constraints...');
    await local.query('SET session_replication_role = replica;');

    // Get all tables
    const tablesResult = await supabase.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`\n📋 Found ${tablesResult.rows.length} tables to process\n`);

    for (const { table_name: tableName } of tablesResult.rows) {
      try {
        console.log(`🔄 Processing ${tableName}...`);

        // Check if table exists in local
        const localTableCheck = await local.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);

        if (!localTableCheck.rows[0].exists) {
          console.log(`⏭️  Table ${tableName} doesn't exist in local DB, skipping...`);
          continue;
        }

        // Get data from Supabase
        const supabaseData = await supabase.query(`SELECT * FROM "${tableName}"`);
        console.log(`📥 Found ${supabaseData.rows.length} rows in Supabase ${tableName}`);

        if (supabaseData.rows.length === 0) {
          console.log(`⏭️  Skipping empty table ${tableName}`);
          continue;
        }

        // Get local table structure
        const localColumns = await local.query(`
          SELECT column_name 
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);

        const localColumnNames = localColumns.rows.map(row => row.column_name);
        
        // Find common columns
        const supabaseColumnNames = Object.keys(supabaseData.rows[0]);
        const commonColumns = supabaseColumnNames.filter(col => localColumnNames.includes(col));
        
        console.log(`📋 Using ${commonColumns.length}/${supabaseColumnNames.length} common columns`);

        if (commonColumns.length === 0) {
          console.log(`⚠️  No common columns for ${tableName}, skipping...`);
          continue;
        }

        // Clear local table
        await local.query(`DELETE FROM "${tableName}"`);
        console.log(`🗑️  Cleared local ${tableName}`);

        // Insert data row by row with better error handling
        let successCount = 0;
        let errorCount = 0;
        
        for (const row of supabaseData.rows) {
          try {
            const values = commonColumns.map(col => {
              let value = row[col];
              
              // Handle JSON and array types
              if (value !== null && typeof value === 'object') {
                value = JSON.stringify(value);
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
              console.warn(`⚠️  Row error in ${tableName}: ${error.message.substring(0, 100)}...`);
            }
          }
        }

        if (errorCount > 3) {
          console.warn(`⚠️  ... and ${errorCount - 3} more errors in ${tableName}`);
        }

        console.log(`✅ ${tableName}: ${successCount}/${supabaseData.rows.length} rows copied (${errorCount} errors)\n`);

      } catch (error) {
        console.error(`❌ Error with table ${tableName}:`, error.message);
      }
    }

    // Re-enable constraints
    console.log('🔒 Re-enabling constraints...');
    await local.query('SET session_replication_role = DEFAULT;');

    console.log('\n🎉 Data copy completed!');

    // Show summary
    console.log('\n📊 Summary:');
    for (const { table_name: tableName } of tablesResult.rows) {
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

  } catch (error) {
    console.error('❌ Copy failed:', error);
  } finally {
    await supabase.end();
    await local.end();
  }
}

copyDataIgnoringConstraints().catch(console.error);
