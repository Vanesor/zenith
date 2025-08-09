// Quick script to manually update a user's avatar in the database for testing
const { createConnection } = require('pg');

async function updateUserAvatar() {
  const client = createConnection({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:Yg0M6AKKGzTy@ep-steep-snowflake-a54ltawy.us-east-2.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    
    // Update the current user's avatar with one of the uploaded files
    const avatarUrl = '/uploads/avatars/avatar_1d5b1108-eb4c-4191-ae75-751e3610d519_1754549999329.png';
    const userId = '1d5b1108-eb4c-4191-ae75-751e3610d519';
    
    const result = await client.query(
      'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING name, avatar',
      [avatarUrl, userId]
    );
    
    console.log('Updated user:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateUserAvatar();
