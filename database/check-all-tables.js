const { Client } = require("pg");

async function checkAllTables() {
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

    const tables = [
      "users",
      "clubs",
      "events",
      "posts",
      "comments",
      "announcements",
    ];

    for (const tableName of tables) {
      console.log(`\n📋 ${tableName.toUpperCase()} table:`);

      const schema = await client.query(
        `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `,
        [tableName]
      );

      if (schema.rows.length > 0) {
        schema.rows.forEach((row) => {
          console.log(
            `  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
          );
        });
      } else {
        console.log(`  Table does not exist`);
      }
    }

    // Verify the migration worked
    console.log("\n🔍 Verifying users table migration:");
    const userCheck = await client.query(`
      SELECT 
        u.id, u.name, u.club_id, c.name as club_name
      FROM users u 
      LEFT JOIN clubs c ON u.club_id = c.id 
      WHERE u.club_id IS NOT NULL
      LIMIT 3
    `);

    console.log("Sample user-club relationships:");
    userCheck.rows.forEach((row) => {
      console.log(`  - ${row.name} → ${row.club_name} (${row.club_id})`);
    });
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  } finally {
    await client.end();
  }
}

checkAllTables();
