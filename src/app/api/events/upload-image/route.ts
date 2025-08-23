import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { LocalStorageService } from "@/lib/storage";
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
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
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

    console.log(`✅ Event image uploaded for event ${eventId} by user ${authResult.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Event image uploaded successfully',
      imageUrl: uploadResult.url,
      filePath: uploadResult.path,
      imageType: imageType
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
         success: false,
        error: 'Failed to upload event image'
       },
      { status: 500 }
    );
  }
}
