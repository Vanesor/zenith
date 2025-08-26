/**
 * Auth Check API Route - Verify authentication status
 * Returns user information and handles token refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, refreshTokens } from '@/lib/auth-unified';
import { SessionManager } from '@/lib/SessionManager';
import AuditLogger from '@/lib/audit-logger';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: NextRequest) {
  try {
    // Extract IP and User Agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // First check for NextAuth session (OAuth users)
    const nextAuthSession = await getServerSession(authOptions);
    
    if (nextAuthSession && nextAuthSession.user) {
      // OAuth user is authenticated via NextAuth
      await AuditLogger.logAuth(
        'login',
        nextAuthSession.user.id || 'unknown',
        { 
          method: 'nextauth',
          provider: 'oauth',
          endpoint: '/api/auth/check'
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        authenticated: true,
        user: {
          id: nextAuthSession.user.id,
          email: nextAuthSession.user.email,
          name: nextAuthSession.user.name,
          role: nextAuthSession.user.role || 'student',
          club_id: nextAuthSession.user.club_id,
          avatar: nextAuthSession.user.image, // NextAuth uses 'image' instead of 'avatar'
          profile_image_url: nextAuthSession.user.image,
          has_password: false // OAuth users can set passwords later
        },
        session: {
          provider: 'nextauth',
          authenticated_via: 'oauth'
        }
      });
    }

    // Fall back to JWT authentication (regular login users)
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'Authentication failed' 
        },
        { status: 401 }
      );
    }

    // Validate session if sessionId is present
    if (authResult.sessionId) {
      const session = await SessionManager.validateSession(authResult.sessionId);
      if (!session) {
        await AuditLogger.logAuth(
          'login',
          authResult.user.id,
          { 
            reason: 'Invalid session',
            sessionId: authResult.sessionId,
            endpoint: '/api/auth/check'
          },
          ipAddress,
          userAgent
        );

        return NextResponse.json(
          { 
            authenticated: false, 
            error: 'Session expired' 
          },
          { status: 401 }
        );
      }

      // Update session metadata
      await SessionManager.updateSessionMetadata(authResult.sessionId, {
        ip: ipAddress,
        userAgent: userAgent
      });
    }

    // Check if token needs refresh (if expires within 1 hour)
    let newTokens = null;
    if (authResult.tokenExpiresIn && authResult.tokenExpiresIn < 60 * 60) {
      try {
        const refreshResult = await refreshTokens(authResult.refreshToken || '');
        if (refreshResult.success) {
          newTokens = {
            token: refreshResult.token,
            refreshToken: refreshResult.refreshToken
          };
        }
      } catch (error) {
        console.warn('Token refresh failed during auth check:', error);
        // Continue with existing token if refresh fails
      }
    }

    // Prepare user data for response
    const userData = {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      role: authResult.user.role,
      club_id: authResult.user.club_id,
      avatar: authResult.user.avatar,
      profile_image_url: authResult.user.profile_image_url,
      email_verified: authResult.user.email_verified || false,
      totp_enabled: authResult.user.totp_enabled || false,
      has_password: authResult.user.has_password || true
    };

    // Log successful auth check
    await AuditLogger.logAuth(
      'login',
      authResult.user.id,
      { 
        endpoint: '/api/auth/check',
        tokenRefreshed: !!newTokens
      },
      ipAddress,
      userAgent
    );

    const response = NextResponse.json({
      authenticated: true,
      user: userData,
      session: authResult.sessionId ? {
        id: authResult.sessionId,
        expiresAt: authResult.tokenExpiresAt
      } : null,
      ...(newTokens && { tokens: newTokens })
    });

    // Set new tokens in cookies if refreshed
    if (newTokens && newTokens.token) {
      response.cookies.set('zenith-token', newTokens.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 1 day
        path: '/'
      });

      if (newTokens.refreshToken) {
        response.cookies.set('zenith-refresh-token', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/'
        });
      }
    }

    return response;

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");

    // Extract IP and User Agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log system error
    await AuditLogger.logSystemAction(
      'auth_check_error',
      'auth',
      undefined,
      undefined,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/auth/check'
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify authentication first
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'extend_session':
        if (authResult.sessionId) {
          const extended = await SessionManager.extendSession(
            authResult.sessionId,
            24 * 60 * 60 * 1000 // 24 hours
          );

          await AuditLogger.logAuth(
            'login',
            authResult.user.id,
            { 
              action: 'extend_session',
              sessionId: authResult.sessionId
            },
            ipAddress,
            userAgent
          );

          return NextResponse.json({
            success: extended,
            message: extended ? 'Session extended' : 'Failed to extend session'
          });
        }
        break;

      case 'refresh_token':
        const refreshToken = request.cookies.get('zenith-refresh-token')?.value || body.refreshToken;
        
        if (!refreshToken) {
          return NextResponse.json(
            { error: 'Refresh token required' },
            { status: 400 }
          );
        }

        const refreshResult = await refreshTokens(refreshToken);

        await AuditLogger.logAuth(
          'login',
          authResult.user.id,
          { 
            action: 'refresh_token'
          },
          ipAddress,
          userAgent
        );

        if (refreshResult.success && refreshResult.token) {
          const response = NextResponse.json({
            success: true,
            tokens: {
              token: refreshResult.token,
              refreshToken: refreshResult.refreshToken
            }
          });

          // Update cookies
          response.cookies.set('zenith-token', refreshResult.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/'
          });

          if (refreshResult.refreshToken) {
            response.cookies.set('zenith-refresh-token', refreshResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60,
              path: '/'
            });
          }

          return response;
        } else {
          return NextResponse.json(
            { error: 'Token refresh failed' },
            { status: 401 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Action not handled' },
      { status: 400 }
    );

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");

    // Extract IP and User Agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await AuditLogger.logSystemAction(
      'auth_check_post_error',
      'auth',
      undefined,
      undefined,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/auth/check'
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
