const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  
  // Current dummy hash from your file
  const currentHash = '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa';
  
  console.log('=== PASSWORD HASH ANALYSIS ===');
  console.log('Password:', password);
  console.log('Current dummy hash:', currentHash);
  
  // Test if current hash works
  const isValidCurrent = await bcrypt.compare(password, currentHash);
  console.log('Current hash validates:', isValidCurrent);
  
  // Generate new hash with salt rounds 12 (to match signup)
  const newHash12 = await bcrypt.hash(password, 12);
  console.log('\nProposed hash (rounds=12):', newHash12);
  
  // Test new hash
  const isValidNew = await bcrypt.compare(password, newHash12);
  console.log('New hash validates:', isValidNew);
  
  // Generate hash with different salt rounds for comparison
  console.log('\n=== DIFFERENT SALT ROUND COMPARISON ===');
  
  const hash10 = await bcrypt.hash(password, 10);
  const hash12 = await bcrypt.hash(password, 12);
  const hash14 = await bcrypt.hash(password, 14);
  
  console.log('Salt rounds 10:', hash10);
  console.log('Salt rounds 12:', hash12);
  console.log('Salt rounds 14:', hash14);
  
  console.log('\n=== VALIDATION TESTS ===');
  console.log('Hash 10 validates:', await bcrypt.compare(password, hash10));
  console.log('Hash 12 validates:', await bcrypt.compare(password, hash12));
  console.log('Hash 14 validates:', await bcrypt.compare(password, hash14));
  
  console.log('\n=== RECOMMENDATION ===');
  console.log('Use salt rounds 12 for better security');
  console.log('Update dummy_users.sql with this hash:', hash12);
}

generateHash().catch(console.error);
