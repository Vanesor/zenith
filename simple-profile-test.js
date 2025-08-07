// Simple test for profile API
async function simpleTest() {
  try {
    console.log('Testing profile API...');
    const response = await fetch('http://localhost:3001/api/profile', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleTest();
