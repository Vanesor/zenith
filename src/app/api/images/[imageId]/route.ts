import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';


// GET /api/images/[imageId]?size=original|thumbnail|medium&token=accessToken
export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size') as 'original' | 'thumbnail' | 'medium' || 'original';
    const accessToken = searchParams.get('token');
    
    // Get media file from database
    const mediaFile = await MediaService.getMediaFileById(params.imageId);
    
    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Check if file is public or verify access token
    if (!mediaFile.is_public) {
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Access token required for private image' },
          { status: 401 }
        );
      }
      
      // Verify token for private images
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.success) {
          return NextResponse.json(
            { error: 'Invalid access token' },
            { status: 403 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid access token' },
          { status: 403 }
        );
      }
    }
    
    // Get file path - MediaService stores relative paths
    let filePath = mediaFile.filename;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), 'public', filePath);
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Image file not found on disk' },
        { status: 404 }
      );
    }
    
    // Read file and return
    const fileBuffer = fs.readFileSync(filePath);
    
    // Return image with proper headers
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', mediaFile.mime_type);
    response.headers.set('Content-Length', fileBuffer.length.toString());
    response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    response.headers.set('ETag', `"${params.imageId}-${size}"`);
    
    // Set filename for download
    response.headers.set(
      'Content-Disposition', 
      `inline; filename="${mediaFile.original_filename}"`
    );
    
    return response;
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[imageId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get media file to check ownership
    const mediaFile = await MediaService.getMediaFileById(params.imageId);
    
    if (!mediaFile) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Check if user owns the file or has admin permissions
    if (mediaFile.uploaded_by !== authResult.user.id && authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Delete file from filesystem
    let filePath = mediaFile.filename;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), 'public', filePath);
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await MediaService.deleteMediaFile(params.imageId);

    return NextResponse.json({ 
      success: true,
      message: "Image deleted successfully" 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
