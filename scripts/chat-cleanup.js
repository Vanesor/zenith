// Script to automatically clean up old chat messages
// This script can be run as a cron job using node scripts/chat-cleanup.js

import { PrismaClient } from '../src/generated/prisma';
import { cleanupOldChatMessages, cleanupOrphanedAttachments } from '../src/lib/chatCleanup';

async function main() {
  console.log('Starting chat cleanup process...');
  console.log('Current time:', new Date().toISOString());
  
  try {
    // Keep messages for 2 months (default)
    const messagesResult = await cleanupOldChatMessages();
    console.log('Messages cleanup result:', messagesResult);
    
    // Clean up any orphaned attachments
    const attachmentsResult = await cleanupOrphanedAttachments();
    console.log('Attachments cleanup result:', attachmentsResult);
    
    console.log('Chat cleanup process completed successfully.');
  } catch (error) {
    console.error('Error in chat cleanup process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error in chat cleanup script:', error);
    process.exit(1);
  });
