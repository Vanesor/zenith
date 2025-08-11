// Test current profile API functionality
async function testCurrentAPI() {
  console.log('=== Testing Current Profile API ===\n');

  try {
    // Test the endpoint without auth first
    console.log('1. Testing API endpoint...');
    const response = await fetch('http://localhost:3001/api/profile');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.status === 401) {
      console.log('✅ API is working - correctly rejecting unauthorized requests');
    }

    // Now let's try to create a token and test with auth
    console.log('\n2. Testing with potential auth token...');
    
    // First, let's see what login endpoints exist
    const loginTest = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'test123' 
      })
    });
    
    console.log('Login test status:', loginTest.status);
    const loginData = await loginTest.json();
    console.log('Login response:', loginData);

  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testCurrentAPI();
