require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Testing Prisma connection...');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
  console.log(`DIRECT_URL: ${process.env.DIRECT_URL}`);
  
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT NOW() as server_time`;
    console.log('✅ Connection successful!');
    console.log(`✅ Server time: ${result[0].server_time}`);
    
    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ Database version: ${versionResult[0].version}`);
    
    // Try to query a table to further validate connection
    try {
      const usersCount = await prisma.users.count();
      console.log(`✅ Users count: ${usersCount}`);
    } catch (tableError) {
      console.log('ℹ️ Could not query users table, but connection is working');
      console.log(`Table error: ${tableError.message}`);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
