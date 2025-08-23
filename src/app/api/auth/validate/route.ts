import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      // Special handling for expired tokens
      if (authResult.expired) {
        return NextResponse.json(
          { 
            error: "Token expired", 
            expired: true,
            expiredAt: authResult.expiredAt,
            requiresLogin: true 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: 401 }
      );
    }

    // Return user data for authenticated user
    return NextResponse.json({
      valid: true,
      user: authResult.user
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Token validation failed" },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for convenience
  return GET(request);
}
