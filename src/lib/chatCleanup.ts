import DatabaseClient from '@/lib/database';
import { subMonths } from 'date-fns';

const db = DatabaseClient;

/**
 * Deletes chat messages that are older than the specified months
 * @param months Number of months to keep messages for (default: 2)
 */
export async function cleanupOldChatMessages(months: number = 2) {
  try {
    const cutoffDate = subMonths(new Date(), months);
    
    // Find messages older than the cutoff date
    const oldMessages = await db.query(
      `SELECT id, created_at FROM chat_messages 
       WHERE created_at < $1 
       AND message != $2`,
      [cutoffDate, "[This message was automatically deleted due to age]"]
    );
    
    console.log(`Found ${oldMessages.rows.length} messages older than ${months} months to delete`);
    
    if (oldMessages.rows.length === 0) {
      return {
        success: true,
        messagesDeleted: 0,
        message: `No messages found older than ${months} months`
      };
    }
    
    // For large number of messages, delete in batches
    const batchSize = 1000;
    let totalDeleted = 0;
    
    // Process in batches to avoid timeout or memory issues
    for (let i = 0; i < oldMessages.rows.length; i += batchSize) {
      const batch = oldMessages.rows.slice(i, i + batchSize);
      const ids = batch.map((msg: any) => msg.id);
      
      // Mark messages as deleted by changing their content
      const deleted = await db.query(
        `UPDATE chat_messages 
         SET message = $1, attachments = $2, message_images = $3
         WHERE id = ANY($4)`,
        [
          "[This message was automatically deleted due to age]",
          "[]",
          "[]",
          ids
        ]
      );
      
      totalDeleted += deleted.rowCount || 0;
      console.log(`Deleted batch of ${deleted.rowCount || 0} messages`);
    }
    
    return {
      success: true,
      messagesDeleted: totalDeleted,
      message: `Successfully deleted ${totalDeleted} messages older than ${months} months`
    };
  } catch (error) {
    console.error("Error cleaning up old chat messages:", error);
    return {
      success: false,
      messagesDeleted: 0,
      message: `Failed to delete old messages: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Deletes attachments that are no longer referenced by any message
 */
export async function cleanupOrphanedAttachments() {
  try {
    // Find attachments that don't have an associated message
    const orphanedAttachments = await db.query(
      `SELECT id, file_path FROM chat_attachments WHERE message_id IS NULL`
    );
    
    console.log(`Found ${orphanedAttachments.rows.length} orphaned attachments to delete`);
    
    if (orphanedAttachments.rows.length === 0) {
      return {
        success: true,
        attachmentsDeleted: 0,
        message: 'No orphaned attachments found'
      };
    }
    
    // TODO: Delete the actual files from storage
    // This would require Supabase storage integration
    
    // Delete the attachment records
    const attachmentIds = orphanedAttachments.rows.map((att: any) => att.id);
    const deletedAttachments = await db.query(
      `DELETE FROM chat_attachments WHERE id = ANY($1)`,
      [attachmentIds]
    );
    
    return {
      success: true,
      attachmentsDeleted: deletedAttachments.rowCount || 0,
      message: `Successfully deleted ${deletedAttachments.rowCount || 0} orphaned attachments`
    };
  } catch (error) {
    console.error("Error cleaning up orphaned attachments:", error);
    return {
      success: false,
      attachmentsDeleted: 0,
      message: `Failed to delete orphaned attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
