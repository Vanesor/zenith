require('dotenv').config({ path: '.env.local' });
// Import from the custom generated location
const { PrismaClient } = require('./src/generated/prisma');

async function testPrismaConnection() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('DIRECT_URL:', process.env.DIRECT_URL);
  
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL
      }
    }
  });
  
  try {
    console.log('Testing Prisma connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    console.log('Testing if prisma client has users model...');
    console.log('Prisma client properties:', Object.keys(prisma));
    
    // Test if users table exists
    try {
      const userCount = await prisma.users.count();
      console.log('✅ Users table accessible, count:', userCount);
    } catch (userError) {
      console.log('❌ Users table error:', userError.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
