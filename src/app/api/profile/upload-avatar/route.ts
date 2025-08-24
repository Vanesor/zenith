import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Upload new avatar using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      userId,
      'profiles',
      'avatars',
      {
        uploadContext: 'profiles',
        isPublic: true,
        metadata: {
          type: 'avatar',
          userId: userId
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 });
    }
    
    // Update user's profile_image_url in the users table
    await MediaService.updateUserAvatar(userId, mediaFile.file_url);
    
    console.log(`✅ Profile image uploaded for user ${userId}: ${mediaFile.file_url}`);
    
    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      avatarUrl: mediaFile.file_url,
      fileId: mediaFile.id,
      thumbnailUrl: mediaFile.thumbnail_url || mediaFile.file_url
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload profile image' 
      },
      { status: 500 }
    );
  }
}
