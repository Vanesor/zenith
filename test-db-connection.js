const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Test if users table exists
    const userCount = await prisma.users.count();
    console.log('✅ Users table accessible, count:', userCount);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.message.includes('connect ECONNREFUSED') || error.message.includes("Can't reach database server")) {
      console.log('\n🔍 Troubleshooting suggestions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Supabase project is active at https://supabase.com/dashboard');
      console.log('3. Check if your IP is whitelisted in Supabase settings');
      console.log('4. Verify DATABASE_URL in .env.local is correct');
      console.log('5. Try connecting from a different network');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
