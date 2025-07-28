const { SupabaseHelpers } = require('./src/lib/database');
require('dotenv').config({ path: '.env.local' });

async function testDashboardQueries() {
  try {
    console.log('🔍 Testing Dashboard Queries...\n');
    
    // Test the home stats function
    console.log('📊 Testing home stats...');
    const stats = await SupabaseHelpers.getHomeStats();
    console.log('Stats:', stats);
    
    console.log('\n✅ Dashboard queries test completed!');
    
  } catch (error) {
    console.error('❌ Dashboard queries test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDashboardQueries();
