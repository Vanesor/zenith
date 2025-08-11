import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
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

    // Get user data from database with fallback for missing columns
    let result;
    try {
      console.log('🔍 Querying database for user with extended fields:', decoded.userId);
      result = await Database.query(
        `SELECT id, email, name, username, role, club_id, avatar, bio, created_at, 
                phone, location, website, github, linkedin, twitter
         FROM users WHERE id = $1`,
        [decoded.userId]
      );
      console.log('✅ Extended query successful, rows found:', result.rows.length);
    } catch (error) {
      // If extended columns don't exist, fall back to basic query
      console.log('❌ Extended query failed, falling back to basic query:', error instanceof Error ? error.message : String(error));
      try {
        result = await Database.query(
          `SELECT id, email, name, username, role, club_id, avatar, bio, created_at
           FROM users WHERE id = $1`,
          [decoded.userId]
        );
        console.log('✅ Basic query successful, rows found:', result.rows.length);
      } catch (basicError) {
        console.log('❌ Even basic query failed:', basicError instanceof Error ? basicError.message : String(basicError));
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 500 }
        );
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    
    // Split name into firstName and lastName for frontend compatibility
    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Get club information if user has a club
    let clubInfo = null;
    if (user.club_id) {
      try {
        const clubResult = await Database.query(
          "SELECT id, name, description FROM clubs WHERE id = $1",
          [user.club_id]
        );
        if (clubResult.rows.length > 0) {
          clubInfo = clubResult.rows[0];
        }
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
    
    // Update user profile in database
    let result;
    try {
      console.log('🔍 Attempting extended profile update for user:', decoded.userId);
      result = await Database.query(
        `UPDATE users 
         SET name = $1, username = $2, bio = $3, avatar = $4, 
             phone = $5, location = $6, website = $7, 
             github = $8, linkedin = $9, twitter = $10
         WHERE id = $11
         RETURNING id, email, name, username, role, club_id, avatar, bio, created_at,
                   phone, location, website, github, linkedin, twitter`,
        [
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
        ]
      );
      console.log('✅ Extended update successful');
    } catch (error) {
      // If extended columns don't exist, fall back to basic update
      console.log('❌ Extended update failed, falling back to basic update:', error instanceof Error ? error.message : String(error));
      try {
        result = await Database.query(
          `UPDATE users 
           SET name = $1, username = $2, bio = $3, avatar = $4
           WHERE id = $5
           RETURNING id, email, name, username, role, club_id, avatar, bio, created_at`,
          [
            fullName || updateData.name,
            updateData.username || null,
            updateData.bio || null,
            updateData.avatar || null,
            decoded.userId
          ]
        );
        console.log('✅ Basic update successful');
      } catch (basicError) {
        console.log('❌ Even basic update failed:', basicError instanceof Error ? basicError.message : String(basicError));
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 400 }
      );
    }

    const user = result.rows[0];
    
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
