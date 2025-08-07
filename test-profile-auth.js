// Test profile API with mock JWT token
const jwt = require('jsonwebtoken');

async function testProfileWithAuth() {
  console.log('=== Testing Profile API with Auth ===\n');

  try {
    // Create a mock JWT token (this won't work but will test the endpoint)
    const mockPayload = { userId: 'test-user-id', email: 'test@example.com' };
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(mockPayload, JWT_SECRET);

    console.log('1. Testing profile GET with mock token...');
    const response = await fetch('http://localhost:3001/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.status === 404) {
      console.log('✅ API is working - user not found (expected with mock token)');
    } else if (response.status === 200) {
      console.log('✅ API is working and returned profile data!');
    } else {
      console.log('❓ Unexpected response status');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testProfileWithAuth();
