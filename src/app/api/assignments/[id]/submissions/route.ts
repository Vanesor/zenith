import { NextRequest, NextResponse } from "next/server";
import { prisma, Database } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || null;
    const sort = searchParams.get("sort") || "recent"; // recent, score, name
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const requestingUserId = authResult.user!.id;
    
    // Get requesting user role and club
    const userQuery = `
      SELECT role, club_id 
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await Database.query(userQuery, [requestingUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    // Get assignment details including club ID
    const assignmentQuery = `
      SELECT id, title, description, club_id, assignment_type, max_points, passing_score
      FROM assignments
      WHERE id = $1
    `;
    
    const assignmentResult = await Database.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if user is authorized to view submissions for this assignment
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
    
    const isManager = managerRoles.includes(userRole) && userClubId === assignment.club_id;
    
    if (!isManager) {
      return NextResponse.json({ error: "Not authorized to view submissions for this assignment" }, { status: 403 });
    }
    
    // Build query to get submissions
    let submissionsQuery = `
      SELECT 
        s.id,
        s.submitted_at,
        s.completed_at,
        s.status,
        s.grade,
        s.time_spent,
        s.auto_submitted,
        s.total_score,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM assignment_submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.assignment_id = $1
    `;
    
    const queryParams = [assignmentId];
    let paramIndex = 2;
    
    if (status) {
      submissionsQuery += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // Add sorting
    if (sort === "score") {
      submissionsQuery += ` ORDER BY s.total_score DESC`;
    } else if (sort === "name") {
      submissionsQuery += ` ORDER BY u.name ASC`;
    } else {
      // Default to recent
      submissionsQuery += ` ORDER BY s.submitted_at DESC`;
    }
    
    submissionsQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit.toString(), offset.toString());
    
    const submissionsResult = await Database.query(submissionsQuery, queryParams);
    
    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM assignment_submissions s
      WHERE s.assignment_id = $1
      ${status ? " AND s.status = $2" : ""}
    `;
    
    const countParams = status ? [assignmentId, status] : [assignmentId];
    const countResult = await Database.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Format each submission
    const submissions = submissionsResult.rows.map(sub => {
      return {
        id: sub.id,
        submittedAt: sub.submitted_at,
        completedAt: sub.completed_at,
        status: sub.status,
        grade: sub.grade,
        score: sub.total_score,
        timeSpent: sub.time_spent,
        autoSubmitted: sub.auto_submitted,
        user: {
          id: sub.user_id,
          name: sub.user_name,
          email: sub.user_email,
          avatar: sub.user_avatar
        }
      };
    });
    
    // Get aggregate statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        AVG(total_score) as avg_score,
        MIN(total_score) as min_score,
        MAX(total_score) as max_score,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE status = 'graded') as graded_count
      FROM assignment_submissions
      WHERE assignment_id = $1
    `;
    
    const statsResult = await Database.query(statsQuery, [assignmentId]);
    const stats = statsResult.rows[0];
    
    // Return results
    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.assignment_type,
        maxPoints: assignment.max_points,
        passingScore: assignment.passing_score
      },
      submissions,
      statistics: {
        totalSubmissions: parseInt(stats.total_submissions),
        averageScore: parseFloat(stats.avg_score?.toFixed(2)) || 0,
        minScore: parseInt(stats.min_score) || 0,
        maxScore: parseInt(stats.max_score) || 0,
        uniqueUsers: parseInt(stats.unique_users),
        gradedCount: parseInt(stats.graded_count),
        pendingCount: parseInt(stats.total_submissions) - parseInt(stats.graded_count)
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add endpoint for grading submissions (especially for subjective assignments)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const requestingUserId = authResult.user!.id;
    
    // Verify user is a manager
    const userQuery = `
      SELECT role, club_id 
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await Database.query(userQuery, [requestingUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
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
    
    if (!isManager) {
      return NextResponse.json({ error: "Not authorized to grade submissions" }, { status: 403 });
    }
    
    // Get assignment to check club
    const assignmentQuery = `
      SELECT club_id FROM assignments WHERE id = $1
    `;
    
    const assignmentResult = await Database.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    if (assignmentResult.rows[0].club_id !== userClubId && userRole !== 'admin') {
      return NextResponse.json({ error: "Not authorized to grade submissions for this club" }, { status: 403 });
    }
    
    // Get the data from the request
    const data = await request.json();
    const { submissionId, grade, feedback } = data;
    
    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }
    
    // Update the submission
    await Database.query(
      `UPDATE assignment_submissions 
       SET status = 'graded', grade = $1, feedback = $2, completed_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND assignment_id = $4`,
      [grade, feedback, submissionId, assignmentId]
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Submission graded successfully" 
    });
    
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
