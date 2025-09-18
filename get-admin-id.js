const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function getAdminId() {
  try {
    const result = await pool.query('SELECT id, email, role FROM users WHERE email = $1', ['admin@zenith.com']);
    console.log('Admin user:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

getAdminId();