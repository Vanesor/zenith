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

async function verifyMigration() {
  const supabase = new Pool(SUPABASE_CONFIG);
  const local = new Pool(LOCAL_CONFIG);

  try {
    console.log('🔍 Verifying migration results...\n');

    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const supabaseTables = await supabase.query(tablesQuery);
    const localTables = await local.query(tablesQuery);

    console.log('📋 Table Comparison:');
    console.log('==================');

    const allTables = new Set([
      ...supabaseTables.rows.map(r => r.table_name),
      ...localTables.rows.map(r => r.table_name)
    ]);

    let totalSupabaseRows = 0;
    let totalLocalRows = 0;
    let matchingTables = 0;
    let mismatchedTables = 0;

    for (const tableName of Array.from(allTables).sort()) {
      try {
        // Get row counts
        let supabaseCount = 0;
        let localCount = 0;

        try {
          const supabaseResult = await supabase.query(`SELECT COUNT(*) FROM "${tableName}"`);
          supabaseCount = parseInt(supabaseResult.rows[0].count);
          totalSupabaseRows += supabaseCount;
        } catch (error) {
          supabaseCount = 'N/A';
        }

        try {
          const localResult = await local.query(`SELECT COUNT(*) FROM "${tableName}"`);
          localCount = parseInt(localResult.rows[0].count);
          totalLocalRows += localCount;
        } catch (error) {
          localCount = 'N/A';
        }

        // Status indicator
        let status = '';
        if (supabaseCount === localCount && supabaseCount !== 'N/A') {
          status = '✅';
          matchingTables++;
        } else if (supabaseCount === 'N/A' || localCount === 'N/A') {
          status = '⚠️ ';
        } else {
          status = '❌';
          mismatchedTables++;
        }

        console.log(`${status} ${tableName.padEnd(25)} | Supabase: ${String(supabaseCount).padStart(6)} | Local: ${String(localCount).padStart(6)}`);

      } catch (error) {
        console.log(`❌ ${tableName.padEnd(25)} | Error: ${error.message}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`Total tables found: ${allTables.size}`);
    console.log(`Matching tables: ${matchingTables}`);
    console.log(`Mismatched tables: ${mismatchedTables}`);
    console.log(`Total Supabase rows: ${totalSupabaseRows}`);
    console.log(`Total Local rows: ${totalLocalRows}`);
    
    if (matchingTables === allTables.size) {
      console.log('\n🎉 Migration verification PASSED! All tables match.');
    } else {
      console.log('\n⚠️  Migration verification has issues. Check mismatched tables above.');
    }

    // Sample data verification for users table
    console.log('\n🔍 Sample Data Verification (users table):');
    console.log('==========================================');
    
    try {
      const supabaseUsers = await supabase.query('SELECT id, email, username FROM users LIMIT 3');
      const localUsers = await local.query('SELECT id, email, username FROM users LIMIT 3');
      
      console.log('Supabase sample:');
      supabaseUsers.rows.forEach(user => {
        console.log(`  - ${user.id} | ${user.email} | ${user.username}`);
      });
      
      console.log('Local sample:');
      localUsers.rows.forEach(user => {
        console.log(`  - ${user.id} | ${user.email} | ${user.username}`);
      });
    } catch (error) {
      console.log('Could not verify sample data:', error.message);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await supabase.end();
    await local.end();
  }
}

verifyMigration().catch(console.error);
