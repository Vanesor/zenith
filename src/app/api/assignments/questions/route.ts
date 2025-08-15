import { NextRequest, NextResponse } from "next/server";
import { prisma, Database } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

// POST /api/assignments/questions
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      assignmentId,
      questionText,
      questionType,
      marks,
      timeLimit,
      codeLanguage,
      codeTemplate,
      testCases,
      expectedOutput,
      solution,
      ordering
    } = body;

    // Validate required fields
    if (!assignmentId || !questionText || !questionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has permission to add questions
    const assignmentCheck = await Database.query(
      `SELECT a.id, a.created_by, u.role
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignment = assignmentCheck.rows[0];
    const isCreator = assignment.created_by === userId;
    const isAdmin = assignment.role === "admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to modify this assignment" },
        { status: 403 }
      );
    }

    // Insert the question
    const result = await Database.query(
      `INSERT INTO assignment_questions (
        assignment_id, question_text, question_type, marks, time_limit,
        code_language, code_template, test_cases, expected_output, solution, ordering
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        assignmentId,
        questionText,
        questionType,
        marks || 1,
        timeLimit || null,
        codeLanguage || null,
        codeTemplate || null,
        testCases ? JSON.stringify(testCases) : null,
        expectedOutput || null,
        solution || null,
        ordering || 0
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error adding question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
