import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for chat attachments

// File validation function
function validateFile(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` };
  }

  // Check file type for chat attachments (more permissive)
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images, PDF, and document files are allowed.' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = formData.get('roomId') as string;
    
    if (!file) {
      return NextResponse.json({
         success: false,
         error: 'No file provided'
       }, { status: 400 });
    }

    if (!roomId) {
      return NextResponse.json({
         success: false,
         error: 'Room ID is required'
       }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file, MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Check if user is a member of the chat room
    const memberQuery = `
      SELECT id FROM chat_room_members 
      WHERE chat_room_id = $1 AND user_id = $2
    `;
    const memberResult = await db.query(memberQuery, [roomId, userId]);
    
    if (memberResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chat room'
      }, { status: 403 });
    }

    // Upload chat attachment using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      userId,
      'chat',
      `rooms/${roomId}`,
      {
        uploadContext: 'chat_attachments',
        referenceId: roomId,
        isPublic: true,
        metadata: {
          roomId,
          uploadedBy: userId
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload chat attachment'
       }, { status: 500 });
    }

    // Create an entry in chat_attachments table
    const attachmentQuery = `
      INSERT INTO chat_attachments (
        file_id, room_id, user_id, file_url, file_type, file_name, file_size, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const attachmentResult = await db.query(attachmentQuery, [
      mediaFile.id,
      roomId,
      userId,
      mediaFile.file_url,
      mediaFile.mime_type,
      mediaFile.original_filename,
      mediaFile.file_size,
      new Date().toISOString()
    ]);

    console.log(`✅ Chat attachment uploaded for user ${userId} in room ${roomId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Chat attachment uploaded successfully',
      fileUrl: mediaFile.file_url,
      fileId: mediaFile.id,
      thumbnailUrl: mediaFile.thumbnail_url || mediaFile.file_url,
      attachmentId: attachmentResult.rows[0]?.id,
      fileName: mediaFile.original_filename,
      fileType: mediaFile.mime_type,
      fileSize: mediaFile.file_size
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload chat attachment'
       },
      { status: 500 }
    );
  }
}
