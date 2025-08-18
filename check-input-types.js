const { Prisma } = require('@prisma/client');

// Check all available Prisma types
console.log('All available Prisma types (first 50):');
const allTypes = Object.keys(Prisma).sort().slice(0, 50);
console.log(allTypes);

console.log('\nInput types containing "User":');
const userTypes = Object.keys(Prisma).filter(key => key.includes('User'));
console.log(userTypes);

console.log('\nInput types containing "Create":');
const createTypes = Object.keys(Prisma).filter(key => key.includes('Create')).slice(0, 10);
console.log(createTypes);

console.log('\nInput types containing "Update":');
const updateTypes = Object.keys(Prisma).filter(key => key.includes('Update')).slice(0, 10);
console.log(updateTypes);
