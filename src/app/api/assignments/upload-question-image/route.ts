import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for question images

// File validation function
function validateFile(file: File, type: string, maxSize: number): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
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
    const validation = validateFile(file, 'question', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload question image using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      authResult.user.id,
      'assignments',
      `questions/${questionId}`,
      {
        uploadContext: 'assignment_questions',
        referenceId: questionId,
        isPublic: false, // Question images are typically private
        metadata: {
          questionId,
          uploadedBy: authResult.user.id
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload question image'
       }, { status: 500 });
    }

    console.log(`✅ Question image uploaded for question ${questionId} by user ${authResult.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Question image uploaded successfully',
      imageUrl: mediaFile.file_url,
      filePath: mediaFile.filename,
      fileId: mediaFile.id
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload question image'
       },
      { status: 500 }
    );
  }
}
