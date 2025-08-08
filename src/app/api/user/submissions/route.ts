import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import Database from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // 'submitted', 'graded', 'completed'

    // Base query to get user's assignment submissions
    let query = `
      SELECT 
        s.id,
        s.assignment_id as "assignmentId",
        a.title,
        a.description,
        a.max_points as "maxPoints",
        s.total_score as "score",
        s.completed_at as "submittedAt",
        s.time_spent as "timeSpent",
        s.status,
        s.violation_count as "violationCount",
        s.auto_submitted as "autoSubmitted",
        COALESCE(c.name, 'General') as "clubName",
        CASE 
          WHEN s.total_score IS NOT NULL AND a.max_points > 0 
          THEN ROUND((s.total_score::decimal / a.max_points::decimal) * 100, 2)
          ELSE 0
        END as "percentage",
        CASE 
          WHEN s.total_score IS NOT NULL AND a.passing_score > 0 
          THEN s.total_score >= a.passing_score
          ELSE false
        END as "isPassing",
        a.passing_score as "passingScore",
        COUNT(aq.id) as "totalQuestions"
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN clubs c ON a.club_id = c.id
      LEFT JOIN assignment_questions aq ON a.id = aq.assignment_id
      WHERE s.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    query += `
      GROUP BY s.id, a.id, c.name
      ORDER BY s.completed_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit.toString(), (offset).toString());

    const result = await Database.query(query, queryParams);

    // Also get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalSubmissions",
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as "gradedSubmissions",
        COALESCE(AVG(CASE WHEN s.total_score IS NOT NULL AND a.max_points > 0 
          THEN (s.total_score::decimal / a.max_points::decimal) * 100 END), 0) as "averageScore",
        COUNT(CASE WHEN s.total_score >= a.passing_score THEN 1 END) as "passedAssignments"
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.user_id = $1 AND s.status IN ('submitted', 'graded', 'completed')
    `;

    const statsResult = await Database.query(statsQuery, [userId]);
    const stats = statsResult.rows[0] || {
      totalSubmissions: 0,
      gradedSubmissions: 0,
      averageScore: 0,
      passedAssignments: 0
    };

    return NextResponse.json({
      submissions: result.rows,
      stats: {
        totalSubmissions: parseInt(stats.totalSubmissions),
        gradedSubmissions: parseInt(stats.gradedSubmissions),
        averageScore: parseFloat(stats.averageScore || 0).toFixed(1),
        passedAssignments: parseInt(stats.passedAssignments),
        passRate: stats.totalSubmissions > 0 
          ? ((parseInt(stats.passedAssignments) / parseInt(stats.totalSubmissions)) * 100).toFixed(1)
          : "0"
      },
      pagination: {
        limit,
        offset,
        hasMore: result.rows.length === limit
      }
    });

  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
