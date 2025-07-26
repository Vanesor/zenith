const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "zenith", // Changed from zenith_forum to zenith
    password: "1234", // Update this with your PostgreSQL password
    port: 5432,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL");

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "01_single_club_migration.sql"),
      "utf8"
    );

    console.log("🔄 Running migration...");
    await client.query(migrationSQL);
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
