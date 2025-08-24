/**
 * Test endpoint to check user avatar data directly
 */

import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/auth-unified';

export async function GET() {
  try {
    // Test the specific user
    const userId = '550e8400-e29b-41d4-a716-446655440020';
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response exactly like the auth check endpoint
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id,
      avatar: user.avatar,
      profile_image_url: user.profile_image_url,
    };

    return NextResponse.json({
      authenticated: true,
      user: userData,
      debug: {
        avatar_is_null: user.avatar === null,
        avatar_is_undefined: user.avatar === undefined,
        profile_image_url_is_null: user.profile_image_url === null,
        profile_image_url_is_undefined: user.profile_image_url === undefined,
      }
    });

  } catch (error) {
    console.error('Test user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
