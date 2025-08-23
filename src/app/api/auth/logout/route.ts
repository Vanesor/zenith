import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { SessionManager } from "@/lib/SessionManager";
import { CacheManager, CacheKeys } from "@/lib/CacheManager";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication to get user and session info
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      // Even if auth fails, still try to clear cookies for logout
      const response = NextResponse.json({
        message: "Logout successful"
      });

      response.cookies.set('zenith-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Delete immediately
      });

      return response;
    }

    // Destroy the specific session
    if (authResult.user.sessionId) {
      await SessionManager.destroySession(authResult.user.sessionId);
    }

    // Clear cached user data
    await CacheManager.delete(CacheKeys.user(authResult.user.id));

    // Clear any other user-specific cache
    await CacheManager.clearPattern(`user:${authResult.user.id}:*`);

    console.log(`User ${authResult.user.id} logged out successfully`);

    const response = NextResponse.json({
      message: "Logout successful"
    });

    // Clear the session cookie
    response.cookies.set('zenith-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Delete immediately
    });

    return response;

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Logout from all devices
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication to get user info
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "No valid token provided" },
        { status: 401 }
      );
    }

    // Destroy all sessions for this user
    await SessionManager.destroyAllUserSessions(authResult.user.id);

    // Clear all cached user data
    await CacheManager.clearPattern(`user:${authResult.user.id}:*`);

    console.log(`User ${authResult.user.id} logged out from all devices`);

    const response = NextResponse.json({
      message: "Logged out from all devices successfully"
    });

    response.cookies.set('zenith-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
