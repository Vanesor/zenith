const { Client } = require("pg");

async function checkDatabase() {
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

    // Check if users table exists and its schema
    console.log("\n📋 Checking users table schema:");
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    if (usersSchema.rows.length > 0) {
      console.log("Users table columns:");
      usersSchema.rows.forEach((row) => {
        console.log(
          `  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
        );
      });
    } else {
      console.log("Users table does not exist");
    }

    // Check if clubs table exists
    console.log("\n📋 Checking clubs table schema:");
    const clubsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clubs' 
      ORDER BY ordinal_position;
    `);

    if (clubsSchema.rows.length > 0) {
      console.log("Clubs table columns:");
      clubsSchema.rows.forEach((row) => {
        console.log(
          `  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
        );
      });
    } else {
      console.log("Clubs table does not exist");
    }

    // Check data in tables
    console.log("\n📊 Checking data:");
    try {
      const userCount = await client.query(
        "SELECT COUNT(*) as count FROM users"
      );
      console.log(`Users: ${userCount.rows[0].count} records`);

      const clubCount = await client.query(
        "SELECT COUNT(*) as count FROM clubs"
      );
      console.log(`Clubs: ${clubCount.rows[0].count} records`);
    } catch (err) {
      console.log("Error checking data:", err.message);
    }
  } catch (error) {
    console.error("❌ Database check failed:", error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
