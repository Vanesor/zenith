import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Database from "@/lib/database";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to complete your profile" },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone, dateOfBirth, interests } = await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Name fields are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await Database.query(
      `SELECT id, email, name FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Update user profile
    await Database.query(
      `UPDATE users
       SET 
         name = $1,
         phone_number = $2,
         date_of_birth = $3,
         preferences = jsonb_set(preferences, '{interests}', $4::jsonb)
       WHERE id = $5`,
      [
        `${firstName} ${lastName}`,
        phone || null,
        dateOfBirth ? new Date(dateOfBirth) : null,
        JSON.stringify(interests),
        userId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error completing profile:", error);
    return NextResponse.json(
      { error: "An error occurred while updating your profile" },
      { status: 500 }
    );
  }
}
