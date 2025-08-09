import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import Database from "@/lib/database";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to set a password" },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await Database.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password
    await Database.query(
      `UPDATE users 
       SET 
         password_hash = $1,
         has_password = true
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      { error: "An error occurred while setting your password" },
      { status: 500 }
    );
  }
}
