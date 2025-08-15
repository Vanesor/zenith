require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkClubLeadership() {
  console.log('=== Checking Club Leadership Data ===\n');
  
  const supabase = createClient(
    'https://qpulpytptbwwumicyzwr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdWxweXRwdGJ3d3VtaWN5endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTcwNTEsImV4cCI6MjA2MzE3MzA1MX0.-BgLuJXa4oAmdmMfE994X3reXBP5uioitt25Mw_3ofY'
  );
  
  try {
    // Check club data
    console.log('1. Checking ASCEND club data...');
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        coordinator_id,
        co_coordinator_id,
        secretary_id,
        media_id
      `)
      .eq("id", "ascend")
      .single();

    if (clubError) {
      console.error('Club error:', clubError);
      return;
    }

    console.log('Club data:');
    console.log(JSON.stringify(clubData, null, 2));

    // Check if there are any users
    console.log('\n2. Checking available users...');
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .limit(10);

    if (usersError) {
      console.error('Users error:', usersError);
      return;
    }

    console.log('Available users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // Check if leadership IDs exist in users table
    const leadershipIds = [
      clubData.coordinator_id,
      clubData.co_coordinator_id,
      clubData.secretary_id,
      clubData.media_id,
    ].filter(Boolean);

    if (leadershipIds.length > 0) {
      console.log('\n3. Checking leadership users...');
      const { data: leadershipData, error: leadershipError } = await supabase
        .from("users")
        .select("id, name, email, avatar")
        .in("id", leadershipIds);

      if (leadershipError) {
        console.error('Leadership error:', leadershipError);
        return;
      }

      console.log('Leadership users found:');
      leadershipData.forEach(leader => {
        console.log(`- ${leader.name} (${leader.email}) - ID: ${leader.id}`);
      });
    } else {
      console.log('\n3. No leadership IDs set for ASCEND club');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkClubLeadership();
