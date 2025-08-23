import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
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
      SELECT role, club_id, name as user_name
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await db.query(userQuery, [requestingUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    const userName = userResult.rows[0].user_name;
    
    // Get assignment details
    const assignmentQuery = `
      SELECT 
        a.id, a.title, a.description, a.club_id, a.assignment_type, 
        a.max_points, a.passing_score, a.created_at, a.due_date,
        c.name as club_name
      FROM assignments a
      LEFT JOIN clubs c ON a.club_id = c.id
      WHERE a.id = $1
    `;
    
    const assignmentResult = await db.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if user is authorized to view submissions for this assignment
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
    
    if (!isManager && userRole !== 'admin') {
      return NextResponse.json({ error: "Not authorized to view report for this assignment" }, { status: 403 });
    }
    
    // Get question count by type
    const questionTypesQuery = `
      SELECT question_type, COUNT(*) as count
      FROM assignment_questions
      WHERE assignment_id = $1
      GROUP BY question_type
    `;
    
    const questionTypesResult = await db.query(questionTypesQuery, [assignmentId]);
    
    // Get submission statistics
    const submissionStatsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        AVG(total_score) as avg_score,
        MIN(total_score) as min_score,
        MAX(total_score) as max_score,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE status = 'graded') as graded_count,
        COUNT(*) FILTER (WHERE auto_submitted = true) as auto_submitted_count,
        AVG(time_spent) as avg_time_spent
      FROM assignment_submissions
      WHERE assignment_id = $1
    `;
    
    const submissionStatsResult = await db.query(submissionStatsQuery, [assignmentId]);
    const stats = submissionStatsResult.rows[0];
    
    // Get score distribution
    const scoreDistributionQuery = `
      SELECT 
        CASE 
          WHEN total_score BETWEEN 0 AND 20 THEN '0-20%'
          WHEN total_score BETWEEN 21 AND 40 THEN '21-40%'
          WHEN total_score BETWEEN 41 AND 60 THEN '41-60%'
          WHEN total_score BETWEEN 61 AND 80 THEN '61-80%'
          WHEN total_score BETWEEN 81 AND 100 THEN '81-100%'
          ELSE 'Unknown'
        END as score_range,
        COUNT(*) as count
      FROM assignment_submissions
      WHERE assignment_id = $1 AND status = 'graded'
      GROUP BY score_range
      ORDER BY score_range
    `;
    
    const scoreDistributionResult = await db.query(scoreDistributionQuery, [assignmentId]);
    
    // Get performance by question
    const questionPerformanceQuery = `
      SELECT 
        q.id, q.title, q.question_type,
        COUNT(qr.id) as attempt_count,
        COUNT(*) FILTER (WHERE qr.is_correct = true) as correct_count,
        AVG(qr.score) as avg_score
      FROM assignment_questions q
      LEFT JOIN question_responses qr ON q.id = qr.question_id
      LEFT JOIN assignment_submissions s ON qr.submission_id = s.id AND s.assignment_id = q.assignment_id
      WHERE q.assignment_id = $1
      GROUP BY q.id, q.title, q.question_type
      ORDER BY q.question_order
    `;
    
    const questionPerformanceResult = await db.query(questionPerformanceQuery, [assignmentId]);
    
    // Format the report data
    const report = {
      reportGeneratedAt: new Date().toISOString(),
      generatedBy: {
        id: requestingUserId,
        name: userName,
        role: userRole
      },
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.assignment_type,
        maxPoints: assignment.max_points,
        passingScore: assignment.passing_score,
        createdAt: assignment.created_at,
        dueDate: assignment.due_date,
        club: {
          id: assignment.club_id,
          name: assignment.club_name
        }
      },
      questionComposition: questionTypesResult.rows.map((type: any) => ({
        type: type.question_type,
        count: parseInt(type.count)
      })),
      submissionStatistics: {
        totalSubmissions: parseInt(stats.total_submissions) || 0,
        averageScore: parseFloat(stats.avg_score?.toFixed(2)) || 0,
        minScore: parseInt(stats.min_score) || 0,
        maxScore: parseInt(stats.max_score) || 0,
        uniqueUsers: parseInt(stats.unique_users) || 0,
        gradedCount: parseInt(stats.graded_count) || 0,
        pendingCount: (parseInt(stats.total_submissions) || 0) - (parseInt(stats.graded_count) || 0),
        autoSubmittedCount: parseInt(stats.auto_submitted_count) || 0,
        averageTimeSpent: parseInt(stats.avg_time_spent) || 0, // in seconds
      },
      scoreDistribution: scoreDistributionResult.rows.map((range: any) => ({
        range: range.score_range,
        count: parseInt(range.count)
      })),
      questionPerformance: questionPerformanceResult.rows.map((q: any) => ({
        id: q.id,
        title: q.title,
        type: q.question_type,
        attemptCount: parseInt(q.attempt_count) || 0,
        correctCount: parseInt(q.correct_count) || 0,
        correctPercentage: q.attempt_count > 0 ? 
          parseFloat((parseInt(q.correct_count) / parseInt(q.attempt_count) * 100).toFixed(2)) : 0,
        averageScore: parseFloat(q.avg_score?.toFixed(2)) || 0
      }))
    };
    
    // Return report data
    return NextResponse.json(report);
    
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
