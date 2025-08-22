import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldChatMessages, cleanupOrphanedAttachments } from '@/lib/chatCleanup';
import { getAuthUser } from '@/lib/auth-unified';

export async function POST(request: NextRequest) {
  try {
    // Authenticate - only allow admin users to run cleanup
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    // Get months parameter from request body or use default
    const { months = 2 } = await request.json();
    
    // Run the cleanup operations
    const messagesResult = await cleanupOldChatMessages(months);
    const attachmentsResult = await cleanupOrphanedAttachments();
    
    return NextResponse.json({
      success: true,
      messagesResult,
      attachmentsResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cleanup route:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
