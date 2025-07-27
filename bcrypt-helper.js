#!/usr/bin/env node

// Bcrypt password helper utility
const bcrypt = require('bcryptjs');

const hash = process.argv[2];
const testPassword = process.argv[3];

if (!hash) {
  console.log('Usage: node bcrypt-helper.js <hash> [test-password]');
  console.log('');
  console.log('Examples:');
  console.log('  node bcrypt-helper.js "$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa"');
  console.log('  node bcrypt-helper.js "$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa" "password123"');
  console.log('');
  console.log('Common passwords to try:');
  console.log('  - password123 (default in the database setup)');
  console.log('  - admin');
  console.log('  - 123456');
  console.log('  - password');
  process.exit(1);
}

console.log('🔍 Bcrypt Hash Analysis');
console.log('========================');
console.log(`Hash: ${hash}`);
console.log('');

// Parse bcrypt hash components
const parts = hash.split('$');
if (parts.length === 4 && parts[0] === '' && parts[1] === '2b') {
  console.log('✅ Valid bcrypt hash format');
  console.log(`Algorithm: bcrypt (2b)`);
  console.log(`Cost/Rounds: ${parts[2]}`);
  console.log(`Salt + Hash: ${parts[3]}`);
} else {
  console.log('❌ Invalid bcrypt hash format');
  process.exit(1);
}

console.log('');

if (testPassword) {
  console.log('🧪 Testing password...');
  const isMatch = bcrypt.compareSync(testPassword, hash);
  console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
} else {
  console.log('💡 To test a password, provide it as the second argument');
  console.log('');
  console.log('Testing common passwords...');
  
  const commonPasswords = [
    'password123',
    'admin',
    '123456',
    'password',
    'zenith',
    'admin123',
    '1234',
    'test'
  ];
  
  for (const pwd of commonPasswords) {
    const isMatch = bcrypt.compareSync(pwd, hash);
    console.log(`  "${pwd}": ${isMatch ? '✅ MATCH!' : '❌'}`);
    if (isMatch) break;
  }
}

console.log('');
console.log('🔐 To generate a new hash:');
console.log('  const bcrypt = require("bcryptjs");');
console.log('  const hash = bcrypt.hashSync("your-password", 10);');
