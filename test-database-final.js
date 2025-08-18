const { db, checkDatabaseHealth } = require('./src/lib/database.ts');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test health check
    const isHealthy = await checkDatabaseHealth();
    console.log('Database health check:', isHealthy ? '✅ Healthy' : '❌ Failed');
    
    // Test basic counts
    const stats = await db.getDashboardStats();
    console.log('Dashboard stats:', stats);
    
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testDatabase();
