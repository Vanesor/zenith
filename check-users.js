const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, email, name, role FROM users ORDER BY email LIMIT 10');
    console.log('Users in database:');
    console.table(result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();