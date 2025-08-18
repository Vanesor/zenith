import { db } from './src/lib/db';

/**
 * Simple script to test database connection
 */
async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test a simple query - note the model names match the schema exactly
    const userCount = await db.users.count();
    console.log(`Connected successfully! User count: ${userCount}`);
    
    // Get some basic stats
    const clubCount = await db.clubs.count();
    const assignmentCount = await db.assignments.count();
    const eventCount = await db.events.count();
    
    console.log(`
Database Statistics:
-------------------
Users: ${userCount}
Clubs: ${clubCount}
Assignments: ${assignmentCount}
Events: ${eventCount}
    `);
    
    console.log('Database connection test successful!');
  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
