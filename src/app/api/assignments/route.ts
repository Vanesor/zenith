import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";
import { NotificationService } from "@/lib/NotificationService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'integer';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  points: number;
  timeLimit?: number;
  timeAllocation?: number; // Added timeAllocation field
  language?: string;
  starterCode?: string;
  testCases?: Array<{ id: string; input: string; output: string; isHidden?: boolean }>;
  tags?: string[];
  difficulty?: string;
}

// Helper function to map front-end question types to database question types
function mapQuestionType(type: string): string {
  switch (type) {
    case 'multiple-choice':
      return 'multiple_choice';
    case 'true-false':
      return 'single_choice'; // Map true-false to single_choice
    case 'integer':
      return 'single_choice'; // Map integer to single_choice
    case 'coding':
      return 'coding';
    case 'essay':
      return 'essay';
    case 'short-answer':
      return 'essay'; // Map short-answer to essay type
    case 'integer':
      return 'single_choice'; // Map integer to single_choice
    default:
      return 'multiple_choice';
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const clubId = searchParams.get("clubId");

    let query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        a.max_points as "maxPoints",
        a.instructions,
        a.created_at as "createdAt",
        a.is_published as "isPublished",
        COALESCE(c.name, 'All Clubs') as club,
        u.name as "assignedBy",
        CASE 
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due_date < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        s.submitted_at as "submittedAt",
        s.grade,
        s.feedback,
        COUNT(aq.id) as "questionCount"
      FROM assignments a
      LEFT JOIN clubs c ON a.club_id = c.id
      JOIN users u ON a.created_by = u.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = $1
      LEFT JOIN assignment_questions aq ON a.id = aq.assignment_id
      LEFT JOIN users u2 ON u2.id = $1
      WHERE (
        a.target_audience = 'all_clubs' OR
        (a.club_id = u2.club_id AND a.target_audience = 'club') OR
        (a.target_audience = 'specific_clubs' AND u2.club_id = ANY(a.target_clubs))
      )
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND CASE 
        WHEN s.id IS NOT NULL THEN 'submitted'
        WHEN a.due_date < NOW() THEN 'overdue'
        ELSE 'pending'
      END = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (clubId) {
      query += ` AND a.club_id = $${paramIndex}`;
      queryParams.push(clubId);
      paramIndex++;
    }

    query += ` GROUP BY a.id, c.name, u.name, s.id, s.submitted_at, s.grade, s.feedback
               ORDER BY a.created_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    queryParams.push(limit.toString(), offset.toString());

    const result = await Database.query(query, queryParams);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const body = await request.json();
    const { 
      title, 
      description, 
      clubId, 
      dueDate, 
      maxPoints, 
      instructions,
      assignmentType,
      targetAudience,
      targetClubs,
      timeLimit,
      allowNavigation,
      passingScore,
      isProctored,
      requireCamera,
      requireMicrophone,
      requireFaceVerification,
      requireFullscreen,
      autoSubmitOnViolation,
      maxViolations,
      shuffleQuestions,
      shuffleOptions,
      allowCalculator,
      maxAttempts,
      showResults,
      allowReview,
      questions
    } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }
    
    // If target audience is club, require clubId
    if (targetAudience === 'club' && !clubId) {
      return NextResponse.json(
        { error: "Club ID is required for club-specific assignments" },
        { status: 400 }
      );
    }
    
    // If target audience is specific clubs, require targetClubs
    if (targetAudience === 'specific_clubs' && (!targetClubs || !targetClubs.length)) {
      return NextResponse.json(
        { error: "Target clubs are required for specific clubs assignments" },
        { status: 400 }
      );
    }

    // Check if user is a manager (has management role)
    const userCheck = await Database.query(
      "SELECT role, club_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userCheck.rows.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    const isManager = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (!isManager) {
      return NextResponse.json(
        { error: "Only management positions can create assignments" },
        { status: 403 }
      );
    }

    // Use the user's club_id instead of the provided clubId for security
    const actualClubId = user.club_id;

    if (!actualClubId) {
      return NextResponse.json(
        { error: "User is not associated with a club" },
        { status: 400 }
      );
    }

    // Begin transaction
    try {
      await Database.query('BEGIN');

      // Create assignment
      const assignmentResult = await Database.query(
        `INSERT INTO assignments (
          title, description, club_id, created_by, due_date, max_points, instructions,
          assignment_type, target_audience, target_clubs, time_limit,
          allow_navigation, passing_score, is_proctored, require_camera, require_microphone,
          require_face_verification, require_fullscreen, auto_submit_on_violation, max_violations,
          shuffle_questions, shuffle_options, allow_calculator, max_attempts, show_results, 
          allow_review, is_published
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
         RETURNING *`,
        [
          title,
          description,
          targetAudience ? (targetAudience === 'club' ? clubId : null) : actualClubId,
          userId,
          dueDate,
          maxPoints || 100,
          instructions || "",
          (assignmentType === 'mixed' ? 'regular' : assignmentType) || "regular",
          targetAudience || "club",
          targetClubs || [],
          timeLimit || 60,
          allowNavigation !== undefined ? allowNavigation : true,
          passingScore || 60,
          isProctored !== undefined ? isProctored : false,
          requireCamera !== undefined ? requireCamera : false,
          requireMicrophone !== undefined ? requireMicrophone : false,
          requireFaceVerification !== undefined ? requireFaceVerification : false,
          requireFullscreen !== undefined ? requireFullscreen : false,
          autoSubmitOnViolation !== undefined ? autoSubmitOnViolation : false,
          maxViolations || 3,
          shuffleQuestions !== undefined ? shuffleQuestions : false,
          shuffleOptions !== undefined ? shuffleOptions : false,
          allowCalculator !== undefined ? allowCalculator : true,
          maxAttempts || 1,
          showResults !== undefined ? showResults : true,
          allowReview !== undefined ? allowReview : true,
          true // is_published
        ]
      );

      const createdAssignment = assignmentResult.rows[0];

      // Create questions
      for (let i = 0; i < questions.length; i++) {
        const question: Question = questions[i];
        
        // Convert correctAnswer to appropriate format
        let correctAnswerValue = question.correctAnswer;
        if (question.type === 'true-false') {
          correctAnswerValue = question.correctAnswer === true ? 'true' : 'false';
        } else if (question.type === 'multiple-choice' && typeof question.correctAnswer === 'number') {
          correctAnswerValue = question.correctAnswer.toString();
        }

        await Database.query(
          `INSERT INTO assignment_questions (
            assignment_id, type, title, description, options, correct_answer, 
            points, time_limit, code_language, starter_code, test_cases, question_order,
            question_text, question_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            createdAssignment.id,
            question.type,
            question.title,
            question.description,
            question.options ? JSON.stringify(question.options) : null,
            correctAnswerValue,
            question.points,
            question.timeAllocation || question.timeLimit, // Use timeAllocation if available, fallback to timeLimit
            question.language || 'python',
            question.starterCode,
            question.testCases ? JSON.stringify(question.testCases) : null,
            i + 1, // question_order
            question.description || question.title, // Use description as question_text (required field)
            mapQuestionType(question.type) // Map to standardized question type
          ]
        );
      }

      await Database.query('COMMIT');

      // Create notifications for all club members
      const clubMembersQuery = `
        SELECT id FROM users WHERE club_id = $1 AND id != $2
      `;
      const clubMembers = await Database.query(clubMembersQuery, [
        actualClubId,
        userId,
      ]);

      if (clubMembers.rows.length > 0) {
        const clubQuery = `SELECT name FROM clubs WHERE id = $1`;
        const clubResult = await Database.query(clubQuery, [actualClubId]);
        const clubName = clubResult.rows[0]?.name || "Club";

        const memberIds = clubMembers.rows.map((member: { id: string }) => member.id);
        
        try {
          await NotificationService.notifyAssignmentCreated(
            createdAssignment.id,
            memberIds,
            clubName
          );
        } catch (notificationError) {
          console.error("Error creating notifications:", notificationError);
          // Don't fail the assignment creation if notifications fail
        }
      }

      return NextResponse.json({
        ...createdAssignment,
        questionCount: questions.length,
        message: "Assignment created successfully with questions"
      });

    } catch (error) {
      await Database.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
