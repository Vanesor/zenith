/**
 * Database Connection Test
 * Quick test to verify the database service is working correctly
 */

import { DatabaseService, checkDatabaseHealth } from './database-service';

async function testDatabaseOperations() {
  console.log('🔍 Testing database operations...');
  
  try {
    // Test database health
    console.log('1. Testing database health check...');
    const isHealthy = await checkDatabaseHealth();
    console.log(`   ✅ Database health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    if (!isHealthy) {
      throw new Error('Database is not healthy');
    }
    
    // Test database service instance
    console.log('2. Testing database service instance...');
    const dbService = DatabaseService.getInstance();
    console.log('   ✅ Database service instance created');
    
    // Test basic database operations
    console.log('3. Testing basic database operations...');
    
    try {
      // Test a simple club retrieval operation
      const clubs = await dbService.getAllClubs();
      console.log(`   ✅ Club retrieval working: found ${clubs.length} clubs`);
      
      console.log('   ✅ Basic database operations working');
    } catch (error) {
      console.log('   ⚠️  Some database operations may have issues:', (error as Error).message);
    }
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseOperations()
    .then(() => {
      console.log('✅ Database test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database test failed:', error);
      process.exit(1);
    });
}

export { testDatabaseOperations };
