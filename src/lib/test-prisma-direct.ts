/**
 * Direct Prisma Client Test
 * Test Prisma client directly to verify it's working
 */

import { prisma } from './database-service';

async function testPrismaClient() {
  console.log('🔍 Testing Prisma client directly...');
  
  try {
    // Test basic query
    console.log('1. Testing basic health check...');
    await db.$queryRaw`SELECT 1`;
    console.log('   ✅ Prisma client health check passed');
    
    // Test table access
    console.log('2. Testing table access...');
    
    // Test each main table
    const userCount = await db.users.count();
    console.log(`   ✅ Users table: ${userCount} records`);
    
    const clubCount = await db.clubs.count();
    console.log(`   ✅ Clubs table: ${clubCount} records`);
    
    const sessionCount = await db.sessions.count();
    console.log(`   ✅ Sessions table: ${sessionCount} records`);
    
    const assignmentCount = await db.assignments.count();
    console.log(`   ✅ Assignments table: ${assignmentCount} records`);
    
    console.log('🎉 All Prisma client tests passed!');
    
  } catch (error) {
    console.error('❌ Prisma client test failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testPrismaClient()
  .then(() => {
    console.log('✅ Prisma client test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Prisma client test failed:', error);
    process.exit(1);
  });
