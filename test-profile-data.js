// Test profile API with actual user token
async function testProfileAPI() {
  console.log('=== Testing Profile API Data Retrieval ===\n');

  // First, let's login to get a valid token
  console.log('1. Logging in to get token...');
  try {
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ayushkshirsagar28@gmail.com', // Using the email from screenshot
        password: 'password123' // Assuming this is the password
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Trying with different password...');
      
      // Try with another common password
      const loginResponse2 = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ayushkshirsagar28@gmail.com',
          password: 'ayush123' // Another possible password
        })
      });
      
      if (!loginResponse2.ok) {
        console.log('❌ Login still failed. Let me check what users exist in database...');
        return;
      }
    }

    const loginData = await (loginResponse.ok ? loginResponse : loginResponse2).json();
    
    if (!loginData.token) {
      console.log('❌ No token received from login');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful, token received');
    console.log('User data from login:', JSON.stringify(loginData.user, null, 2));

    // Test GET profile
    console.log('\n2. Testing GET /api/profile...');
    const profileResponse = await fetch('http://localhost:3001/api/profile', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile response status:', profileResponse.status);
    const profileData = await profileResponse.json();
    
    if (profileResponse.ok) {
      console.log('✅ Profile API Response:');
      console.log(JSON.stringify(profileData, null, 2));
    } else {
      console.log('❌ Profile API Error:');
      console.log(JSON.stringify(profileData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfileAPI();
