import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const clubId = params.clubId;
    
    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }
    
    // Get club info first
    const clubQuery = `
      SELECT logo_url, banner_image_url, club_images 
      FROM clubs 
      WHERE id = $1
    `;
    
    const clubResult = await db.query(clubQuery, [clubId]);
    
    if (clubResult.rows.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    
    const club = clubResult.rows[0];
    
    // Also get media files associated with this club
    const mediaFiles = await MediaService.getMediaFilesByReference(clubId, 'clubs');
    
    return NextResponse.json({ 
      logo: club.logo_url || '/images/default-club-logo.png',
      banner: club.banner_image_url,
      gallery: club.club_images || [],
      mediaFiles: mediaFiles.map(file => ({
        id: file.id,
        url: file.file_url,
        thumbnail: file.thumbnail_url,
        alt: file.alt_text,
        type: file.mime_type,
        context: file.upload_context,
        createdAt: file.created_at
      })),
      success: true
    });
    
  } catch (error) {
    console.error('Error getting club images:', error);
    return NextResponse.json({ 
      error: 'Failed to get club images',
      success: false 
    }, { status: 500 });
  }
}
