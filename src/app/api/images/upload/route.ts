import { NextRequest, NextResponse } from 'next/server';
import { DatabaseImageService } from '@/lib/DatabaseImageService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

    const result = await DatabaseImageService.uploadImage(
      file,
      file.name,
      decoded.userId,
      {
        context,
        referenceId,
        isPublic,
        altText,
        description,
        expiresIn,
        generateThumbnail: true,
        generateMedium: true
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Generate URLs for different sizes
    const baseUrl = `${request.nextUrl.origin}/api/images/${result.imageId}`;
    const accessToken = isPublic ? '' : `?token=${result.imageId}`; // Simplified token for demo
    
    return NextResponse.json({
      success: true,
      imageId: result.imageId,
      urls: {
        original: `${baseUrl}?size=original${accessToken}`,
        thumbnail: `${baseUrl}?size=thumbnail${accessToken}`,
        medium: `${baseUrl}?size=medium${accessToken}`
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
