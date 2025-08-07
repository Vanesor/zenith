#!/usr/bin/env node

// Test actual registration API endpoint
const fetch = require('node-fetch');

async function testRegistrationAPI() {
  console.log('🌐 Testing Registration API Endpoint...\n');
  
  const baseUrl = 'http://localhost:3001';
  const registrationData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test.api.${Date.now()}@example.com`,
    phone: '+1234567890',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    dateOfBirth: '1999-01-01',
    interests: ['ascend', 'aster'],
    agreeToTerms: true
  };
  
  try {
    console.log('📝 Test registration data:');
    console.log(`   Email: ${registrationData.email}`);
    console.log(`   Name: ${registrationData.firstName} ${registrationData.lastName}`);
    console.log(`   Interests: ${registrationData.interests.join(', ')}`);
    console.log('');
    
    console.log('🚀 Sending registration request...');
    
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: registrationData.email,
        password: registrationData.password,
        name: `${registrationData.firstName} ${registrationData.lastName}`,
        club_id: 'ascend' // First interest as club_id
      })
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    console.log('📄 Response data:');
    console.log(JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Registration test PASSED!');
      console.log('🎉 New member can successfully join Zenith');
      
      // Test login with the new user
      console.log('\n🔐 Testing login with new user...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registrationData.email,
          password: registrationData.password
        })
      });
      
      console.log(`🔑 Login response: ${loginResponse.status} ${loginResponse.statusText}`);
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login test PASSED!');
        console.log('🎯 End-to-end registration and login working perfectly');
      } else {
        console.log('❌ Login test FAILED!');
        console.log('   Registration works but login has issues');
      }
      
    } else {
      console.log('\n❌ Registration test FAILED!');
      console.log('🚨 Issues preventing new members from joining:');
      console.log(`   Error: ${responseData.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the development server is running (npm run dev)');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify API routes are properly configured');
  }
}

// Wait a bit for server to start, then test
setTimeout(() => {
  testRegistrationAPI().catch(console.error);
}, 5000);
