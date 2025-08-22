import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SessionManager } from "@/lib/SessionManager";
import { CacheManager, CacheKeys } from "@/lib/CacheManager";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        sessionId: string;
      };

      // Destroy the specific session
      await SessionManager.destroySession(decoded.sessionId);

      // Clear cached user data
      await CacheManager.delete(CacheKeys.user(decoded.userId));

      // Clear any other user-specific cache
      await CacheManager.clearPattern(`user:${decoded.userId}:*`);

      console.log(`User ${decoded.userId} logged out successfully`);

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

    } catch (_jwtError) {
      // Token is invalid, but still try to clear cookies
      const response = NextResponse.json({
        message: "Logout successful"
      });

      response.cookies.set('zenith-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
      });

      return response;
    }

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Logout from all devices
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
      };

      // Destroy all sessions for this user
      await SessionManager.destroyAllUserSessions(decoded.userId);

      // Clear all cached user data
      await CacheManager.clearPattern(`user:${decoded.userId}:*`);

      console.log(`User ${decoded.userId} logged out from all devices`);

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

    } catch (_jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("Logout all error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
