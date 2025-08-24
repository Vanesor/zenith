import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user.id;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';
    const altText = formData.get('altText') as string || '';
    const description = formData.get('description') as string || '';
    const context = formData.get('context') as string || 'general';
    const referenceId = formData.get('referenceId') as string || undefined;
    const isPublic = formData.get('isPublic') !== 'false'; // Default to true
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      }, { status: 400 });
    }

    // Parse path to determine bucket and folder
    let bucket = 'general';
    let folder = '';
    
    if (path) {
      const pathParts = path.split('/');
      if (pathParts.length > 0) {
        bucket = pathParts[0];
        if (pathParts.length > 1) {
          folder = pathParts.slice(1).join('/');
        }
      }
    }

    // Upload file using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      userId,
      bucket,
      folder,
      {
        altText,
        description,
        isPublic,
        uploadContext: context,
        referenceId,
        metadata: {
          originalPath: path
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 });
    }
    
    console.log(`✅ File uploaded by user ${userId}: ${mediaFile.file_url}`);
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: mediaFile.file_url,
      fileId: mediaFile.id,
      thumbnailUrl: mediaFile.thumbnail_url || mediaFile.file_url,
      metadata: mediaFile.metadata
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload file' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file ID provided' 
      }, { status: 400 });
    }

    // Get the file to check permissions
    const mediaFile = await MediaService.getMediaFileById(fileId);
    
    if (!mediaFile) {
      return NextResponse.json({ 
        success: false, 
        error: 'File not found' 
      }, { status: 404 });
    }
    
    // Check if user is allowed to delete this file
    if (mediaFile.uploaded_by !== userId && authResult.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to delete this file' 
      }, { status: 403 });
    }

    // Delete the file
    const deleted = await MediaService.deleteMediaFile(fileId);
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete file'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}
