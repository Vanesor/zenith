const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCountFields() {
  try {
    // Check assignment count fields
    const assignment = await prisma.assignments.findFirst({
      include: {
        _count: {
          select: {
            // Let's see what's available
          }
        }
      }
    });
    
    console.log('Assignment count fields available:');
    console.log(Object.keys(assignment?._count || {}));
    
    // Check post author relationship
    const post = await prisma.posts.findFirst({
      select: {
        id: true,
        // Try to see available relationships
      }
    });
    
    console.log('Checking Prisma client methods:');
    console.log('Assignment methods:', Object.getOwnPropertyNames(prisma.assignments));
    console.log('Post methods:', Object.getOwnPropertyNames(prisma.posts));
    
  } catch (error) {
    console.log('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCountFields().catch(console.error);
