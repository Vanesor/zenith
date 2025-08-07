import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 12; // Strong security setting

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Password validation function
function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: "Password must be less than 128 characters long" };
  }

  // Check for at least 3 of 4 character types
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const strengthScore = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  
  if (strengthScore < 3) {
    return { 
      isValid: false, 
      message: "Password must contain at least 3 of: lowercase, uppercase, numbers, special characters" 
    };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log('Registration request received:', { 
      ...requestBody, 
      password: '[HIDDEN]' 
    });

    const { email, password, name, club_id, phone, dateOfBirth, interests } = requestBody;

    // Validation
    if (!email || !password || !name) {
      console.log('Validation failed: Missing required fields', { email: !!email, password: !!password, name: !!name });
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Trim whitespace from required fields
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedName) {
      return NextResponse.json(
        { error: "Email and name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
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
      [trimmedEmail]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password with secure salt rounds
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Determine user type based on email domain
    const isCollegeStudent = trimmedEmail.endsWith("@stvincentngp.edu.in");

    console.log('Creating user:', { email: trimmedEmail, name: trimmedName, club_id, isCollegeStudent });

    // Insert new user with single club membership
    const result = await Database.query(
      `INSERT INTO users (email, password_hash, name, role, club_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role, club_id`,
      [trimmedEmail, hashedPassword, trimmedName, "student", club_id || null]
    );

    if (result.rows.length === 0) {
      console.log('Failed to create user: No rows returned');
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const newUser = result.rows[0];
    console.log('User created successfully:', { id: newUser.id, email: newUser.email, name: newUser.name });

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
