// Browser console test for profile API
// Open browser console on the profile page and paste this code

console.log('=== Testing Profile API in Browser ===');

async function testProfileInBrowser() {
  try {
    // Check if token exists
    const token = localStorage.getItem('zenith-token');
    console.log('Token exists:', token ? 'Yes' : 'No');
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'N/A');
    
    if (!token) {
      console.log('❌ No token found. Please log in first.');
      return;
    }

    // Test GET profile
    console.log('\n1. Testing GET /api/profile...');
    const getResponse = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('GET Response status:', getResponse.status);
    
    const getData = await getResponse.json();
    console.log('GET Response data:', getData);

    if (getResponse.ok && getData.profile) {
      console.log('✅ Profile data loaded successfully');
      console.log('Profile fields:');
      Object.keys(getData.profile).forEach(key => {
        console.log(`  ${key}:`, getData.profile[key]);
      });

      // Test PUT profile update
      console.log('\n2. Testing PUT /api/profile...');
      const updateData = {
        ...getData.profile,
        bio: 'Updated bio from browser test - ' + new Date().toLocaleTimeString(),
        phone: '9876543210'
      };

      const putResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('PUT Response status:', putResponse.status);
      const putData = await putResponse.json();
      console.log('PUT Response data:', putData);

      if (putResponse.ok) {
        console.log('✅ Profile update successful');
      } else {
        console.log('❌ Profile update failed:', putData.error);
      }
    } else {
      console.log('❌ Profile data loading failed:', getData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProfileInBrowser();
