const { Client } = require("pg");

async function checkPostsColumns() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "zenith",
    password: "1234",
    port: 5432,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posts' ORDER BY ordinal_position
    `);

    console.log("Posts table columns:");
    result.rows.forEach((row) => console.log(`  - ${row.column_name}`));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await client.end();
  }
}

checkPostsColumns();
