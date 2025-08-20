/**
 * Database Client Test Script
 * Tests the new enhanced database client functionality
 */

import db from './src/lib/database.ts';

async function testDatabaseClient() {
  console.log('🧪 Testing Enhanced Database Client...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const isHealthy = await db.healthCheck();
    console.log(`   Health status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

    // Test 2: Basic Query
    console.log('2️⃣ Testing basic query...');
    const timeResult = await db.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`   Current time: ${timeResult.rows[0].current_time}`);
    console.log(`   Database: ${timeResult.rows[0].db_name}\n`);

    // Test 3: Get All Clubs
    console.log('3️⃣ Testing club operations...');
    const clubs = await db.getAllClubs();
    console.log(`   Found ${clubs.length} clubs`);
    if (clubs.length > 0) {
      console.log(`   First club: ${clubs[0].name} (${clubs[0].type})`);
    }
    console.log('');

    // Test 4: Get Statistics
    console.log('4️⃣ Testing statistics...');
    const stats = await db.getHomeStats();
    console.log(`   Total clubs: ${stats.total_clubs}`);
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Total posts: ${stats.total_posts}`);
    console.log(`   Total projects: ${stats.total_projects}`);
    console.log(`   Total tasks: ${stats.total_tasks}\n`);

    // Test 5: Get Posts
    console.log('5️⃣ Testing blog operations...');
    const posts = await db.getAllPosts(5, 0);
    console.log(`   Found ${posts.length} published posts`);
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}" by ${post.author_name || 'Unknown'}`);
    });
    console.log('');

    // Test 6: Get Projects
    console.log('6️⃣ Testing project management...');
    const projects = await db.getAllProjects();
    console.log(`   Found ${projects.length} projects`);
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. "${project.name}" - ${project.status} (${project.club_name || 'No club'})`);
    });
    console.log('');

    // Test 7: Prisma Compatibility Layer
    console.log('7️⃣ Testing Prisma compatibility layer...');
    const userCount = await db.users.count();
    const clubCount = await db.clubs.count();
    const postCount = await db.posts.count();
    console.log(`   Users (Prisma syntax): ${userCount}`);
    console.log(`   Clubs (Prisma syntax): ${clubCount}`);
    console.log(`   Posts (Prisma syntax): ${postCount}\n`);

    // Test 8: Get Client Statistics
    console.log('8️⃣ Testing client performance statistics...');
    const clientStats = db.getStats();
    console.log(`   Total queries: ${clientStats.totalQueries}`);
    console.log(`   Successful queries: ${clientStats.successfulQueries}`);
    console.log(`   Failed queries: ${clientStats.failedQueries}`);
    console.log(`   Average response time: ${clientStats.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Cache hits: ${clientStats.cacheHits}`);
    console.log(`   Cache misses: ${clientStats.cacheMisses}`);
    console.log(`   Cache size: ${clientStats.cacheSize}`);
    console.log(`   Pool - Total connections: ${clientStats.poolStats.totalCount}`);
    console.log(`   Pool - Idle connections: ${clientStats.poolStats.idleCount}`);
    console.log(`   Pool - Waiting connections: ${clientStats.poolStats.waitingCount}\n`);

    console.log('✅ All database tests completed successfully!');
    console.log('🚀 Enhanced database client is working properly.');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up database connections...');
    await db.close();
    console.log('✅ Database connections closed.');
    process.exit(0);
  }
}

// Run the tests
testDatabaseClient().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
