const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function checkUsers() {
  try {
    await client.connect();
    const result = await client.query(
      "SELECT id, email, name FROM users LIMIT 5"
    );
    console.log("Sample users in database:");
    result.rows.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`
      );
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
