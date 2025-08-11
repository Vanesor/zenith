import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SupabaseStorageService } from '@/lib/supabaseStorage';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for question images

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
    const file = formData.get('image') as File;
    const questionId = formData.get('questionId') as string;
    const altText = formData.get('altText') as string;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json({
         success: false,
         error: 'No image file provided'
       }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({
         success: false,
         error: 'Question ID is required'
       }, { status: 400 });
    }

    // Validate file
    const validation = SupabaseStorageService.validateFile(file, 'question', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload question image
    const uploadResult = await SupabaseStorageService.uploadQuestionImage(
      file,
      file.name,
      decoded.userId,
      questionId
    );

    if (!uploadResult.success) {
      return NextResponse.json({
         success: false,
        error: uploadResult.error || 'Failed to upload question image'
       }, { status: 500 });
    }

    console.log(`✅ Question image uploaded for question ${questionId} by user ${decoded.userId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Question image uploaded successfully',
      imageUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      thumbnailUrl: uploadResult.thumbnailUrl
    });

  } catch (error) {
    console.error('Question image upload error:', error);
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload question image'
       },
      { status: 500 }
    );
  }
}
