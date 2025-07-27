const bcrypt = require('bcryptjs');

async function testCurrentHash() {
  const password = 'password123';
  const currentHash = '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu';
  
  console.log('=== TESTING CURRENT DUMMY USER HASH ===');
  console.log('Password:', password);
  console.log('Hash from dummy_users.sql:', currentHash);
  
  const isValid = await bcrypt.compare(password, currentHash);
  console.log('✅ Hash validates:', isValid);
  
  if (isValid) {
    console.log('🎉 SUCCESS! Current dummy_users.sql is correct!');
  } else {
    console.log('❌ FAILED! Need to regenerate hash...');
    
    // Generate correct hash
    const correctHash = await bcrypt.hash(password, 12);
    console.log('Correct hash should be:', correctHash);
  }
}

testCurrentHash().catch(console.error);
