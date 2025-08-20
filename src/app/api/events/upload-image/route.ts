import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { LocalStorageService } from "@/lib/storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for event images

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
    const eventId = formData.get('eventId') as string;
    const imageType = formData.get('imageType') as string; // 'banner' or 'gallery'
    const altText = formData.get('altText') as string;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json({
         success: false,
         error: 'No image file provided'
       }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({
         success: false,
         error: 'Event ID is required'
       }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file, 'event', MAX_FILE_SIZE);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload event image
    const uploadResult = await LocalStorageService.uploadFile(
      file,
      'events',
      `${eventId}/${imageType || 'images'}`
    );

    if (!uploadResult) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload event image'
       }, { status: 500 });
    }

    // Update event record based on image type
    if (imageType === 'banner') {
      // Update banner_image_url in events table
      // This would require importing your Database module
      console.log(`Setting banner image for event ${eventId}: ${uploadResult.url}`);
    } else {
      // Add to gallery_images array in events table
      console.log(`Adding gallery image for event ${eventId}: ${uploadResult.url}`);
    }

    console.log(`✅ Event image uploaded for event ${eventId} by user ${decoded.userId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Event image uploaded successfully',
      imageUrl: uploadResult.url,
      filePath: uploadResult.path,
      imageType: imageType
    });

  } catch (error) {
    console.error('Event image upload error:', error);
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload event image'
       },
      { status: 500 }
    );
  }
}
