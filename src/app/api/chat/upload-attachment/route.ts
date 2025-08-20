import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { LocalStorageService } from "@/lib/storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for chat attachments

// File validation function
function validateFile(file: File, type: string, maxSize: number): { valid: boolean; error?: string } {
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
    const validation = validateFile(file, 'chat', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload chat attachment
    const uploadResult = await LocalStorageService.uploadFile(
      file,
      'chat',
      `rooms/${roomId}`
    );

    if (!uploadResult) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload chat attachment'
       }, { status: 500 });
    }

    console.log(`✅ Chat attachment uploaded for user ${decoded.userId} in room ${roomId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Chat attachment uploaded successfully',
      fileUrl: uploadResult.url,
      filePath: uploadResult.path
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
