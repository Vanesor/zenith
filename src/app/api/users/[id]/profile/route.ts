import { NextRequest, NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const requestingUserId = authResult.user!.id;
    
    // Check if the requesting user is a manager/admin or the user themself
    const userQuery = `
      SELECT 
        role, 
        club_id 
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await queryRawSQL(userQuery, requestingUserId);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Requesting user not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    // Roles that can view any profile in their club
    const managerRoles = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
      "admin"
    ];
    
    const isManager = managerRoles.includes(userRole);
    const isSelf = requestingUserId === userId;
    
    if (!isSelf && !isManager) {
      return NextResponse.json({ error: "Not authorized to view this profile" }, { status: 403 });
    }
    
    // Get user profile data
    const profileQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.role,
        u.bio,
        u.created_at as joined_at,
        u.updated_at,
        u.github as github_url,
        u.linkedin as linkedin_url,
        u.twitter as twitter_url,
        u.website as website_url,
        c.name as club_name,
        c.id as club_id
      FROM users u
      LEFT JOIN clubs c ON u.club_id = c.id
      WHERE u.id = $1
    `;
    
    const profileResult = await queryRawSQL(profileQuery, userId);
    
    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get user's submissions stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded_submissions,
        ROUND(AVG(CASE WHEN grade IS NOT NULL THEN grade ELSE NULL END)) as average_grade
      FROM assignment_submissions
      WHERE user_id = $1
    `;
    
    const statsResult = await queryRawSQL(statsQuery, userId);
    const stats = statsResult.rows[0] || {
      total_submissions: 0,
      graded_submissions: 0,
      average_grade: null
    };
    
    // Format the response
    const profile = {
      ...profileResult.rows[0],
      stats: {
        totalSubmissions: parseInt(stats.total_submissions) || 0,
        gradedSubmissions: parseInt(stats.graded_submissions) || 0,
        averageGrade: stats.average_grade ? parseInt(stats.average_grade) : null
      }
    };
    
    return NextResponse.json(profile);
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
