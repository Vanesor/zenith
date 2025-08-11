const { Pool } = require('pg');

async function addProfileColumns() {
  // Read the .env.local file to get the DATABASE_URL
  require('dotenv').config({ path: '.env.local' });
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Adding missing profile columns to users table...');
    
    const queries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);'
    ];

    for (const query of queries) {
      await pool.query(query);
    }

    console.log('✅ All columns added successfully');

    // Verify columns
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\nCurrent users table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await pool.end();
  }
}

addProfileColumns();
