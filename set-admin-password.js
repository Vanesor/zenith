const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setAdminPassword() {
  try {
    console.log('Setting password for admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('Password hashed successfully');
    
    // Update the admin user with password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, has_password = true WHERE email = $2 RETURNING id, email, has_password',
      [hashedPassword, 'admin@zenith.com']
    );
    
    console.log('Update result:', result.rows);
    
    if (result.rows.length > 0) {
      console.log('Password set successfully for admin@zenith.com');
    } else {
      console.log('No user found with email admin@zenith.com');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdminPassword();