const Database = require('./src/lib/database.ts');

async function checkUserData() {
  console.log('=== Checking User Data in Database ===\n');
  
  const db = new Database();
  
  try {
    // Check current user table structure
    console.log('1. Checking user table structure...');
    const tableInfo = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('User table columns:');
    tableInfo.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check actual user data
    console.log('\n2. Checking user data...');
    const users = await db.query('SELECT id, name, email, username, bio, phone, location, avatar, role FROM users LIMIT 5');
    
    console.log('Sample user data:');
    users.rows.forEach(user => {
      console.log('User:', JSON.stringify(user, null, 2));
    });

    // Check for the specific user
    console.log('\n3. Looking for ayushkshirsagar28@gmail.com...');
    const specificUser = await db.query('SELECT * FROM users WHERE email = $1', ['ayushkshirsagar28@gmail.com']);
    
    if (specificUser.rows.length > 0) {
      console.log('Found user:');
      console.log(JSON.stringify(specificUser.rows[0], null, 2));
    } else {
      console.log('User not found. Available emails:');
      const emails = await db.query('SELECT email FROM users LIMIT 10');
      emails.rows.forEach(row => console.log(`- ${row.email}`));
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await db.close();
  }
}

checkUserData();
