// Script to clean up old chat messages from GitHub Actions
// This script authenticates with the database directly using DATABASE_URL environment variable

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { cleanupOldChatMessages, cleanupOrphanedAttachments } from '../src/lib/chatCleanup';

// Initialize Prisma client with DATABASE_URL from env
const prisma = new PrismaClient();

async function runGithubCleanup() {
  console.log('Starting chat cleanup via GitHub Actions...');
  
  try {
    const startTime = Date.now();
    
    // Run message cleanup (2 months retention period)
    console.log('Cleaning up old messages...');
    const messageResult = await cleanupOldChatMessages(2);
    
    // Run attachment cleanup
    console.log('Cleaning up orphaned attachments...');
    const attachmentResult = await cleanupOrphanedAttachments();
    
    // Calculate execution time
    const executionTime = (Date.now() - startTime) / 1000;
    
    // Prepare results
    const results = {
      timestamp: new Date().toISOString(),
      executionTimeSeconds: executionTime,
      messagesDeleted: messageResult.messagesDeleted,
      attachmentsDeleted: attachmentResult.attachmentsDeleted,
      success: messageResult.success && attachmentResult.success,
      messages: {
        messages: messageResult.message,
        attachments: attachmentResult.message
      }
    };
    
    // Write results to file for GitHub Actions to read
    fs.writeFileSync(path.join(process.cwd(), 'cleanup-results.json'), JSON.stringify(results, null, 2));
    
    console.log('Cleanup completed successfully:');
    console.log(`- Messages deleted: ${messageResult.messagesDeleted}`);
    console.log(`- Attachments deleted: ${attachmentResult.attachmentsDeleted}`);
    console.log(`- Execution time: ${executionTime.toFixed(2)} seconds`);
    
    return process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    
    // Write error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    fs.writeFileSync(path.join(process.cwd(), 'cleanup-results.json'), JSON.stringify(errorReport, null, 2));
    
    return process.exit(1);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
  }
}

// Execute the function
runGithubCleanup();
