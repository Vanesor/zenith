import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const assignmentId = (await params).id;
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Get request body
    const body = await request.json();
    const { violationType, details } = body;

    if (!violationType) {
      return NextResponse.json(
        { error: "Violation type is required" },
        { status: 400 }
      );
    }

    // Get the user's active submission for this assignment
    const submissionCheck = await db.query(
      `SELECT id FROM assignment_submissions 
       WHERE assignment_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [assignmentId, userId]
    );

    let submissionId;
    
    if (submissionCheck.rows.length === 0) {
      // No submission found, create a temporary one
      const submissionResult = await db.query(
        `INSERT INTO assignment_submissions (
          assignment_id, user_id, status, started_at
        )
        VALUES ($1, $2, 'in_progress', NOW())
        RETURNING id`,
        [assignmentId, userId]
      );
      
      submissionId = submissionResult.rows[0].id;
    } else {
      submissionId = submissionCheck.rows[0].id;
    }

    // Record the violation
    await db.query(
      `INSERT INTO assignment_violations (
        submission_id, violation_type, details
      )
      VALUES ($1, $2, $3)`,
      [
        submissionId,
        violationType,
        details ? JSON.stringify(details) : null
      ]
    );

    // Update violation count in the submission
    await db.query(
      `UPDATE assignment_submissions
       SET violation_count = violation_count + 1
       WHERE id = $1`,
      [submissionId]
    );

    return NextResponse.json({
      message: "Violation recorded",
      submissionId
    });
  } catch (error: any) {
    console.error("Error recording violation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
