const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function testLogin() {
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

    // Check if we have users with password hashes
    console.log("\n📋 Checking users and their password hashes:");
    const users = await client.query(`
      SELECT id, email, name, password_hash, role, club_id 
      FROM users 
      LIMIT 5
    `);

    if (users.rows.length === 0) {
      console.log("❌ No users found in database!");
      return;
    }

    console.log(`Found ${users.rows.length} users:`);
    users.rows.forEach((user) => {
      console.log(`  - ${user.name} (${user.email})`);
      console.log(`    Role: ${user.role}, Club: ${user.club_id}`);
      console.log(
        `    Password hash: ${user.password_hash ? "EXISTS" : "MISSING"}`
      );
      console.log(
        `    Hash length: ${user.password_hash ? user.password_hash.length : 0}`
      );
    });

    // Test password verification with a known user
    const testUser = users.rows[0];
    console.log(`\n🧪 Testing password verification for ${testUser.email}:`);

    // The migration script shows passwords are "password123"
    const testPassword = "password123";
    console.log(`  - Testing password: "${testPassword}"`);

    if (testUser.password_hash) {
      const isValid = await bcrypt.compare(
        testPassword,
        testUser.password_hash
      );
      console.log(`  - Password valid: ${isValid ? "✅ YES" : "❌ NO"}`);

      if (!isValid) {
        // Try some other common passwords that might have been used
        const commonPasswords = ["password", "123456", "admin", "test"];
        for (const pwd of commonPasswords) {
          const valid = await bcrypt.compare(pwd, testUser.password_hash);
          if (valid) {
            console.log(`  - Found working password: "${pwd}" ✅`);
            break;
          }
        }
      }
    } else {
      console.log("  - No password hash found!");
    }

    // Test database connection from our Database class
    console.log("\n🔧 Testing Database class:");
    const Database = require("../src/lib/database.js").default;
    const userByEmail = await Database.getUserByEmail(testUser.email);

    if (userByEmail) {
      console.log(`  - getUserByEmail working: ✅`);
      console.log(`  - User found: ${userByEmail.name}`);
      console.log(
        `  - Has password_hash: ${userByEmail.password_hash ? "✅" : "❌"}`
      );
    } else {
      console.log(`  - getUserByEmail failed: ❌`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await client.end();
  }
}

testLogin();
