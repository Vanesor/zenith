const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function createChatRooms() {
  try {
    await client.connect();

    // Check if chat_rooms table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_rooms'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Create chat_rooms table
      await client.query(`
        CREATE TABLE chat_rooms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          club_id VARCHAR(50) REFERENCES clubs(id),
          type VARCHAR(50) DEFAULT 'public',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Created chat_rooms table");
    }

    // Check if chat_messages table exists
    const messagesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_messages'
      );
    `);

    if (!messagesTableCheck.rows[0].exists) {
      // Create chat_messages table
      await client.query(`
        CREATE TABLE chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
          author_id UUID REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'text',
          reply_to UUID REFERENCES chat_messages(id),
          attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Created chat_messages table");
    }

    // Insert default chat rooms for each club
    const clubs = await client.query("SELECT id, name FROM clubs");

    for (const club of clubs.rows) {
      // Check if chat rooms already exist for this club
      const existingRooms = await client.query(
        "SELECT id FROM chat_rooms WHERE club_id = $1",
        [club.id]
      );

      if (existingRooms.rows.length === 0) {
        // Create default chat rooms for this club
        const rooms = [
          {
            name: "General",
            description: "General discussions",
            type: "public",
          },
          {
            name: "Announcements",
            description: "Important announcements",
            type: "announcement",
          },
          {
            name: "Help & Support",
            description: "Get help from other members",
            type: "public",
          },
        ];

        for (const room of rooms) {
          await client.query(
            `
            INSERT INTO chat_rooms (name, description, club_id, type)
            VALUES ($1, $2, $3, $4)
          `,
            [room.name, room.description, club.id, room.type]
          );
        }

        console.log(`Created chat rooms for ${club.name}`);
      }
    }

    console.log("Chat rooms setup completed");
  } catch (error) {
    console.error("Error setting up chat rooms:", error.message);
  } finally {
    await client.end();
  }
}

createChatRooms();
