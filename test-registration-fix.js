// Test the registration fix
async function testRegistrationFix() {
  const testData = {
    email: `test.fix.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User Fix',
    club_id: 'ascend'
  };

  try {
    console.log('Testing registration fix with data:', testData);
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Registration fix works!');
    } else {
      console.log('❌ Registration fix failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistrationFix();
