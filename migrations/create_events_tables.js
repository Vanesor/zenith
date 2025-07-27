const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function createEventsTables() {
  try {
    // Check if events table exists
    const checkEvents = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
      );
    `);

    if (!checkEvents.rows[0].exists) {
      console.log("Creating events table...");
      await pool.query(`
        CREATE TABLE events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          location VARCHAR(255),
          type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'workshop', 'social', 'competition', 'presentation')),
          club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          max_attendees INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX idx_events_club_id ON events(club_id);
        CREATE INDEX idx_events_date ON events(date);
        CREATE INDEX idx_events_created_by ON events(created_by);
      `);

      console.log("Events table created successfully!");
    } else {
      console.log("Events table already exists");
    }

    // Check if event_attendees table exists
    const checkAttendees = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_attendees'
      );
    `);

    if (!checkAttendees.rows[0].exists) {
      console.log("Creating event_attendees table...");
      await pool.query(`
        CREATE TABLE event_attendees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          attended BOOLEAN DEFAULT FALSE,
          UNIQUE(event_id, user_id)
        );
      `);

      await pool.query(`
        CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
        CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
      `);

      console.log("Event attendees table created successfully!");
    } else {
      console.log("Event attendees table already exists");
    }

    // Insert some sample events for testing
    const clubCheck = await pool.query("SELECT id FROM clubs LIMIT 1");
    const userCheck = await pool.query("SELECT id FROM users LIMIT 1");

    if (clubCheck.rows.length > 0 && userCheck.rows.length > 0) {
      const clubId = clubCheck.rows[0].id;
      const userId = userCheck.rows[0].id;

      console.log("Inserting sample events...");

      await pool.query(
        `
        INSERT INTO events (title, description, date, start_time, end_time, location, type, club_id, created_by, max_attendees) VALUES
        ('React Workshop: Advanced Patterns', 'Deep dive into advanced React patterns including render props, compound components, and custom hooks.', CURRENT_DATE + INTERVAL '7 days', '14:00', '17:00', 'Engineering Building, Room 203', 'workshop', $1, $2, 30),
        ('Communication Skills Seminar', 'Learn effective communication strategies for professional success.', CURRENT_DATE + INTERVAL '10 days', '10:00', '12:00', 'Conference Hall A', 'presentation', $1, $2, 50),
        ('Career Guidance Session', 'Get insights into career planning and higher education opportunities.', CURRENT_DATE + INTERVAL '14 days', '15:00', '17:00', 'Main Auditorium', 'meeting', $1, $2, 100),
        ('Wellness Workshop', 'Learn stress management techniques and mindfulness practices.', CURRENT_DATE + INTERVAL '21 days', '11:00', '13:00', 'Wellness Center', 'workshop', $1, $2, 25)
        ON CONFLICT DO NOTHING;
      `,
        [clubId, userId]
      );

      console.log("Sample events inserted!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createEventsTables();
