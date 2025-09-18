const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testAuth() {
  try {
    console.log('Testing authentication with admin user...');
    
    // Test login API
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@zenith.com',
        password: 'admin123' // Common test password
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful!');
      console.log('Full login response:', JSON.stringify(loginData, null, 2));
      console.log('Token received:', loginData.token ? 'YES' : 'NO');
      
      if (loginData.token) {
        // Test club management API with token
        console.log('\nTesting club management API...');
        const apiResponse = await fetch('http://localhost:3000/api/club-management', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        console.log('API response status:', apiResponse.status);
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('API call successful!');
          console.log('Data keys:', Object.keys(apiData));
        } else {
          const errorText = await apiResponse.text();
          console.log('API error:', errorText);
        }
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
      
      // Maybe the admin user doesn't have a password set, let's try to create one
      console.log('\nTrying to set password for admin user...');
      const setPasswordResponse = await fetch('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@zenith.com',
          password: 'admin123'
        })
      });
      
      console.log('Set password response status:', setPasswordResponse.status);
      const setPasswordText = await setPasswordResponse.text();
      console.log('Set password response:', setPasswordText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuth();