// Test profile API with browser's localStorage token
async function testBrowserToken() {
  console.log('=== Testing Profile API with Browser Token ===\n');

  try {
    // Get token from localStorage (same way the frontend does)
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Found' : 'Not found');
    
    if (!token) {
      console.log('❌ No token in localStorage');
      return;
    }

    console.log('Making request to profile API...');
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Profile API working correctly');
    } else {
      console.log('❌ Profile API error:', data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBrowserToken();
