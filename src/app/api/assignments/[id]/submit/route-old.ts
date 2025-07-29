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

// POST /api/assignments/[id]/submit - Submit an assignment
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
    const { 
      answers,
      startedAt, 
      completedAt, 
      timeSpent,
      violationCount, 
      autoSubmitted
    } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Invalid submission data" },
        { status: 400 }
      );
    }

    // Check if assignment exists and is still open
    const assignmentCheck = await Database.query(
      `SELECT * FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignment = assignmentCheck.rows[0];
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    // Check if assignment is past due (unless it's being auto-submitted)
    if (dueDate < now && !autoSubmitted) {
      return NextResponse.json(
        { error: "Assignment is past due" },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingSubmission = await Database.query(
      `SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, userId]
    );

    if (existingSubmission.rows.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted this assignment" },
        { status: 400 }
      );
    }

    // Create submission record
    const submissionResult = await Database.query(
      `INSERT INTO assignment_submissions (
        assignment_id, user_id, started_at, completed_at,
        time_spent, violation_count, auto_submitted, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
      RETURNING id`,
      [
        assignmentId,
        userId,
        startedAt ? new Date(startedAt) : now,
        completedAt ? new Date(completedAt) : now,
        timeSpent || 0,
        violationCount || 0,
        autoSubmitted || false
      ]
    );

    const submissionId = submissionResult.rows[0].id;

    // Get all questions for this assignment
    const questionsResult = await Database.query(
      `SELECT id, question_type, marks FROM assignment_questions WHERE assignment_id = $1`,
      [assignmentId]
    );

    const questions = questionsResult.rows;
    let totalScore = 0;

    // Process each answer
    for (const answer of answers) {
      const { questionId, selectedOptions, codeAnswer, essayAnswer, timeSpent: questionTimeSpent } = answer;
      
      // Find the question in our fetched questions
      const question = questions.find(q => q.id === questionId);
      if (!question) continue;
      
      let isCorrect: boolean | null = false;
      let score = 0;

      // For objective questions, check if the answer is correct
      if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
        // Get correct options
        const optionsResult = await Database.query(
          `SELECT id FROM question_options WHERE question_id = $1 AND is_correct = true`,
          [questionId]
        );
        
        const correctOptions = optionsResult.rows.map(row => row.id);
        
        // For single choice, there should be exactly one correct answer
        if (question.question_type === 'single_choice') {
          isCorrect = selectedOptions.length === 1 && 
                      correctOptions.includes(selectedOptions[0]);
        } 
        // For multiple choice, selected options should match correct options exactly
        else {
          // Sort both arrays for comparison
          const sortedSelected = [...selectedOptions].sort();
          const sortedCorrect = [...correctOptions].sort();
          
          isCorrect = sortedSelected.length === sortedCorrect.length &&
                      sortedSelected.every((value, index) => value === sortedCorrect[index]);
        }
        
        // Award full marks if correct
        score = isCorrect ? question.marks : 0;
      }
      // For coding and essay questions, store the answers but don't auto-grade
      else {
        // These will be graded manually, set isCorrect to null
        isCorrect = null;
        score = 0; // Initialize with 0, will be updated by instructor later
      }

      // Record this response
      const responseResult = await Database.query(
        `INSERT INTO question_responses (
          submission_id, question_id, selected_options,
          code_answer, essay_answer, is_correct, score, time_spent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          submissionId,
          questionId,
          selectedOptions || [],
          codeAnswer || null,
          essayAnswer || null,
          isCorrect,
          score,
          questionTimeSpent || 0
        ]
      );

      // Add to total score if graded automatically
      if (score !== null) {
        totalScore += score;
      }
    }

    // Update submission with total score for auto-graded questions
    await Database.query(
      `UPDATE assignment_submissions SET total_score = $1 WHERE id = $2`,
      [totalScore, submissionId]
    );

    return NextResponse.json({
      id: submissionId,
      message: "Assignment submitted successfully",
      totalScore,
      autoGraded: true
    });
  } catch (error: any) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
