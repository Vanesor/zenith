#!/usr/bin/env node

// Test actual registration API endpoint using built-in fetch
const { randomBytes } = require('crypto');

// Use global fetch (Node.js 18+) or create a simple test
async function testRegistrationAPI() {
  console.log('🌐 Testing Registration API Endpoint...\n');
  
  const baseUrl = 'http://localhost:3001';
  const timestamp = Date.now();
  const registrationData = {
    email: `test.api.${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`,
    club_id: 'ascend'
  };
  
  try {
    console.log('📝 Test registration data:');
    console.log(`   Email: ${registrationData.email}`);
    console.log(`   Name: ${registrationData.name}`);
    console.log(`   Club: ${registrationData.club_id}`);
    console.log('');
    
    console.log('🚀 Sending registration request...');
    
    // Use curl command instead of fetch
    const { spawn } = require('child_process');
    
    const curlArgs = [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(registrationData),
      `${baseUrl}/api/auth/register`
    ];
    
    const curl = spawn('curl', curlArgs);
    
    let responseData = '';
    let errorData = '';
    
    curl.stdout.on('data', (data) => {
      responseData += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    curl.on('close', (code) => {
      console.log(`📡 Response received (exit code: ${code})`);
      
      if (responseData) {
        try {
          const response = JSON.parse(responseData);
          console.log('📄 Response data:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('\n✅ Registration test PASSED!');
            console.log('🎉 New member can successfully join Zenith');
            console.log(`👤 User created with ID: ${response.user?.id}`);
            console.log(`🔑 Token generated: ${response.token ? 'Yes' : 'No'}`);
          } else {
            console.log('\n❌ Registration test FAILED!');
            console.log('🚨 Issues preventing new members from joining:');
            console.log(`   Error: ${response.error || 'Unknown error'}`);
          }
        } catch (parseError) {
          console.log('📄 Raw response:');
          console.log(responseData);
          
          // Check if it looks like HTML (server error page)
          if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
            console.log('\n⚠️  Received HTML response - likely a server error');
            console.log('🔧 Check the development server logs for details');
          }
        }
      }
      
      if (errorData && !responseData) {
        console.error('❌ Request failed:', errorData);
      }
    });
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the development server is running on port 3001');
    console.log('2. Check if curl is available on your system');
    console.log('3. Verify API routes are properly configured');
  }
}

// Test immediately
testRegistrationAPI().catch(console.error);
