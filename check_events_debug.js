const { Pool } = require('pg');

const pool = new Pool({
  user: 'zenithpostgres',
  host: 'localhost',
  database: 'zenith',
  password: 'AtharvaAyush',
  port: 5432,
});

async function checkClubsAndEvents() {
  try {
    console.log('=== CLUBS ===');
    const clubsResult = await pool.query('SELECT id, name FROM clubs ORDER BY id');
    clubsResult.rows.forEach(row => {
      console.log(`${row.id}: ${row.name}`);
    });
    
    console.log('\n=== EVENTS BY CLUB ===');
    const eventsResult = await pool.query(`
      SELECT 
        e.club_id, 
        c.name as club_name,
        COUNT(*) as total_events,
        SUM(CASE WHEN e.status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed,
        MAX(e.created_at) as latest_event_created
      FROM events e 
      LEFT JOIN clubs c ON e.club_id = c.id 
      GROUP BY e.club_id, c.name 
      ORDER BY e.club_id
    `);
    
    eventsResult.rows.forEach(row => {
      console.log(`${row.club_id} (${row.club_name}): ${row.total_events} events (${row.upcoming} upcoming, ${row.completed} completed) - Latest: ${row.latest_event_created}`);
    });
    
    console.log('\n=== RECENT EVENTS FOR ASCEND ===');
    const ascendEvents = await pool.query(`
      SELECT id, title, event_date, status, created_at 
      FROM events 
      WHERE club_id = 'ascend' 
      ORDER BY created_at DESC, event_date DESC
    `);
    
    ascendEvents.rows.forEach(row => {
      console.log(`${row.title} - ${row.event_date} (${row.status}) - Created: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkClubsAndEvents();
