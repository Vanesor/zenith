import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import jwt from 'jsonwebtoken';


// POST /api/images/upload
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
    let authResult;
    try {
      authResult = await verifyAuth(request);
      if (!authResult.success || !authResult.user) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context = formData.get('context') as string || 'general';
    const referenceId = formData.get('referenceId') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const altText = formData.get('altText') as string;
    const description = formData.get('description') as string;
    const expiresIn = formData.get('expiresIn') ? parseInt(formData.get('expiresIn') as string) : undefined;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    const result = await MediaService.uploadFile(
      file,
      authResult.user.id,
      context || 'general',
      referenceId || '',
      {
        uploadContext: context,
        referenceId,
        isPublic,
        altText,
        description,
        metadata: expiresIn ? { expiresIn } : undefined
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 400 }
      );
    }

    // Generate URLs for different sizes
    const baseUrl = `${request.nextUrl.origin}/api/images/${result.id}`;
    const accessToken = isPublic ? '' : `&token=${token}`; // Use the actual auth token
    
    return NextResponse.json({
      success: true,
      imageId: result.id,
      fileUrl: result.file_url,
      urls: {
        original: `${baseUrl}?size=original${accessToken}`,
        thumbnail: `${baseUrl}?size=thumbnail${accessToken}`,
        medium: `${baseUrl}?size=medium${accessToken}`
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
