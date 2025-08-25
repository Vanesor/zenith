const { Pool } = require('pg');

const pool = new Pool({
  user: 'zenithpostgres',
  host: 'localhost',
  database: 'zenith',
  password: 'AtharvaAyush',
  port: 5432,
});

async function checkEventsTable() {
  try {
    // Check the events table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);
    
    console.log('Events table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) default: ${row.column_default}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkEventsTable();
