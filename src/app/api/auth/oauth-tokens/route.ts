import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { generateToken, generateRefreshToken } from "@/lib/auth-unified";
import { SessionManager } from "@/lib/SessionManager";
import db from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate JWT tokens for OAuth users
 * This allows OAuth users to use the same token-based API access as regular users
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated via NextAuth (OAuth)
    const nextAuthSession = await getServerSession(authOptions);
    
    if (!nextAuthSession || !nextAuthSession.user || !nextAuthSession.user.id) {
      return NextResponse.json(
        { error: "Not authenticated via OAuth" },
        { status: 401 }
      );
    }

    const user = nextAuthSession.user;

    // Generate a session ID for JWT token
    const sessionId = uuidv4();

    // Create session in database
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      await db.query(
        'INSERT INTO sessions (id, user_id, token, expires_at, created_at, last_active_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [sessionId, user.id, sessionId, expiresAt, now, now]
      );
    } catch (sessionError) {
      console.error("Failed to create session:", sessionError);
      // Continue anyway - session creation is optional for JWT
    }

    // Generate JWT tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email!,
      role: user.role || 'student',
      sessionId: sessionId
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email!,
      sessionId: sessionId
    });

    // Return tokens
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        club_id: user.club_id,
        avatar: user.image,
        profile_image_url: user.image,
        has_password: false
      },
      message: "JWT tokens generated for OAuth user"
    });

  } catch (error) {
    console.error("Error generating OAuth tokens:", error);
    return NextResponse.json(
      { error: "Failed to generate tokens" },
      { status: 500 }
    );
  }
}