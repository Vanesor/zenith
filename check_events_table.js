import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "zenith",
  user: "postgres",
  password: "1234",
});

async function checkEventsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      ORDER BY ordinal_position;
    `);

    console.log("Events table columns:");
    result.rows.forEach((row) => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkEventsTable();
