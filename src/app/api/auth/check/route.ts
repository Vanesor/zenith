import { NextRequest, NextResponse } from 'next/server';
import FastAuth from '@/lib/FastAuth';
import { verifyAuth } from '@/lib/AuthMiddleware';

/**
 * HIGH-PERFORMANCE AUTH CHECK ENDPOINT
 * Uses consolidated database for fast session validation
 */
export async function GET(request: NextRequest) {
  try {
    // Debug what tokens we have
    console.log("Auth check - Auth header:", request.headers.get("authorization") ? "Present" : "Missing");
    console.log("Auth check - Cookie token:", request.cookies.get("zenith-token") ? "Present" : "Missing");
    
    // First try direct auth verification which handles both token and cookie auth
    const authResult = await verifyAuth(request);
    
    // If direct auth verification succeeds, use that info
    if (authResult.success && authResult.user) {
      // Log whether this is from a trusted device
      if (authResult.trustedDevice) {
        console.log("Auth check - User is on a trusted device");
      }
      
      // If token was refreshed, return the new token
      if (authResult.newToken) {
        // Get name from email if needed
        const nameFromEmail = authResult.user.email.split('@')[0] || '';
        const formattedName = nameFromEmail.replace(/[.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const response = NextResponse.json({ 
          authenticated: true, 
          user: {
            id: authResult.user.id,
            name: formattedName,
            firstName: formattedName.split(" ")[0] || "",
            lastName: formattedName.split(" ").slice(1).join(" ") || "",
            email: authResult.user.email,
            role: authResult.user.role,
            username: authResult.user.email,
            club_id: authResult.user.club_id,
            avatar: "",
            bio: "",
            verified: true
          },
          tokenRefreshed: true
        });
        
        // Set the new token as a cookie
        response.cookies.set('zenith-token', authResult.newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60, // 24 hours
        });
        
        return response;
      }
      
      // Return user info from auth result
      // Get name from email if needed
      const nameFromEmail = authResult.user.email.split('@')[0] || '';
      const formattedName = nameFromEmail.replace(/[.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: authResult.user.id,
          name: formattedName,
          firstName: formattedName.split(" ")[0] || "",
          lastName: formattedName.split(" ").slice(1).join(" ") || "",
          email: authResult.user.email,
          role: authResult.user.role,
          username: authResult.user.email,
          club_id: authResult.user.club_id,
          avatar: "",
          bio: "",
          verified: true
        }
      });
    }
    
    // Fallback to the original FastAuth approach
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
