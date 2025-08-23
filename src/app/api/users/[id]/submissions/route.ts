import { NextRequest, NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || null;
    
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
    
    // Get the club ID of the target user
    const targetUserQuery = `SELECT club_id FROM users WHERE id = $1`;
    const targetUserResult = await queryRawSQL(targetUserQuery, userId);
    
    if (targetUserResult.rows.length === 0) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }
    
    const targetUserClubId = targetUserResult.rows[0].club_id;
    
    // Roles that can view submissions in their club
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
    
    const isManager = managerRoles.includes(userRole) && userClubId === targetUserClubId;
    const isSelf = requestingUserId === userId;
    
    if (!isSelf && !isManager) {
      return NextResponse.json({ error: "Not authorized to view these submissions" }, { status: 403 });
    }
    
    // Build the submissions query
    let submissionsQuery = `
      SELECT 
        s.id,
        s.submitted_at,
        s.completed_at as updated_at,
        s.status,
        s.grade,
        s.feedback,
        a.title as assignment_title,
        a.id as assignment_id,
        a.due_date,
        a.max_points as total_points,
        a.assignment_type
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;
    
    if (status) {
      submissionsQuery += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    submissionsQuery += ` ORDER BY s.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit.toString(), offset.toString());
    
    const submissionsResult = await queryRawSQL(submissionsQuery, ...queryParams);
    
    // Count total for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM assignment_submissions s
      WHERE s.user_id = $1
    `;
    
    const countParams = [userId];
    
    if (status) {
      countQuery += ` AND s.status = $2`;
      countParams.push(status);
    }
    
    const countResult = await queryRawSQL(countQuery, ...countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Format each submission
    const submissions = submissionsResult.rows.map((sub: any) => {
      // Check if this is a subjective assignment
      const isSubjective = ['essay', 'writing'].includes(sub.assignment_type?.toLowerCase());
      
      return {
        id: sub.id,
        submittedAt: sub.submitted_at,
        updatedAt: sub.updated_at,
        status: sub.status,
        grade: sub.grade,
        feedback: sub.feedback,
        assignment: {
          id: sub.assignment_id,
          title: sub.assignment_title,
          dueDate: sub.due_date,
          totalPoints: sub.total_points,
          assignmentType: sub.assignment_type,
          isSubjective: isSubjective
        }
      };
    });
    
    // Return the results with pagination info
    return NextResponse.json({
      submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
