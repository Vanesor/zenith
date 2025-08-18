// Test script to verify database.ts functionality

const { default: db, prismaClient, checkDatabaseHealth } = require('./src/lib/database');

async function testDatabase() {
  try {
    console.log('Database Health Check:', await checkDatabaseHealth());
    
    console.log('Database Service Test:');
    
    // Test database connection
    console.log('Connected to database successfully.');
    
    // Get some basic stats
    const userCount = await prismaClient.user.count();
    const clubCount = await prismaClient.club.count();
    const assignmentCount = await prismaClient.assignment.count();
    const postCount = await prismaClient.post.count();
    
    console.log('Database stats:');
    console.log(`- User count: ${userCount}`);
    console.log(`- Club count: ${clubCount}`);
    console.log(`- Assignment count: ${assignmentCount}`);
    console.log(`- Post count: ${postCount}`);
    
    // Close connection
    await prismaClient.$disconnect();
    console.log('Connection closed successfully.');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Run the test
testDatabase();
