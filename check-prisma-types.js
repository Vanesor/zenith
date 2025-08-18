const { PrismaClient, Prisma } = require('@prisma/client');

// Check what types are available in Prisma
console.log('Available Prisma types:');
console.log(Object.keys(Prisma).filter(key => 
  key.includes('CreateInput') || 
  key.includes('UpdateInput') || 
  key.includes('FindInput')
).sort());

console.log('\nModel delegate methods:');
const prisma = new PrismaClient();
console.log('Prisma client methods:', Object.getOwnPropertyNames(prisma).filter(name => !name.startsWith('_') && !name.startsWith('$')));

prisma.$disconnect();
