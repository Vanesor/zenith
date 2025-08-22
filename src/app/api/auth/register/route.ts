import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, withAuth, createUser } from "@/lib/auth-unified";
import { RateLimiter } from "@/lib/RateLimiter";

const registrationLimiter = RateLimiter.createAuthLimiter();

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

/**
 * HIGH-PERFORMANCE REGISTRATION ENDPOINT
 * Uses consolidated database with performance indexes
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting protection
    const rateLimitResponse = await registrationLimiter.middleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Parse and validate request body
    const { name, email, password } = await request.json();
    console.log('Registration request received:', { 
      name, 
      email, 
      password: '[HIDDEN]' 
    });

    // 3. Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // 4. Validate name
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "Name must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    // 5. Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // 6. Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    console.log('Validation passed, attempting registration...');

    // 7. Register user with optimized auth system
    const user = await createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
    });

    if (!user) {
      console.error('Registration failed: User creation failed');
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 400 }
      );
    }

    console.log('Registration successful for user:', user.email);

    // 8. Create response with secure cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: false,
      },
      message: "Registration successful! Please check your email for verification."
    });

    // 9. Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // Note: User needs to login after registration to get tokens
    
    return response;

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
