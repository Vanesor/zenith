import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

// Get user profile data
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Profile API GET request received');
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          error: authResult.error || "Authentication required",
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    console.log('✅ Token verified for user:', authResult.user?.id);

    // Get user data from database using SQL query
    let user;
    try {
      console.log('🔍 Querying database for user:', authResult.user?.id);
      const userResult = await db.query(`
        SELECT 
          id, email, name, username, role, club_id, avatar, bio, 
          created_at, phone, location, website, github, linkedin, twitter
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `, [authResult.user?.id]);
      
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
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
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
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      console.log('❌ Authentication failed for update:', authResult.error);
      return NextResponse.json(
        { 
          error: authResult.error || "Authentication required",
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    console.log('✅ Token verified for update, user:', authResult.user?.id);

    const updateData = await request.json();
    console.log('🔍 Update data received:', Object.keys(updateData));
    
    // Combine firstName and lastName back into name field for database
    const fullName = `${updateData.firstName || ""} ${updateData.lastName || ""}`.trim();
    
    // Update user profile in database using SQL query
    let user;
    try {
      console.log('🔍 Attempting profile update for user:', authResult.user?.id);
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
        authResult.user?.id
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
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
