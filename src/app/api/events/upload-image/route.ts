import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

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

    // Upload event image using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      authResult.user.id,
      'events',
      `${eventId}/${imageType || 'images'}`,
      {
        uploadContext: 'event_images',
        referenceId: eventId,
        isPublic: true,
        altText: altText || '',
        description: description || '',
        metadata: {
          eventId,
          imageType: imageType || 'gallery',
          uploadedBy: authResult.user.id
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
         success: false,
        error: 'Failed to upload event image'
       }, { status: 500 });
    }

    // Update event record based on image type
    if (imageType === 'banner') {
      // Update banner_image_url in events table
      await db.query(
        `UPDATE events SET banner_image_url = $1, updated_at = NOW() WHERE id = $2`,
        [mediaFile.file_url, eventId]
      );
      console.log(`Setting banner image for event ${eventId}: ${mediaFile.file_url}`);
    } else {
      // Add to gallery_images array in events table
      await db.query(
        `UPDATE events 
         SET gallery_images = COALESCE(gallery_images, '[]'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify([mediaFile.file_url]), eventId]
      );
      console.log(`Adding gallery image for event ${eventId}: ${mediaFile.file_url}`);
    }

    console.log(`✅ Event image uploaded for event ${eventId} by user ${authResult.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Event image uploaded successfully',
      imageUrl: mediaFile.file_url,
      filePath: mediaFile.filename,
      imageType: imageType,
      fileId: mediaFile.id
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
