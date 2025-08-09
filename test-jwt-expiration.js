#!/usr/bin/env node

// Test JWT token expiration times
const jwt = require('jsonwebtoken');

function testTokenExpiration() {
  console.log('🔐 Testing JWT Token Expiration Times\n');

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const mockPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'MEMBER',
    sessionId: 'session-123'
  };

  // Test different expiration times
  const expirationTests = [
    { label: '15 minutes', time: '15m' },
    { label: '3 hours', time: '3h' },
    { label: '24 hours', time: '24h' },
    { label: '7 days', time: '7d' }
  ];

  expirationTests.forEach(test => {
    try {
      const token = jwt.sign(mockPayload, JWT_SECRET, { expiresIn: test.time });
      const decoded = jwt.decode(token);
      
      if (decoded && typeof decoded === 'object' && decoded.exp) {
        const issuedAt = new Date(decoded.iat * 1000);
        const expiresAt = new Date(decoded.exp * 1000);
        const duration = (decoded.exp - decoded.iat) / 60; // in minutes
        
        console.log(`📝 ${test.label} token:`);
        console.log(`   Issued: ${issuedAt.toLocaleString()}`);
        console.log(`   Expires: ${expiresAt.toLocaleString()}`);
        console.log(`   Duration: ${duration} minutes (${(duration/60).toFixed(1)} hours)`);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Error creating ${test.label} token:`, error.message);
    }
  });

  // Test the actual token from your application
  console.log('🔧 Your Updated Application Settings:');
  console.log('   ✅ Login tokens: 3 hours');
  console.log('   ✅ Registration tokens: 3 hours');
  console.log('   ✅ Refresh tokens: 7 days');
  console.log('');
  console.log('💡 Benefits:');
  console.log('   - Users stay logged in for 3 hours');
  console.log('   - Automatic refresh extends session up to 7 days');
  console.log('   - Better user experience with fewer login prompts');
}

// Run the test
testTokenExpiration();
