import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
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

    // Check if user exists in database
    const existingUser = await Database.getUserByEmail(email);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password_hash
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get user's club information if they have one
    let userClub = null;
    if (existingUser.club_id) {
      userClub = await Database.getClubById(existingUser.club_id);
    }

    // Generate JWT token
    const token = generateToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    // Prepare user data (exclude password_hash)
    const userData = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
      club_id: existingUser.club_id,
      avatar: existingUser.avatar,
      bio: existingUser.bio,
    };

    return NextResponse.json({
      message: "Login successful",
      token,
      user: userData,
      club: userClub
        ? {
            id: userClub.id,
            name: userClub.name,
            type: userClub.type,
            color: userClub.color,
          }
        : null,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
