#!/usr/bin/env node

const { Pool } = require('pg');

// Simple migration script for essential data only
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

// Essential tables only
const ESSENTIAL_TABLES = [
  'users',
  'clubs', 
  'committees',
  'events',
  'assignments'
];

async function simpleDataCopy() {
  const supabase = new Pool(SUPABASE_CONFIG);
  const local = new Pool(LOCAL_CONFIG);

  try {
    console.log('🔗 Connecting to databases...');
    await supabase.query('SELECT 1');
    await local.query('SELECT 1');
    console.log('✅ Connected to both databases');

    for (const table of ESSENTIAL_TABLES) {
      try {
        console.log(`\n📋 Processing ${table}...`);
        
        // Get data from Supabase
        const result = await supabase.query(`SELECT * FROM ${table}`);
        console.log(`📥 Found ${result.rows.length} rows in Supabase ${table}`);
        
        if (result.rows.length === 0) {
          console.log(`⏭️  Skipping empty table ${table}`);
          continue;
        }

        // Clear local table
        await local.query(`DELETE FROM ${table}`);
        console.log(`🗑️  Cleared local ${table}`);

        // Copy data
        if (result.rows.length > 0) {
          const columns = Object.keys(result.rows[0]);
          const columnList = columns.map(col => `"${col}"`).join(', ');
          
          for (const row of result.rows) {
            const values = columns.map(col => row[col]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            await local.query(
              `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`,
              values
            );
          }
          
          console.log(`✅ Copied ${result.rows.length} rows to local ${table}`);
        }

      } catch (error) {
        console.error(`❌ Error with table ${table}:`, error.message);
      }
    }

    console.log('\n🎉 Essential data migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await supabase.end();
    await local.end();
  }
}

// Run the migration
simpleDataCopy().catch(console.error);
