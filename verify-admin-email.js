const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function verifyAdminEmail() {
  try {
    console.log('Setting admin user as email verified...');
    
    const result = await pool.query(
      'UPDATE users SET email_verified = true WHERE email = $1 RETURNING id, email, email_verified',
      ['admin@zenith.com']
    );
    
    console.log('Update result:', result.rows[0]);
    
    if (result.rows.length > 0) {
      console.log('✅ Admin user email verified successfully');
    } else {
      console.log('❌ No user found with email admin@zenith.com');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

verifyAdminEmail();