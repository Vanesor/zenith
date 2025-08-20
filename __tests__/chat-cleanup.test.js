import { PrismaClient } from '../src/generated/prisma';
import { cleanupOldChatMessages, cleanupOrphanedAttachments } from '../src/lib/chatCleanup';
import { subMonths, addDays, format } from 'date-fns';

// Setup test database connection
const prisma = new PrismaClient({
  // Use test database if available
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

describe('Chat Cleanup Functions', () => {
  let testRoomId;
  let testMessageIds = [];
  
  // Create test data before tests
  beforeAll(async () => {
    // Create a test room
    const room = await prisma.chat_rooms.create({
      data: {
        name: 'Test Cleanup Room',
        is_private: false
      }
    });
    testRoomId = room.id;
    
    // Create test messages with different dates
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3); // Should be deleted
    const twoMonthsAgo = subMonths(now, 2);   // Edge case
    const oneMonthAgo = subMonths(now, 1);    // Should be kept
    const oneWeekAgo = addDays(now, -7);      // Should be kept
    
    // Create old message (should be deleted)
    const oldMessage = await prisma.chat_messages.create({
      data: {
        message: 'This is an old test message',
        room_id: testRoomId,
        user_id: 'test-user-1',
        created_at: threeMonthsAgo
      }
    });
    testMessageIds.push(oldMessage.id);
    
    // Create borderline message
    const borderlineMessage = await prisma.chat_messages.create({
      data: {
        message: 'This is a borderline test message',
        room_id: testRoomId,
        user_id: 'test-user-1',
        created_at: twoMonthsAgo
      }
    });
    testMessageIds.push(borderlineMessage.id);
    
    // Create newer messages (should be kept)
    const newMessage1 = await prisma.chat_messages.create({
      data: {
        message: 'This is a newer test message',
        room_id: testRoomId,
        user_id: 'test-user-2',
        created_at: oneMonthAgo
      }
    });
    testMessageIds.push(newMessage1.id);
    
    const newMessage2 = await prisma.chat_messages.create({
      data: {
        message: 'This is a recent test message',
        room_id: testRoomId,
        user_id: 'test-user-2',
        created_at: oneWeekAgo
      }
    });
    testMessageIds.push(newMessage2.id);
    
    // Create orphaned attachment
    await prisma.chat_attachments.create({
      data: {
        file_path: 'test/path/orphaned.jpg',
        file_type: 'image/jpeg',
        file_size: 1024,
        message_id: null // Orphaned attachment
      }
    });
    
    // Create valid attachment
    await prisma.chat_attachments.create({
      data: {
        file_path: 'test/path/valid.jpg',
        file_type: 'image/jpeg',
        file_size: 1024,
        message_id: newMessage2.id // Connected to a message
      }
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    // Delete test messages
    await prisma.chat_messages.deleteMany({
      where: {
        id: {
          in: testMessageIds
        }
      }
    });
    
    // Delete test room
    await prisma.chat_rooms.delete({
      where: {
        id: testRoomId
      }
    });
    
    // Delete all test attachments
    await prisma.chat_attachments.deleteMany({
      where: {
        file_path: {
          startsWith: 'test/path/'
        }
      }
    });
    
    await prisma.$disconnect();
  });
  
  it('should clean up messages older than 2 months', async () => {
    const result = await cleanupOldChatMessages(2);
    
    expect(result.success).toBe(true);
    expect(result.messagesDeleted).toBeGreaterThan(0);
    
    // Verify old message was deleted
    const oldMessage = await prisma.chat_messages.findFirst({
      where: {
        id: testMessageIds[0]
      }
    });
    
    expect(oldMessage.message).toBe('[This message was automatically deleted due to age]');
    
    // Verify newer messages are intact
    const newerMessage = await prisma.chat_messages.findFirst({
      where: {
        id: testMessageIds[2]
      }
    });
    
    expect(newerMessage.message).toBe('This is a newer test message');
  });
  
  it('should clean up orphaned attachments', async () => {
    const result = await cleanupOrphanedAttachments();
    
    expect(result.success).toBe(true);
    expect(result.attachmentsDeleted).toBeGreaterThan(0);
    
    // Verify orphaned attachment was deleted
    const orphanedCount = await prisma.chat_attachments.count({
      where: {
        file_path: 'test/path/orphaned.jpg'
      }
    });
    
    expect(orphanedCount).toBe(0);
    
    // Verify valid attachment still exists
    const validCount = await prisma.chat_attachments.count({
      where: {
        file_path: 'test/path/valid.jpg'
      }
    });
    
    expect(validCount).toBe(1);
  });
});
