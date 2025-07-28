const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase JavaScript Client Connection...\n');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseKey ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // Test basic connection
    console.log('\n🔍 Testing connection with a simple query...');
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log('👥 Total users:', count || 0);

    // Test other tables
    const tables = ['posts', 'events', 'clubs'];
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        console.log(`📊 Total ${table}:`, count || 0);
      } catch (tableError) {
        console.log(`⚠️  Table '${table}' not found or accessible`);
      }
    }

    console.log('\n🎉 Supabase connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testSupabaseConnection();
