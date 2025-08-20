import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Get token from the URL query parameters
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/verify-email?error=missing-token", request.url));
    }

    // Find user with this token
    const userResult = await db.query(
      `SELECT id, email, email_verification_token_expires_at 
       FROM users 
       WHERE email_verification_token = $1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.redirect(new URL("/verify-email?error=invalid-token", request.url));
    }

    const user = userResult.rows[0];
    
    // Check if token is expired
    const now = new Date();
    const expiry = new Date(user.email_verification_token_expires_at);
    
    if (now > expiry) {
      return NextResponse.redirect(new URL("/verify-email?error=expired-token", request.url));
    }

    // Mark email as verified
    await db.query(
      `UPDATE users 
       SET 
        email_verified = true,
        email_verification_token = NULL,
        email_verification_token_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Redirect to success page
    return NextResponse.redirect(new URL("/verify-email?success=true", request.url));
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.redirect(new URL("/verify-email?error=server-error", request.url));
  }
}
