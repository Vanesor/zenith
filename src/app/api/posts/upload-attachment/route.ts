import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB for post attachments

// File validation function
function validatePostFile(file: File): { valid: boolean; error?: string } {
  // Allow images and common document formats for posts
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: images, PDF, Word documents, and text files'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication failed' 
      }, { status: 401 });
    }

    const userId = authResult.user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;
    const attachmentType = formData.get('type') as string || 'general';
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file
    const validation = validatePostFile(file);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // If postId is provided, verify post ownership
    if (postId) {
      const postQuery = `
        SELECT author_id, status 
        FROM posts 
        WHERE id = $1
      `;
      const postResult = await db.query(postQuery, [postId]);

      if (postResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Post not found' 
        }, { status: 404 });
      }

      const post = postResult.rows[0];
      
      if (post.author_id !== userId) {
        return NextResponse.json({ 
          error: 'You can only upload attachments to your own posts' 
        }, { status: 403 });
      }
    }

    // Upload file using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      userId,
      'posts',
      postId ? `post-${postId}` : 'drafts',
      {
        uploadContext: 'post_attachments',
        referenceId: postId || undefined,
        isPublic: true, // Posts are typically public
        metadata: {
          postId: postId || null,
          attachmentType,
          uploadedBy: userId
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Create post attachment record if postId exists
    let attachmentId = null;
    if (postId) {
      const attachmentQuery = `
        INSERT INTO post_attachments (
          post_id, media_file_id, file_name, file_type, file_size, attachment_type, uploaded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const attachmentResult = await db.query(attachmentQuery, [
        postId,
        mediaFile.id,
        mediaFile.original_filename,
        mediaFile.mime_type,
        mediaFile.file_size,
        attachmentType,
        new Date().toISOString()
      ]);

      attachmentId = attachmentResult.rows[0]?.id;
    }

    console.log(`✅ Post attachment uploaded by user ${userId}${postId ? ` for post ${postId}` : ' (draft)'}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl: mediaFile.file_url,
      fileId: mediaFile.id,
      attachmentId,
      fileName: mediaFile.original_filename,
      fileType: mediaFile.mime_type,
      fileSize: mediaFile.file_size,
      thumbnailUrl: mediaFile.thumbnail_url || mediaFile.file_url
    });

  } catch (error) {
    console.error("Error uploading post attachment:", error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload post attachment'
    }, { status: 500 });
  }
}
