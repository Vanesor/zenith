import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database-service';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Get user profile data
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Profile API GET request received');
    
    // Get token from header or cookie
    let token = request.headers.get("authorization");
    if (token?.startsWith("Bearer ")) {
      token = token.substring(7);
    } else {
      // Try to get from cookie
      const cookieToken = request.cookies.get("token")?.value;
      if (cookieToken) {
        token = cookieToken;
      }
    }

    console.log('🔍 Token found:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No authentication token provided');
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ Token verification failed:', error instanceof Error ? error.message : String(error));
      console.log('🔍 Token first 20 chars:', token.substring(0, 20));
      console.log('🔍 JWT_SECRET defined:', JWT_SECRET ? 'Yes' : 'No');
      return NextResponse.json(
        { error: "Invalid or expired token. Please log in again." },
        { status: 401 }
      );
    }

    // Get user data from database using Prisma client methods
    let user;
    try {
      console.log('🔍 Querying database for user:', decoded.userId);
      user = await db.users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          club_id: true,
          avatar: true,
          bio: true,
          created_at: true,
          phone: true,
          location: true,
          website: true,
          github: true,
          linkedin: true,
          twitter: true
        }
      });
      console.log('✅ Prisma query successful, user found:', user ? 'Yes' : 'No');
    } catch (error) {
      console.log('❌ Prisma query failed:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Split name into firstName and lastName for frontend compatibility
    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Get club information if user has a club
    let clubInfo = null;
    if (user.club_id) {
      try {
        clubInfo = await db.clubs.findUnique({
          where: { id: user.club_id },
          select: {
            id: true,
            name: true,
            description: true
          }
        });
      } catch (clubError) {
        console.log('Warning: Could not fetch club info:', clubError);
      }
    }

    const profileData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName,
      lastName,
      username: user.username || "",
      role: user.role,
      club_id: user.club_id,
      club: clubInfo,
      avatar: user.avatar || "",
      bio: user.bio || "",
      joinedDate: user.created_at,
      // User profile fields from database (with fallbacks)
      phone: user.phone || "",
      location: user.location || "",
      website: user.website || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      twitter: user.twitter || "",
      socialLinks: {},
      preferences: {}
    };

    console.log('✅ Profile data prepared for user:', user.email);
    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Profile API PUT request received');
    
    // Get token
    let token = request.headers.get("authorization");
    if (token?.startsWith("Bearer ")) {
      token = token.substring(7);
    } else {
      const cookieToken = request.cookies.get("token")?.value;
      if (cookieToken) {
        token = cookieToken;
      }
    }

    console.log('🔍 Token found for update:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No authentication token provided for update');
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      console.log('✅ Token verified for update, user:', decoded.userId);
    } catch (error) {
      console.log('❌ Token verification failed for update:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: "Invalid or expired token. Please log in again." },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    console.log('🔍 Update data received:', Object.keys(updateData));
    
    // Combine firstName and lastName back into name field for database
    const fullName = `${updateData.firstName || ""} ${updateData.lastName || ""}`.trim();
    
    // Update user profile in database using Prisma client methods
    let user;
    try {
      console.log('🔍 Attempting profile update for user:', decoded.userId);
      user = await db.users.update({
        where: { id: decoded.userId },
        data: {
          name: fullName || updateData.name,
          username: updateData.username || null,
          bio: updateData.bio || null,
          avatar: updateData.avatar || null,
          phone: updateData.phone || null,
          location: updateData.location || null,
          website: updateData.website || null,
          github: updateData.github || null,
          linkedin: updateData.linkedin || null,
          twitter: updateData.twitter || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          club_id: true,
          avatar: true,
          bio: true,
          created_at: true,
          phone: true,
          location: true,
          website: true,
          github: true,
          linkedin: true,
          twitter: true
        }
      });
      console.log('✅ Profile update successful');
    } catch (error) {
      console.log('❌ Profile update failed:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 400 }
      );
    }
    
    // Return updated profile data
    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const profileData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName,
      lastName,
      username: user.username || "",
      role: user.role,
      club_id: user.club_id,
      avatar: user.avatar || "",
      bio: user.bio || "",
      joinedDate: user.created_at,
      phone: user.phone || "",
      location: user.location || "",
      website: user.website || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      twitter: user.twitter || ""
    };

    console.log('✅ Profile update completed for user:', user.email);
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: profileData
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
