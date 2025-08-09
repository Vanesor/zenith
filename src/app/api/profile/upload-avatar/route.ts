import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import Database from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // Create uploads directory for profile images
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.log('Directory creation error (might already exist):', error);
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename based on user ID and timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `avatar_${decoded.userId}_${timestamp}.${fileExtension}`;
    
    // Save file
    const filePath = join(uploadsDir, uniqueFilename);
    await writeFile(filePath, buffer);
    
    // Generate public URL
    const publicUrl = `/uploads/avatars/${uniqueFilename}`;
    
    // Update user's avatar in the database
    try {
      await Database.query(
        'UPDATE users SET avatar = $1 WHERE id = $2',
        [publicUrl, decoded.userId]
      );
      console.log(`✅ Database updated with avatar URL for user ${decoded.userId}`);
    } catch (dbError) {
      console.error('❌ Database update failed:', dbError);
      // Don't fail the request, but log the error
    }
    
    console.log(`✅ Profile image uploaded for user ${decoded.userId}: ${publicUrl}`);
    
    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      avatarUrl: publicUrl,
      filename: uniqueFilename
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
