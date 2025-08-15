import { NextRequest, NextResponse } from 'next/server';
import FastAuth from '@/lib/FastAuth';

/**
 * HIGH-PERFORMANCE AUTH CHECK ENDPOINT
 * Uses optimized PrismaDatabase for fast session validation
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from token using optimized FastAuth
    const user = await FastAuth.getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    
    // Split name into firstName and lastName for frontend compatibility
    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        name: user.name,
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        username: user.username || user.name,
        club_id: user.club_id,
        avatar: user.avatar,
        bio: user.bio,
        verified: user.verified
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Authentication check failed'
    }, { status: 500 });
  }
}
