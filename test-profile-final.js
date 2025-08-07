// Test the complete profile system functionality
async function testProfileSystem() {
  console.log('=== Testing Complete Profile System ===\n');

  // First, let's register a test user to get a valid token
  const testUser = {
    name: 'Profile Test User',
    email: `profiletest${Date.now()}@example.com`,
    password: 'password123',
    confirmPassword: 'password123'
  };

  console.log('1. Creating test user...');
  try {
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      console.log('Registration failed:', registerData.error);
      return;
    }

    const token = registerData.token;
    console.log('✅ User registered successfully');
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test GET profile
    console.log('\n2. Testing GET /api/profile...');
    const getResponse = await fetch('http://localhost:3001/api/profile', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const getProfileData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET Profile successful');
      console.log('Profile data:', JSON.stringify(getProfileData, null, 2));
    } else {
      console.log('❌ GET Profile failed:', getProfileData.error);
      return;
    }

    // Test PUT profile (update)
    console.log('\n3. Testing PUT /api/profile...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      username: 'updated_user',
      bio: 'This is my updated bio!',
      phone: '123-456-7890',
      location: 'New York, NY',
      website: 'https://example.com',
      github: 'github_user',
      linkedin: 'linkedin_user',
      twitter: 'twitter_user'
    };

    const putResponse = await fetch('http://localhost:3001/api/profile', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const putProfileData = await putResponse.json();
    
    if (putResponse.ok) {
      console.log('✅ PUT Profile successful');
      console.log('Updated profile:', JSON.stringify(putProfileData, null, 2));
    } else {
      console.log('❌ PUT Profile failed:', putProfileData.error);
    }

    // Test GET profile again to verify changes
    console.log('\n4. Verifying changes with GET /api/profile...');
    const verifyResponse = await fetch('http://localhost:3001/api/profile', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok) {
      console.log('✅ Profile verification successful');
      console.log('Final profile data:', JSON.stringify(verifyData, null, 2));
      
      // Check if updates were applied
      const updates = [
        { field: 'firstName', expected: updateData.firstName, actual: verifyData.firstName },
        { field: 'lastName', expected: updateData.lastName, actual: verifyData.lastName },
        { field: 'username', expected: updateData.username, actual: verifyData.username },
        { field: 'bio', expected: updateData.bio, actual: verifyData.bio },
        { field: 'phone', expected: updateData.phone, actual: verifyData.phone }
      ];

      console.log('\n5. Validation Results:');
      updates.forEach(({ field, expected, actual }) => {
        const match = expected === actual;
        console.log(`${match ? '✅' : '❌'} ${field}: Expected "${expected}", Got "${actual}"`);
      });
    } else {
      console.log('❌ Profile verification failed:', verifyData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testProfileSystem();
