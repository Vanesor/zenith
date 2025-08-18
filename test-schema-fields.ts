import { db } from './src/lib/db';

/**
 * Simple script to verify our database setup works correctly
 */
async function main() {
  try {
    console.log('\n🔍 Zenith Database Verification Test\n');
    
    // 1. Basic connection test
    console.log('1️⃣ Testing database connection...');
    const userCount = await db.users.count();
    console.log(`✅ Connected successfully! Found ${userCount} users.`);
    
    // 2. Test a specific model query
    console.log('\n2️⃣ Testing user query with original field names...');
    const adminUser = await db.users.findFirst({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        role: true
      }
    });
    
    if (adminUser) {
      console.log('✅ Successfully queried user data using schema fields:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Created: ${adminUser.created_at}`);
    }
    
    // 3. Test a relationship query
    console.log('\n3️⃣ Testing relationship query...');
    const assignments = await db.assignments.findMany({
      take: 3,
      include: {
        assignment_questions: {
          take: 2
        }
      }
    });
    
    console.log(`✅ Found ${assignments.length} assignments with their questions:`);
    assignments.forEach((assignment, i) => {
      console.log(`   Assignment ${i+1}: ${assignment.title} (${assignment.assignment_questions.length} questions)`);
    });
    
    console.log('\n✅ All database tests passed successfully!');
    console.log('You can use the db client from "@/lib/db" in your application.');
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
