const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkAdminPermissions() {
  try {
    console.log('Checking admin user permissions...');
    
    // Get admin user details
    const adminResult = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['admin@zenith.com']
    );
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user not found!');
      await pool.end();
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log('✅ Admin user found:', admin);
    
    // Check if admin role has proper permissions
    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      console.log('⚠️  Admin user does not have admin role, updating...');
      
      const updateResult = await pool.query(
        'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role',
        ['admin', 'admin@zenith.com']
      );
      
      console.log('✅ Admin role updated:', updateResult.rows[0]);
    } else {
      console.log('✅ Admin user has correct role');
    }
    
    // Test the hasClubManagementAccess function logic
    console.log('\n--- Testing Club Management Access Logic ---');
    
    // Admin should have access to all clubs
    console.log('Admin access level: admin (should have full access)');
    
    // Check clubs in database
    const clubsResult = await pool.query('SELECT id, name FROM clubs ORDER BY name');
    console.log('Available clubs:');
    clubsResult.rows.forEach(club => {
      console.log(`  - ${club.name} (${club.id})`);
    });
    
    // Check committee membership (for zenith level access)
    const committeeResult = await pool.query(
      'SELECT cm.*, cr.name as role_name, c.name as committee_name FROM committee_members cm JOIN committee_roles cr ON cm.role_id = cr.id JOIN committees c ON cm.committee_id = c.id WHERE cm.user_id = $1 AND cm.status = $2',
      [admin.id, 'active']
    );
    
    console.log('\nCommittee memberships:');
    if (committeeResult.rows.length === 0) {
      console.log('  - None found');
    } else {
      committeeResult.rows.forEach(membership => {
        console.log(`  - ${membership.committee_name}: ${membership.role_name}`);
      });
    }
    
    // Check club coordinator roles
    const clubCoordinatorResult = await pool.query(
      'SELECT cm.*, c.name as club_name FROM club_members cm JOIN clubs c ON cm.club_id = c.id WHERE cm.user_id = $1 AND (cm.role = $2 OR cm.role = $3) AND cm.is_current_term = true',
      [admin.id, 'coordinator', 'co_coordinator']
    );
    
    console.log('\nClub coordinator roles:');
    if (clubCoordinatorResult.rows.length === 0) {
      console.log('  - None found');
    } else {
      clubCoordinatorResult.rows.forEach(role => {
        console.log(`  - ${role.club_name}: ${role.role}`);
      });
    }
    
    console.log('\n✅ Permissions check complete!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

checkAdminPermissions();