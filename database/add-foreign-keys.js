const { Client } = require("pg");

async function addForeignKeys() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "zenith",
    password: "1234",
    port: 5432,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL");

    console.log("🔄 Adding foreign key constraints...");

    const addConstraints = `
      -- Add foreign key constraint for users.club_id
      ALTER TABLE users ADD CONSTRAINT users_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES clubs(id);
        
      -- Re-add foreign key constraints to clubs table
      ALTER TABLE clubs ADD CONSTRAINT clubs_coordinator_id_fkey 
        FOREIGN KEY (coordinator_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_co_coordinator_id_fkey 
        FOREIGN KEY (co_coordinator_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_secretary_id_fkey 
        FOREIGN KEY (secretary_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_media_id_fkey 
        FOREIGN KEY (media_id) REFERENCES users(id);
      
      -- Add foreign key constraints based on actual table schemas
      ALTER TABLE events ADD CONSTRAINT events_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
      ALTER TABLE events ADD CONSTRAINT events_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES clubs(id);
        
      ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id);
      ALTER TABLE posts ADD CONSTRAINT posts_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES clubs(id);
        
      ALTER TABLE comments ADD CONSTRAINT comments_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id);
      ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES posts(id);
        
      ALTER TABLE announcements ADD CONSTRAINT announcements_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id);
      ALTER TABLE announcements ADD CONSTRAINT announcements_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES clubs(id);
    `;

    await client.query(addConstraints);
    console.log("✅ All foreign key constraints added successfully!");
  } catch (error) {
    console.error("❌ Adding constraints failed:", error.message);
    // Don't exit on error, some constraints might already exist
  } finally {
    await client.end();
  }
}

addForeignKeys();
