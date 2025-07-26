import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
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
    const { email, password, name, club_id } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
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

    // Check if club_id is valid if provided
    if (club_id) {
      const clubResult = await Database.query(
        "SELECT id FROM clubs WHERE id = $1",
        [club_id]
      );
      if (clubResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid club selected" },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUserResult = await Database.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine user type based on email domain
    const isCollegeStudent = email.endsWith("@stvincentngp.edu.in");

    // Insert new user with single club membership
    const result = await Database.query(
      `INSERT INTO users (email, password_hash, name, role, club_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role, club_id`,
      [email, hashedPassword, name, "student", club_id || null]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const newUser = result.rows[0];

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return user data and token
    const userData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      club_id: newUser.club_id,
      isCollegeStudent,
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
      token,
      message: isCollegeStudent
        ? "College student account created successfully!"
        : "External user account created successfully!",
    });

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
