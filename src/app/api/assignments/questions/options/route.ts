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

// POST /api/assignments/questions/options
export async function POST(request: NextRequest) {
  try {
    // Get JWT claims
    const { userId, authenticated } = await verifyAuth(request);
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { questionId, optionText, isCorrect, ordering } = body;

    // Validate required fields
    if (!questionId || optionText === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the question exists and if user has permission
    const questionCheck = await Database.query(
      `SELECT q.id, a.created_by, u.role
       FROM assignment_questions q
       JOIN assignments a ON q.assignment_id = a.id
       JOIN users u ON a.created_by = u.id
       WHERE q.id = $1`,
      [questionId]
    );

    if (questionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionCheck.rows[0];
    const isCreator = question.created_by === userId;
    const isAdmin = question.role === "admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to modify this question" },
        { status: 403 }
      );
    }

    // Insert the option
    const result = await Database.query(
      `INSERT INTO question_options (
        question_id, option_text, is_correct, ordering
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [questionId, optionText, isCorrect || false, ordering || 0]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error adding option:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
