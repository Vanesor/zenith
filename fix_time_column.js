const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function fixTimeColumn() {
  try {
    console.log("Making time column nullable...");
    await pool.query("ALTER TABLE events ALTER COLUMN time DROP NOT NULL;");
    console.log("Time column updated successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixTimeColumn();
