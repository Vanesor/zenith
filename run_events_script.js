const { Pool } = require('pg');
const fs = require('fs');

// Database connection
const pool = new Pool({
  user: 'zenithpostgres',
  host: 'localhost',
  database: 'zenith',
  password: 'AtharvaAyush',
  port: 5432,
});

async function runSQLScript() {
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync('insert_dummy_events.sql', 'utf8');
    
    // Split by transaction blocks or statements
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}`);
          await pool.query(statement);
        } catch (error) {
          console.error(`Error in statement ${i + 1}:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    // Verify the data was inserted
    console.log('\nVerifying inserted events...');
    const result = await pool.query(`
      SELECT club_id, COUNT(*) as event_count, 
             SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM events 
      GROUP BY club_id 
      ORDER BY club_id;
    `);
    
    console.log('Events by club:');
    result.rows.forEach(row => {
      console.log(`${row.club_id}: ${row.event_count} total (${row.upcoming} upcoming, ${row.completed} completed)`);
    });
    
  } catch (error) {
    console.error('Script execution error:', error);
  } finally {
    await pool.end();
  }
}

runSQLScript();
