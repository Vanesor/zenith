const { Client } = require("pg");

async function safeMigration() {
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

    // Step 1: Drop all foreign key constraints that reference users table
    console.log("🔄 Step 1: Dropping foreign key constraints...");

    const dropConstraints = `
      -- Drop foreign key constraints from clubs table
      ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_coordinator_id_fkey;
      ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_co_coordinator_id_fkey;
      ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_secretary_id_fkey;
      ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_media_id_fkey;
      
      -- Drop any other foreign key constraints that might reference users
      ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
      ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
      ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
      ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;
    `;

    await client.query(dropConstraints);
    console.log("✅ Foreign key constraints dropped");

    // Step 2: Add the new club_id column
    console.log("🔄 Step 2: Adding club_id column...");
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS club_id VARCHAR(50);`
    );

    // Step 3: Migrate data from clubs array to club_id
    console.log("🔄 Step 3: Migrating data...");

    // Get all users with clubs array
    const usersWithClubs = await client.query(`
      SELECT id, clubs FROM users WHERE clubs IS NOT NULL AND array_length(clubs, 1) > 0
    `);

    console.log(
      `Found ${usersWithClubs.rows.length} users with club memberships`
    );

    // Update each user to have their first club as club_id (single club restriction)
    for (const user of usersWithClubs.rows) {
      if (user.clubs && user.clubs.length > 0) {
        const firstClub = user.clubs[0];
        await client.query(
          `
          UPDATE users SET club_id = $1 WHERE id = $2
        `,
          [firstClub, user.id]
        );
        console.log(`✓ Updated user ${user.id} to club ${firstClub}`);
      }
    }

    // Step 4: Drop the old clubs column
    console.log("🔄 Step 4: Dropping old clubs column...");
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS clubs;`);

    // Step 5: Add foreign key constraint for club_id
    console.log("🔄 Step 5: Adding new foreign key constraint...");
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_club_id_fkey 
      FOREIGN KEY (club_id) REFERENCES clubs(id);
    `);

    // Step 6: Re-add the other foreign key constraints
    console.log("🔄 Step 6: Re-adding other foreign key constraints...");

    const addConstraints = `
      -- Re-add foreign key constraints to clubs table
      ALTER TABLE clubs ADD CONSTRAINT clubs_coordinator_id_fkey 
        FOREIGN KEY (coordinator_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_co_coordinator_id_fkey 
        FOREIGN KEY (co_coordinator_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_secretary_id_fkey 
        FOREIGN KEY (secretary_id) REFERENCES users(id);
      ALTER TABLE clubs ADD CONSTRAINT clubs_media_id_fkey 
        FOREIGN KEY (media_id) REFERENCES users(id);
      
      -- Re-add other foreign key constraints
      ALTER TABLE events ADD CONSTRAINT events_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
      ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id);
      ALTER TABLE comments ADD CONSTRAINT comments_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id);
      ALTER TABLE announcements ADD CONSTRAINT announcements_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
    `;

    await client.query(addConstraints);
    console.log("✅ Foreign key constraints re-added");

    console.log("🎉 Migration completed successfully!");

    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const verifyResult = await client.query(`
      SELECT 
        u.id, u.name, u.club_id, c.name as club_name
      FROM users u 
      LEFT JOIN clubs c ON u.club_id = c.id 
      WHERE u.club_id IS NOT NULL
      LIMIT 5
    `);

    console.log("Sample user-club relationships:");
    verifyResult.rows.forEach((row) => {
      console.log(`  - ${row.name} → ${row.club_name} (${row.club_id})`);
    });
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await client.end();
  }
}

safeMigration();
