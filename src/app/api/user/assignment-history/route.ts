import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-consolidated';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get user's assignment history with detailed information using Prisma
    const assignmentAttempts = await prisma.assignmentAttempt.findMany({
      where: {
        user_id: userId,
        status: {
          in: ['completed', 'submitted', 'graded']
        },
        submitted_at: {
          not: null
        }
      },
      include: {
        assignment: {
          include: {
            club: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submitted_at: 'desc'
      }
    });

    // Get total attempts count for each assignment
    const assignmentIds = assignmentAttempts.map(attempt => attempt.assignment_id);
    const attemptsCount = await prisma.assignmentAttempt.groupBy({
      by: ['assignment_id'],
      where: {
        assignment_id: {
          in: assignmentIds
        },
        user_id: userId
      },
      _count: {
        id: true
      }
    });

    // Create a map for quick lookup
    const attemptsMap = attemptsCount.reduce((acc, item) => {
      acc[item.assignment_id] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const assignments = assignmentAttempts.map((attempt) => ({
      id: attempt.assignment.id,
      title: attempt.assignment.title,
      club: attempt.assignment.club?.name || 'General',
      score: attempt.score || 0,
      maxScore: attempt.max_score || 100,
      percentage: attempt.percentage || 0,
      status: attempt.status,
      submittedAt: attempt.submitted_at?.toISOString(),
      attempts: attemptsMap[attempt.assignment_id] || 1,
      timeSpent: attempt.time_spent || 0
    }));

    return NextResponse.json({
      success: true,
      assignments: assignments
    });

  } catch (error) {
    console.error('Error fetching assignment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment history' },
      { status: 500 }
    );
  }
}
