const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function createNotificationsTable() {
  try {
    // Check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log("Creating notifications table...");
      await pool.query(`
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'event', 'assignment', 'comment', 'like', 'system')),
          related_id UUID,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      `);

      await pool.query(`
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
      `);

      await pool.query(`
        CREATE INDEX idx_notifications_read ON notifications(read);
      `);

      console.log("Notifications table created successfully!");
    } else {
      console.log("Notifications table already exists");
    }

    // Insert some sample notifications for testing
    const userCheck = await pool.query("SELECT id FROM users LIMIT 1");
    if (userCheck.rows.length > 0) {
      const userId = userCheck.rows[0].id;
      console.log("Inserting sample notifications...");

      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type, read) VALUES
        ($1, 'Welcome to Zenith!', 'Welcome to the Zenith College Forum. Explore clubs and connect with your peers.', 'system', false),
        ($1, 'New Event: Tech Workshop', 'Join us for an exciting tech workshop this Friday at 2 PM in the main auditorium.', 'event', false),
        ($1, 'Assignment Reminder', 'Your project submission is due next week. Make sure to complete all requirements.', 'assignment', true)
        ON CONFLICT DO NOTHING;
      `,
        [userId]
      );

      console.log("Sample notifications inserted!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createNotificationsTable();
