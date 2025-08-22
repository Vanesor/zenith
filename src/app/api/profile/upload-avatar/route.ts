import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { LocalStorageService } from '@/lib/storage';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    let token = request.headers.get("authorization");
    if (token?.startsWith("Bearer ")) {
      token = token.substring(7);
    }

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file using SupabaseStorageService
    // Validate file size
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

    // Upload new avatar using Local Storage
    const uploadResult = await LocalStorageService.uploadFile(
      file,
      'profiles',
      'avatars'
    );

    if (!uploadResult) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload file'
       }, { status: 500 });
    }
    
    console.log(`✅ Profile image uploaded for user ${decoded.userId}: ${uploadResult.url}`);
    
    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      avatarUrl: uploadResult.url,
      fileId: uploadResult.path,
      thumbnailUrl: uploadResult.url
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload profile image' 
      },
      { status: 500 }
    );
  }
}
