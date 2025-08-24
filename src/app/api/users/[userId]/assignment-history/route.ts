import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check if the requester is the user or an admin
    const isOwnProfile = authResult.user.id === userId;
    const isAdmin = authResult.user.role === "admin";
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this user's assignment history" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Query to get assignment history with club details
    const query = `
      SELECT 
        s.id as submission_id,
        s.status,
        s.submitted_at,
        s.graded_at,
        s.total_score,
        s.feedback,
        a.id as assignment_id,
        a.title as assignment_title,
        a.description as assignment_description,
        a.due_date,
        a.total_points,
        c.id as club_id,
        c.name as club_name,
        c.logo_url as club_logo
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN clubs c ON a.club_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.submitted_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM assignment_submissions
      WHERE user_id = $1
    `;
    
    const countResult = await db.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);
    
    // Calculate statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'graded' OR status = 'completed' THEN 1 END) as graded_submissions,
        AVG(CASE WHEN total_score IS NOT NULL THEN total_score END) as average_score,
        COUNT(CASE WHEN s.total_score >= a.passing_score THEN 1 END) as passed_assignments
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.user_id = $1
    `;
    
    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];
    
    return NextResponse.json({
      assignments: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        totalSubmissions: parseInt(stats.total_submissions) || 0,
        gradedSubmissions: parseInt(stats.graded_submissions) || 0,
        averageScore: parseFloat(stats.average_score) || 0,
        passedAssignments: parseInt(stats.passed_assignments) || 0
      }
    });
    
  } catch (error) {
    console.error("Error fetching assignment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment history" },
      { status: 500 }
    );
  }
}
