import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { verifyAuth } from "@/lib/AuthMiddleware";

import { NotificationService } from "@/lib/NotificationService";



interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'integer' | 'multi_select' | 'multi-select';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean | Array<string | number>;
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
    case 'multi-select':
    case 'multi_select':
      return 'multi_select'; // Map both versions to multi_select
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
    default:
      return 'multiple_choice';
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

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
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    // Parse and validate request body
    const body = await request.json();
    
    // Extract fields with validation
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
      allowReview
    } = body;
    
    // Validate questions array specifically
    let questions: Question[] = [];
    if (Array.isArray(body.questions)) {
      questions = body.questions.map((q: any) => {
        // Clean up each question object to ensure valid types
        const validatedQ: Partial<Question> = { ...q };
        
        // Ensure options is an array or null
        if (validatedQ.options && !Array.isArray(validatedQ.options)) {
          console.warn("Invalid options format, converting to array:", validatedQ.options);
          // If options is an object, try to convert it to an array
          if (typeof validatedQ.options === 'object') {
            try {
              validatedQ.options = Object.values(validatedQ.options);
            } catch (e) {
              validatedQ.options = [];
            }
          } else {
            validatedQ.options = [];
          }
        }
        
        // Ensure testCases is an array or null
        if (validatedQ.testCases && !Array.isArray(validatedQ.testCases)) {
          console.warn("Invalid testCases format, converting to array:", validatedQ.testCases);
          // If testCases is an object, try to convert it to an array
          if (typeof validatedQ.testCases === 'object') {
            try {
              validatedQ.testCases = Object.values(validatedQ.testCases);
            } catch (e) {
              validatedQ.testCases = [];
            }
          } else {
            validatedQ.testCases = [];
          }
        }
        
        return validatedQ;
      });
    }

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
        
        // Convert correctAnswer to appropriate format with proper JSON handling
        let correctAnswerValue = null;
        
        try {
          // Handle different question types with proper JSON formatting
          if (question.type === 'true-false') {
            // For true-false, store as string 'true' or 'false'
            correctAnswerValue = question.correctAnswer === true ? 'true' : 'false';
          } else if (question.type === 'multiple-choice') {
            // For multiple choice, always convert to string and ensure valid JSON
            if (typeof question.correctAnswer === 'number') {
              correctAnswerValue = question.correctAnswer.toString();
            } else if (typeof question.correctAnswer === 'string') {
              correctAnswerValue = question.correctAnswer;
            } else if (question.correctAnswer !== null && question.correctAnswer !== undefined) {
              correctAnswerValue = JSON.stringify(question.correctAnswer);
            }
          } else if (question.type === 'multi_select' || question.type === 'multi-select') {
            // For multi-select, ensure it's a proper JSON array
            if (Array.isArray(question.correctAnswer)) {
              correctAnswerValue = JSON.stringify(question.correctAnswer);
            } else if (typeof question.correctAnswer === 'object' && question.correctAnswer !== null) {
              // If it's an object but not an array, convert to array
              correctAnswerValue = JSON.stringify(Object.values(question.correctAnswer));
            } else {
              correctAnswerValue = '[]'; // Default empty array if invalid
            }
          } else if (question.type === 'coding') {
            // For coding questions, ensure test cases are valid
            correctAnswerValue = question.correctAnswer ? 
              (typeof question.correctAnswer === 'string' ? 
                question.correctAnswer : JSON.stringify(question.correctAnswer)) : 
              null;
          } else {
            // For all other types, safely convert to JSON if it's an object
            if (question.correctAnswer !== null && question.correctAnswer !== undefined) {
              correctAnswerValue = typeof question.correctAnswer === 'object' ? 
                JSON.stringify(question.correctAnswer) : 
                String(question.correctAnswer);
            }
          }
        } catch (e) {
          console.error(`Error formatting correctAnswer for question ${i+1}:`, e);
          correctAnswerValue = null; // Fallback to null on error
        }

        // Safely prepare JSON fields
        let optionsJson = null;
        if (question.options) {
          try {
            // Make sure options is an array before stringifying
            const optionsArray = Array.isArray(question.options) ? question.options : [];
            optionsJson = JSON.stringify(optionsArray);
          } catch (e) {
            console.error('Error converting options to JSON:', e);
            optionsJson = JSON.stringify([]);
          }
        }
        
        let testCasesJson = null;
        if (question.testCases) {
          try {
            // Make sure testCases is an array before stringifying
            const testCasesArray = Array.isArray(question.testCases) ? question.testCases : [];
            testCasesJson = JSON.stringify(testCasesArray);
          } catch (e) {
            console.error('Error converting testCases to JSON:', e);
            testCasesJson = JSON.stringify([]);
          }
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
            optionsJson, // Use safely prepared options JSON
            correctAnswerValue,
            question.points,
            question.timeAllocation || question.timeLimit, // Use timeAllocation if available, fallback to timeLimit
            question.language || 'python',
            question.starterCode,
            testCasesJson, // Use safely prepared testCases JSON
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
    
    // Provide more detailed error information
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle PostgreSQL errors specifically
      if (error.hasOwnProperty('detail')) {
        const pgError = error as any;
        errorMessage = `Database error: ${pgError.detail || pgError.message}`;
        
        // For JSON errors, provide more helpful message
        if (pgError.code === '22P02') {
          errorMessage = "Invalid JSON format in question options or test cases. Please check your input.";
        }
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorDetails: error
      },
      { status: 500 }
    );
  }
}
