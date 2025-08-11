import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SupabaseStorageService } from '@/lib/supabaseStorage';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for chat attachments

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
    const validation = SupabaseStorageService.validateFile(file, 'chat', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload chat attachment
    const uploadResult = await SupabaseStorageService.uploadChatAttachment(
      file,
      file.name,
      decoded.userId,
      roomId
    );

    if (!uploadResult.success) {
      return NextResponse.json({
         success: false,
        error: uploadResult.error || 'Failed to upload chat attachment'
       }, { status: 500 });
    }

    console.log(`✅ Chat attachment uploaded for user ${decoded.userId} in room ${roomId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Chat attachment uploaded successfully',
      fileUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      thumbnailUrl: uploadResult.thumbnailUrl
    });

  } catch (error) {
    console.error('Chat attachment upload error:', error);
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload chat attachment'
       },
      { status: 500 }
    );
  }
}
