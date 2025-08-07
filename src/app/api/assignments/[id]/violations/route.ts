import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

// Helper function to verify JWT token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, userId: null };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { authenticated: true, userId: decoded.userId };
  } catch (error) {
    return { authenticated: false, userId: null };
  }
}

// POST /api/assignments/[id]/violations - Record assignment violations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    
    // Get JWT claims
    const { userId, authenticated } = await verifyAuth(request);
    if (!authenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const submissionCheck = await Database.query(
      `SELECT id FROM assignment_submissions 
       WHERE assignment_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [assignmentId, userId]
    );

    let submissionId;
    
    if (submissionCheck.rows.length === 0) {
      // No submission found, create a temporary one
      const submissionResult = await Database.query(
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
    await Database.query(
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
    await Database.query(
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
