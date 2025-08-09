#!/usr/bin/env node

// Test the profile API endpoint
const { spawn } = require('child_process');

async function testProfileAPI() {
  console.log('🧪 Testing Profile API Endpoint...\n');
  
  // First, we need to get a valid token by logging in
  console.log('1️⃣ Getting authentication token...');
  
  const loginData = {
    email: 'ayushkshirsagar28@gmail.com',
    password: 'password123' // This might need to be updated based on the actual password
  };
  
  const loginCurl = spawn('curl', [
    '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify(loginData),
    'http://localhost:3001/api/auth/login',
    '-s' // Silent mode
  ]);
  
  let loginResponse = '';
  let loginError = '';
  
  loginCurl.stdout.on('data', (data) => {
    loginResponse += data.toString();
  });
  
  loginCurl.stderr.on('data', (data) => {
    loginError += data.toString();
  });
  
  loginCurl.on('close', (code) => {
    if (loginResponse) {
      try {
        const loginResult = JSON.parse(loginResponse);
        console.log('📡 Login response:', loginResult.success ? 'Success' : 'Failed');
        
        if (loginResult.success && loginResult.token) {
          console.log('✅ Token obtained');
          
          // Now test the profile API
          console.log('\n2️⃣ Testing profile API...');
          testProfileEndpoint(loginResult.token);
          
        } else {
          console.log('❌ Failed to get token:', loginResult.error || 'Unknown error');
          console.log('💡 You may need to register this user first or check the password');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse login response');
        console.log('Raw response:', loginResponse);
      }
    } else if (loginError) {
      console.log('❌ Login request failed:', loginError);
    }
  });
}

function testProfileEndpoint(token) {
  const profileCurl = spawn('curl', [
    '-X', 'GET',
    '-H', 'Content-Type: application/json',
    '-H', `Authorization: Bearer ${token}`,
    'http://localhost:3001/api/profile',
    '-s' // Silent mode
  ]);
  
  let profileResponse = '';
  let profileError = '';
  
  profileCurl.stdout.on('data', (data) => {
    profileResponse += data.toString();
  });
  
  profileCurl.stderr.on('data', (data) => {
    profileError += data.toString();
  });
  
  profileCurl.on('close', (code) => {
    console.log(`📡 Profile API response (exit code: ${code})`);
    
    if (profileResponse) {
      try {
        const profileData = JSON.parse(profileResponse);
        console.log('📄 Profile data:');
        console.log(JSON.stringify(profileData, null, 2));
        
        if (profileData.success) {
          console.log('\n✅ Profile API test PASSED!');
          console.log('🎉 Profile data retrieved successfully');
          console.log(`👤 User: ${profileData.profile.firstName} ${profileData.profile.lastName}`);
          console.log(`📧 Email: ${profileData.profile.email}`);
          console.log(`🏢 Club: ${profileData.profile.club?.name || 'No club'}`);
        } else {
          console.log('\n❌ Profile API test FAILED!');
          console.log(`   Error: ${profileData.error}`);
        }
      } catch (parseError) {
        console.log('📄 Raw profile response:');
        console.log(profileResponse);
        
        if (profileResponse.includes('<!DOCTYPE html>') || profileResponse.includes('<html>')) {
          console.log('\n⚠️  Received HTML response - likely a server error');
        }
      }
    } else if (profileError) {
      console.log('❌ Profile request failed:', profileError);
    }
  });
}

// Run the test
testProfileAPI().catch(console.error);
