import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/database";
import crypto from 'crypto';

/**
 * Get the deterministic password for OAuth users
 * This allows OAuth users to know their auto-generated password for manual login
 * Only available to authenticated OAuth users
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to get your OAuth password" },
        { status: 401 }
      );
    }

    // Check if user is an OAuth user
    const userResult = await db.query(
      `SELECT oauth_provider, has_password FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (!user.oauth_provider) {
      return NextResponse.json(
        { error: "This feature is only available for OAuth users" },
        { status: 400 }
      );
    }

    if (user.has_password) {
      return NextResponse.json(
        { 
          message: "You have already set a custom password. Your OAuth password is no longer needed.",
          hasCustomPassword: true
        }
      );
    }

    // Generate the same deterministic password that was used during registration
    const oauthSalt = process.env.OAUTH_PASSWORD_SALT || 'default_oauth_salt_zenith_2025';
    const deterministic_password = crypto
      .createHash('sha256')
      .update(`${session.user.email}_${user.oauth_provider}_${oauthSalt}`)
      .digest('hex');

    return NextResponse.json({
      success: true,
      password: deterministic_password,
      provider: user.oauth_provider,
      message: "This is your auto-generated password for manual login. You can set a custom password in settings.",
      recommendation: "For security, consider setting a custom password using the 'Set Password' feature."
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An error occurred while retrieving your OAuth password" },
      { status: 500 }
    );
  }
}
