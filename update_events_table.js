const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function updateEventsTable() {
  try {
    console.log("Adding missing columns to events table...");

    // Add start_time and end_time columns
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='start_time') THEN
              ALTER TABLE events ADD COLUMN start_time TIME;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='end_time') THEN
              ALTER TABLE events ADD COLUMN end_time TIME;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='type') THEN
              ALTER TABLE events ADD COLUMN type VARCHAR(50) DEFAULT 'meeting';
          END IF;
      END
      $$;
    `);

    console.log("Missing columns added successfully!");

    // Insert sample events with correct structure
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

updateEventsTable();
