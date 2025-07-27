const bcrypt = require('bcryptjs');

const password = 'password123';

// Generate proper hash with 12 salt rounds (matching your signup process)
const validHash = bcrypt.hashSync(password, 12);

console.log('=== SECURE PASSWORD HASH FOR DUMMY DATA ===');
console.log('Password:', password);
console.log('Secure Hash (12 rounds):', validHash);

// Verify it works
const validates = bcrypt.compareSync(password, validHash);
console.log('Hash validates correctly:', validates);

console.log('\n=== COPY THIS HASH TO YOUR SQL FILE ===');
console.log(validHash);
