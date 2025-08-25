const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: 'zenithpostgres',
  host: 'localhost',
  database: 'zenith',
  password: 'AtharvaAyush',
  port: 5432,
});

async function insertUpcomingEvents() {
  try {
    console.log('Adding upcoming events with proper future dates...');
    
    // Insert upcoming events for each club
    const upcomingEvents = [
      // ASCEND - Technical Club
      {
        title: 'AI Workshop 2025',
        description: 'Hands-on workshop on machine learning and AI fundamentals',
        club_id: 'ascend',
        event_date: '2025-09-15',
        event_time: '14:00:00',
        location: 'Tech Lab 1',
        max_attendees: 30,
        banner_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      {
        title: 'Code Challenge Championship',
        description: 'Annual coding competition with prizes and recognition',
        club_id: 'ascend',
        event_date: '2025-10-20',
        event_time: '10:00:00',
        location: 'Main Auditorium',
        max_attendees: 100,
        banner_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      
      // ASTER - Communication Club  
      {
        title: 'Public Speaking Mastery',
        description: 'Advanced public speaking techniques and confidence building',
        club_id: 'aster',
        event_date: '2025-09-10',
        event_time: '16:00:00',
        location: 'Conference Room A',
        max_attendees: 25,
        banner_image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      {
        title: 'Debate Tournament',
        description: 'Inter-college debate competition on contemporary topics',
        club_id: 'aster',
        event_date: '2025-10-05',
        event_time: '09:00:00',
        location: 'Debate Hall',
        max_attendees: 40,
        banner_image_url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      
      // ACHIEVERS - Academic Club
      {
        title: 'Research Methodology Workshop',
        description: 'Learn advanced research techniques and academic writing',
        club_id: 'achievers',
        event_date: '2025-09-25',
        event_time: '11:00:00',
        location: 'Library Seminar Hall',
        max_attendees: 35,
        banner_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      {
        title: 'Academic Excellence Summit',
        description: 'Celebrating academic achievements and sharing study strategies',
        club_id: 'achievers',
        event_date: '2025-11-10',
        event_time: '14:30:00',
        location: 'Main Hall',
        max_attendees: 80,
        banner_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      
      // ALTOGETHER - will be transformed to ARTOVERT later
      {
        title: 'Digital Art Showcase',
        description: 'Exhibition of digital artwork created by club members',
        club_id: 'altogether',
        event_date: '2025-09-30',
        event_time: '15:00:00',
        location: 'Art Gallery',
        max_attendees: 50,
        banner_image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      },
      {
        title: 'Creative Arts Workshop',
        description: 'Hands-on workshop covering various creative arts techniques',
        club_id: 'altogether',
        event_date: '2025-10-15',
        event_time: '13:00:00',
        location: 'Art Studio',
        max_attendees: 20,
        banner_image_url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
      }
    ];
    
    for (const event of upcomingEvents) {
      try {
        const eventId = uuidv4();
        await pool.query(`
          INSERT INTO events (id, title, description, club_id, event_date, event_time, location, max_attendees, status, banner_image_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'upcoming', $9, NOW(), NOW())
        `, [
          eventId, event.title, event.description, event.club_id,
          event.event_date, event.event_time, event.location, event.max_attendees, event.banner_image_url
        ]);
        
        console.log(`✓ Added: ${event.title} for ${event.club_id} (ID: ${eventId})`);
      } catch (error) {
        console.error(`✗ Error adding ${event.title}:`, error.message);
      }
    }
    
    // Verify the results
    console.log('\n=== VERIFICATION ===');
    const result = await pool.query(`
      SELECT 
        club_id,
        COUNT(*) as total,
        SUM(CASE WHEN event_date >= CURRENT_DATE THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN event_date < CURRENT_DATE THEN 1 ELSE 0 END) as past
      FROM events 
      GROUP BY club_id 
      ORDER BY club_id
    `);
    
    result.rows.forEach(row => {
      console.log(`${row.club_id}: ${row.total} total (${row.upcoming} upcoming, ${row.past} past)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

insertUpcomingEvents();
