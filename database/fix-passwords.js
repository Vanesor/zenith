const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function fixPasswordHashes() {
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

    // Check current password hashes
    console.log("\n📋 Current password hashes in database:");
    const users = await client.query(
      `SELECT id, email, name, password_hash FROM users LIMIT 5`
    );

    users.rows.forEach((user) => {
      console.log(
        `  - ${user.email}: ${user.password_hash} (length: ${
          user.password_hash?.length || 0
        })`
      );
    });

    // Generate proper bcrypt hash for "password123"
    console.log("\n🔧 Generating proper bcrypt hash for 'password123'...");
    const properHash = await bcrypt.hash("password123", 12);
    console.log(`Generated hash: ${properHash} (length: ${properHash.length})`);

    // Update all users with the proper hash
    console.log("\n🔄 Updating all users with proper password hash...");
    const updateResult = await client.query(
      `
      UPDATE users SET password_hash = $1
    `,
      [properHash]
    );

    console.log(`✅ Updated ${updateResult.rowCount} users`);

    // Verify the update
    console.log("\n🧪 Testing password verification:");
    const testUser = await client.query(
      `SELECT email, password_hash FROM users WHERE email = $1`,
      ["alex.chen.coord@zenith.edu"]
    );

    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      const isValid = await bcrypt.compare("password123", user.password_hash);
      console.log(
        `  - Password verification for ${user.email}: ${
          isValid ? "✅ SUCCESS" : "❌ FAILED"
        }`
      );
      console.log(`  - Hash length: ${user.password_hash.length}`);
    }

    console.log("\n🎉 All users now have proper password hashes!");
    console.log("You can now login with:");
    console.log("  - Email: alex.chen.coord@zenith.edu");
    console.log("  - Password: password123");
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  } finally {
    await client.end();
  }
}

fixPasswordHashes();
