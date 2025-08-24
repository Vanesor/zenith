import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, withAuth, authenticateUser } from "@/lib/auth-unified";
import { RateLimiter } from "@/lib/RateLimiter";
import { CacheManager, CacheKeys } from "@/lib/CacheManager";

const authLimiter = RateLimiter.createAuthLimiter();

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await authLimiter.middleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, password, rememberMe = false } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check rate limit for this specific email (prevent brute force on specific accounts)
    const emailKey = `login_attempts:${email}`;
    const attemptCount = await CacheManager.get<number>(emailKey) || 0;
    
    if (attemptCount >= 5) {
      return NextResponse.json(
        { error: "Too many failed login attempts for this account. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 🚀 OPTIMIZED AUTHENTICATION - Replaces 5+ database queries with 1 optimized operation
    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      // Increment failed attempts
      await CacheManager.set(emailKey, attemptCount + 1, 900); // 15 minutes
      
      if (authResult.requiresTwoFactor) {
        return NextResponse.json({
          requiresTwoFactor: true,
          userId: authResult.user?.id,
          email: authResult.user?.email,
          method: "totp", // Default method
          message: "Two-factor authentication required"
        });
      }

      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: 401 }
      );
    }

    // Clear failed login attempts on successful login
    await CacheManager.delete(emailKey);

    // Create response with optimized cookies
    const response = NextResponse.json({
      success: true,
      token: authResult.token, // Include token in response for localStorage
      refreshToken: authResult.refreshToken, // Include refresh token too
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
        name: authResult.user!.name,
        role: authResult.user!.role,
        club_id: authResult.user!.club_id,
        avatar: authResult.user!.avatar,
        profile_image_url: authResult.user!.profile_image_url,
      },
      message: "Login successful"
    });

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('zenith-token', authResult.token!, {
      ...cookieOptions,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 24 hours
    });

    if (authResult.refreshToken) {
      response.cookies.set('zenith-refresh-token', authResult.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    if (authResult.sessionId) {
      response.cookies.set('zenith-session', authResult.sessionId, {
        ...cookieOptions,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    }

    return response;

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
