const bcrypt = require('bcryptjs');

async function testPasswordHash() {
  const password = 'password123';
  const dummyHash = '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu';
  
  console.log('=== FINAL PASSWORD VERIFICATION ===');
  console.log('Testing password:', password);
  console.log('Against hash:', dummyHash);
  
  const isValid = await bcrypt.compare(password, dummyHash);
  console.log('✅ Password validates:', isValid);
  
  if (isValid) {
    console.log('🎉 SUCCESS! Your dummy users will now authenticate correctly!');
    console.log('\n📋 Test login credentials:');
    console.log('Email: admin@zenith.com');
    console.log('Password: password123');
  } else {
    console.log('❌ FAILED! Hash still incorrect');
  }
}

testPasswordHash().catch(console.error);
