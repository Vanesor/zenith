import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
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

    // Get user data from database using SQL query
    let user;
    try {
      console.log('🔍 Querying database for user:', decoded.userId);
      const userResult = await db.query(`
        SELECT 
          id, email, name, username, role, club_id, avatar, bio, 
          created_at, phone, location, website, github, linkedin, twitter
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `, [decoded.userId]);
      
      user = userResult.rows[0];
      console.log('✅ SQL query successful, user found:', user ? 'Yes' : 'No');
    } catch (error) {
      console.log('❌ Database query failed:', error instanceof Error ? error.message : String(error));
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
        const clubResult = await db.query(`
          SELECT id, name, description 
          FROM clubs 
          WHERE id = $1 AND deleted_at IS NULL
        `, [user.club_id]);
        clubInfo = clubResult.rows[0] || null;
      } catch (clubError) {
        console.log('Warning: Could not fetch club info:', clubError);
      }
    }

    const profileData = {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      firstName,
      lastName,
      username: (user as any).username || "",
      role: (user as any).role,
      club_id: (user as any).club_id,
      club: clubInfo,
      avatar: (user as any).avatar || "",
      bio: (user as any).bio || "",
      joinedDate: (user as any).created_at,
      // User profile fields from database (with fallbacks)
      phone: (user as any).phone || "",
      location: (user as any).location || "",
      website: (user as any).website || "",
      github: (user as any).github || "",
      linkedin: (user as any).linkedin || "",
      twitter: (user as any).twitter || "",
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
    
    // Update user profile in database using SQL query
    let user;
    try {
      console.log('🔍 Attempting profile update for user:', decoded.userId);
      const updateResult = await db.query(`
        UPDATE users 
        SET 
          name = $1,
          username = $2,
          bio = $3,
          avatar = $4,
          phone = $5,
          location = $6,
          website = $7,
          github = $8,
          linkedin = $9,
          twitter = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND deleted_at IS NULL
        RETURNING 
          id, email, name, username, role, club_id, avatar, bio, 
          created_at, phone, location, website, github, linkedin, twitter
      `, [
        fullName || updateData.name,
        updateData.username || null,
        updateData.bio || null,
        updateData.avatar || null,
        updateData.phone || null,
        updateData.location || null,
        updateData.website || null,
        updateData.github || null,
        updateData.linkedin || null,
        updateData.twitter || null,
        decoded.userId
      ]);
      
      user = updateResult.rows[0];
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
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      firstName,
      lastName,
      username: (user as any).username || "",
      role: (user as any).role,
      club_id: (user as any).club_id,
      avatar: (user as any).avatar || "",
      bio: (user as any).bio || "",
      joinedDate: (user as any).created_at,
      phone: (user as any).phone || "",
      location: (user as any).location || "",
      website: (user as any).website || "",
      github: (user as any).github || "",
      linkedin: (user as any).linkedin || "",
      twitter: (user as any).twitter || ""
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
