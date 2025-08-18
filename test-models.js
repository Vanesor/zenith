const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all available model methods
const methods = Object.getOwnPropertyNames(prisma).filter(prop => 
  typeof prisma[prop] === 'object' && 
  prisma[prop] !== null && 
  !prop.startsWith('$') && 
  !prop.startsWith('_')
);

console.log('Available models:', methods);

// Check some specific models
if (prisma.user) {
  console.log('user model exists');
} else if (prisma.users) {
  console.log('users model exists');
}

if (prisma.session) {
  console.log('session model exists');
} else if (prisma.sessions) {
  console.log('sessions model exists');
}

if (prisma.club) {
  console.log('club model exists');
} else if (prisma.clubs) {
  console.log('clubs model exists');
}

prisma.$disconnect();
