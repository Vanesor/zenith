import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SupabaseStorageService } from '@/lib/supabaseStorage';

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
    const validation = SupabaseStorageService.validateFile(file, 'profile', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload new avatar using Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadUserAvatar(
      file,
      file.name,
      decoded.userId
    );

    if (!uploadResult.success) {
      return NextResponse.json({
         success: false,
        error: uploadResult.error || 'Failed to upload to Supabase Storage'
       }, { status: 500 });
    }
    
    console.log(`✅ Profile image uploaded to Supabase Storage for user ${decoded.userId}: ${uploadResult.fileUrl}`);
    
    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully to Supabase Storage',
      avatarUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      thumbnailUrl: uploadResult.thumbnailUrl
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
