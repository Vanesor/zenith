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

// Tables with array columns that need special handling
const ARRAY_TABLES = {
  'committee_roles': {
    arrayColumns: ['permissions'],
    failedRows: 13
  },
  'assignments': {
    arrayColumns: ['allowed_languages', 'question_weights'],
    failedRows: 8
  },
  'posts': {
    arrayColumns: ['tags'],
    failedRows: 4
  },
  'chat_rooms': {
    arrayColumns: ['members'],
    failedRows: 18
  }
};

async function fixArrayData() {
  const supabase = new Pool(SUPABASE_CONFIG);
  const local = new Pool(LOCAL_CONFIG);

  try {
    console.log('🔗 Connecting to databases...');
    await supabase.query('SELECT 1');
    await local.query('SELECT 1');
    console.log('✅ Connected to both databases');

    console.log('\n🔧 Fixing array data types...');

    for (const [tableName, config] of Object.entries(ARRAY_TABLES)) {
      try {
        console.log(`\n🔄 Processing ${tableName}...`);

        // Get data from Supabase
        const supabaseData = await supabase.query(`SELECT * FROM "${tableName}"`);
        console.log(`📥 Found ${supabaseData.rows.length} rows in Supabase ${tableName}`);

        if (supabaseData.rows.length === 0) {
          console.log(`⏭️  Skipping empty table ${tableName}`);
          continue;
        }

        // Get local table columns
        const localColumns = await local.query(`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);

        const localColumnInfo = {};
        localColumns.rows.forEach(col => {
          localColumnInfo[col.column_name] = {
            dataType: col.data_type,
            udtName: col.udt_name
          };
        });

        // Find common columns
        const supabaseColumnNames = Object.keys(supabaseData.rows[0]);
        const localColumnNames = Object.keys(localColumnInfo);
        const commonColumns = supabaseColumnNames.filter(col => localColumnNames.includes(col));
        
        console.log(`📋 Using ${commonColumns.length}/${supabaseColumnNames.length} common columns`);

        // Clear local table
        await local.query(`DELETE FROM "${tableName}"`);
        console.log(`🗑️  Cleared local ${tableName}`);

        // Insert data with fixed array handling
        let successCount = 0;
        let errorCount = 0;
        
        for (const row of supabaseData.rows) {
          try {
            const values = commonColumns.map(col => {
              let value = row[col];
              const columnInfo = localColumnInfo[col];
              
              // Handle null values
              if (value === null || value === undefined) {
                return null;
              }
              
              // Special handling for array columns
              if (config.arrayColumns.includes(col)) {
                if (Array.isArray(value)) {
                  // Convert array to PostgreSQL array literal
                  if (value.length === 0) {
                    return '{}'; // Empty array
                  }
                  
                  // Format array elements
                  const formattedElements = value.map(item => {
                    if (typeof item === 'string') {
                      // Escape quotes and wrap in quotes
                      return `"${item.replace(/"/g, '\\"')}"`;
                    }
                    return item;
                  });
                  
                  return `{${formattedElements.join(',')}}`;
                } else if (typeof value === 'string') {
                  try {
                    // Try to parse as JSON array
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                      if (parsed.length === 0) {
                        return '{}';
                      }
                      const formattedElements = parsed.map(item => {
                        if (typeof item === 'string') {
                          return `"${item.replace(/"/g, '\\"')}"`;
                        }
                        return item;
                      });
                      return `{${formattedElements.join(',')}}`;
                    }
                  } catch (e) {
                    // If parsing fails, treat as single string element
                    return `{"${value.replace(/"/g, '\\"')}"}`;
                  }
                }
                return '{}'; // Fallback to empty array
              }
              
              // Handle other JSON types
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

        console.log(`✅ ${tableName}: ${successCount}/${supabaseData.rows.length} rows fixed (${errorCount} errors)`);

      } catch (error) {
        console.error(`❌ Error with table ${tableName}:`, error.message);
      }
    }

    console.log('\n🎉 Array data fix completed!');

    // Show updated summary
    console.log('\n📊 Updated Summary:');
    for (const tableName of Object.keys(ARRAY_TABLES)) {
      try {
        const result = await local.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = parseInt(result.rows[0].count);
        console.log(`  ✅ ${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: Error getting count`);
      }
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await supabase.end();
    await local.end();
  }
}

fixArrayData().catch(console.error);
