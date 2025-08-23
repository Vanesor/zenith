import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth, withAuth } from "@/lib/auth-unified";

// Define interface for attempt row
interface AttemptRow {
  id: string;
  attempt_number: number;
  start_time: string;
  end_time: string | null;
  score: number | null;
  status: string;
  answers: string | object;
  violations: string | object;
  submitted_at: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Get user details
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's attempts for this assignment
    const attempts = await db.assignment_attempts.findMany({
      where: { 
        assignment_id: assignmentId, 
        user_id: user.id 
      },
      orderBy: { attempt_number: 'desc' },
      select: {
        id: true,
        attempt_number: true,
        start_time: true,
        end_time: true,
        score: true,
        status: true,
        answers: true,
        violations: true,
        submitted_at: true
      }
    });

    return NextResponse.json({ attempts });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const { attemptId, answers, violation } = await request.json();
    
    // Get user authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authResult.user.id;

    // Update attempt with new answers or violations
    if (violation) {
      // Get current attempt
            const attempt = await db.query(`
        SELECT * FROM assignment_attempts 
        WHERE assignment_id = $1 AND user_id = $2
      `, [assignmentId, userId]);
      
      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      // Safe JSON parsing with fallback
      const parseJsonSafely = (json: string, fallback: any[]) => {
        try {
          return JSON.parse(json || '[]');
        } catch {
          return fallback;
        }
      };

      if (attempt.rows.length === 0) {
        return NextResponse.json(
          { error: "Assignment attempt not found" },
          { status: 404 }
        );
      }

      const attemptData = attempt.rows[0];
      const currentViolations = parseJsonSafely(attemptData.violations, []);
      const updatedViolations = [...currentViolations, {
        type: violation.type,
        message: violation.message,
        timestamp: new Date().toISOString()
      }];

      await db.query(`
        UPDATE assignment_attempts 
        SET violations = $1, violation_count = $2
        WHERE id = $3 AND user_id = $4
      `, [
        JSON.stringify(updatedViolations),
        updatedViolations.length,
        attemptId,
        userId
      ]);

      return NextResponse.json({ success: true, violations: updatedViolations });
    } else if (answers) {
      // Save progress
      await db.query(`
        UPDATE assignment_attempts 
        SET answers = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
      `, [
        JSON.stringify(answers),
        attemptId,
        userId
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
