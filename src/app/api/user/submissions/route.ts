import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

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

    // Get user's assignment submissions with assignment details using Prisma
    const submissions = await db.assignment_submissions.findMany({
      where: {
        user_id: userId,
        status: {
          in: ['submitted', 'graded', 'completed']
        },
        ...(status ? { status } : {})
      },
      include: {
        assignments: {
          include: {
            clubs: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { completed_at: 'desc' },
      take: limit,
      skip: offset
    });

    // Get summary statistics using Prisma aggregations
    const totalSubmissions = await db.assignment_submissions.count({
      where: { 
        user_id: userId,
        status: {
          in: ['submitted', 'graded', 'completed']
        }
      }
    });

    const gradedSubmissions = await db.assignment_submissions.count({
      where: { 
        user_id: userId,
        status: 'graded'
      }
    });

    // Get submissions with scores for average calculation
    const scoredSubmissions = await db.assignment_submissions.findMany({
      where: {
        user_id: userId,
        status: {
          in: ['submitted', 'graded', 'completed']
        },
        total_score: {
          not: null
        }
      },
      include: {
        assignments: {
          select: {
            max_points: true,
            passing_score: true
          }
        }
      }
    });

    // Calculate average score and passed assignments
    let averageScore = 0;
    let passedAssignments = 0;

    if (scoredSubmissions.length > 0) {
      const scores = scoredSubmissions.map(sub => {
        if (!sub.assignments) return 0;
        
        const percentage = (sub.assignments.max_points && sub.assignments.max_points > 0) 
          ? (sub.total_score! / sub.assignments.max_points) * 100 
          : 0;
        
        if (sub.total_score! >= (sub.assignments.passing_score || 0)) {
          passedAssignments++;
        }
        
        return percentage;
      });

      averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    // Transform submissions to match expected format
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      assignment_id: submission.assignment_id,
      assignment_title: submission.assignments?.title || 'Unknown Assignment',
      club_name: submission.assignments?.clubs?.name || 'General',
      total_score: submission.total_score,
      max_points: submission.assignments?.max_points || 0,
      status: submission.status,
      submitted_at: submission.submitted_at?.toISOString(),
      completed_at: submission.completed_at?.toISOString(),
      time_spent: submission.time_spent,
      percentage: (submission.assignments?.max_points && submission.assignments.max_points > 0 && submission.total_score !== null)
        ? Math.round((submission.total_score / submission.assignments.max_points) * 100)
        : null
    }));

    return NextResponse.json({
      success: true,
      submissions: transformedSubmissions,
      pagination: {
        limit,
        offset,
        total: totalSubmissions
      },
      stats: {
        totalSubmissions,
        gradedSubmissions,
        averageScore: Math.round(averageScore * 100) / 100,
        passedAssignments
      }
    });

  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user submissions" },
      { status: 500 }
    );
  }
}
