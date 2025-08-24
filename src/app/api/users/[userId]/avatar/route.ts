import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Try to get avatar from MediaService first
    const avatarUrl = await MediaService.getUserAvatarUrl(userId);
    
    if (avatarUrl) {
      return NextResponse.json({ 
        avatarUrl,
        success: true
      });
    }
    
    // Fallback to default avatar if no custom avatar is found
    return NextResponse.json({ 
      avatarUrl: '/images/default-avatar.png',
      success: true
    });
    
  } catch (error) {
    console.error('Error getting user avatar:', error);
    return NextResponse.json({ 
      error: 'Failed to get user avatar',
      success: false 
    }, { status: 500 });
  }
}
