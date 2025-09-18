import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get user's club information from club_members table
    const clubInfoQuery = `
      SELECT 
        cm.club_id,
        cm.role,
        cm.joined_at,
        cm.is_current_term,
        c.name as club_name
      FROM club_members cm
      JOIN clubs c ON cm.club_id = c.id
      WHERE cm.user_id = $1 AND cm.is_current_term = true
      LIMIT 1
    `;
    
    const result = await db.query(clubInfoQuery, [authResult.user.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        club_id: null,
        role: null,
        club_name: null,
        message: "User is not a member of any club"
      });
    }
    
    const clubInfo = result.rows[0];
    
    return NextResponse.json({
      club_id: clubInfo.club_id,
      role: clubInfo.role,
      club_name: clubInfo.club_name,
      joined_at: clubInfo.joined_at,
      success: true
    });
    
  } catch (error) {
    console.error("Error getting user club info:", error);
    return NextResponse.json(
      { error: "Failed to get user club information" },
      { status: 500 }
    );
  }
}