import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import { verifyAuth } from "@/lib/auth-unified";





// GET /api/assignments/[id]/questions - Get questions for an assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignmentId = id;
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;

    // Check if assignment exists
    const assignmentCheck = await db.query(
      `SELECT a.*, u.role as user_role, u.club_id as user_club_id 
       FROM assignments a
       JOIN users u ON u.id = $1
       WHERE a.id = $2`,
      [userId, assignmentId]
    );

    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignment = assignmentCheck.rows[0];
    const userRole = assignment.user_role;
    const userClubId = assignment.user_club_id;
    
    // Check if the user is eligible to take this assignment
    const isAdmin = userRole === 'admin';
    const isCreator = assignment.created_by === userId;
    const isTargetClub = assignment.club_id === userClubId;
    const isAllClubs = assignment.target_audience === 'all_clubs';
    const isSpecificClub = assignment.target_audience === 'specific_clubs' && 
                           Array.isArray(assignment.target_clubs) && 
                           assignment.target_clubs.includes(userClubId);
    
    // Instructors can always see questions
    const isInstructor = isAdmin || isCreator;
    
    if (!isInstructor && !isTargetClub && !isAllClubs && !isSpecificClub) {
      return NextResponse.json(
        { error: "You are not eligible to take this assignment" },
        { status: 403 }
      );
    }

    // Check if the user has already submitted this assignment
    const submissionCheck = await db.query(
      `SELECT id FROM assignment_submissions 
       WHERE assignment_id = $1 AND user_id = $2 AND status = 'submitted'`,
      [assignmentId, userId]
    );

    if (submissionCheck.rows.length > 0 && !isInstructor) {
      return NextResponse.json(
        { error: "You have already submitted this assignment" },
        { status: 400 }
      );
    }

    // Get questions
    let questionsQuery = `
      SELECT 
        q.id,
        q.question_text as "questionText",
        q.question_type as "questionType",
        q.marks,
        q.time_limit as "timeLimit",
        q.code_language as "codeLanguage",
        q.ordering
    `;
    
    // Instructors can see all data including test cases and solutions
    if (isInstructor) {
      questionsQuery += `,
        q.code_template as "codeTemplate",
        q.test_cases as "testCases",
        q.expected_output as "expectedOutput",
        q.solution
      `;
    } else {
      // Students only see templates for coding questions
      questionsQuery += `,
        CASE WHEN q.question_type = 'coding' THEN q.code_template ELSE NULL END as "codeTemplate",
        NULL as "testCases",
        NULL as "expectedOutput",
        NULL as "solution"
      `;
    }
    
    questionsQuery += `
      FROM assignment_questions q
      WHERE q.assignment_id = $1
      ORDER BY q.ordering ASC
    `;

    const questionsResult = await db.query(questionsQuery, [assignmentId]);
    
    // Get options for multiple choice questions - OPTIMIZED to avoid N+1
    const questionIds = questionsResult.rows
      .filter(q => q.questionType === 'single_choice' || q.questionType === 'multiple_choice')
      .map(q => q.id);

    let optionsMap = new Map();
    if (questionIds.length > 0) {
      let optionsQuery = `
        SELECT 
          question_id,
          id,
          option_text as "optionText",
          ordering
      `;
      
      // Only show correct answers to instructors
      if (isInstructor) {
        optionsQuery += `, is_correct as "isCorrect"`;
      }
      
      optionsQuery += `
        FROM question_options
        WHERE question_id = ANY($1)
        ORDER BY question_id, ordering ASC
      `;
      
      const allOptionsResult = await db.query(optionsQuery, [questionIds]);
      
      // Group options by question_id
      allOptionsResult.rows.forEach(option => {
        if (!optionsMap.has(option.question_id)) {
          optionsMap.set(option.question_id, []);
        }
        optionsMap.get(option.question_id).push(option);
      });
    }

    // Attach options to questions
    const options = questionsResult.rows.map(question => {
      if (question.questionType === 'single_choice' || question.questionType === 'multiple_choice') {
        return { ...question, options: optionsMap.get(question.id) || [] };
      }
      return question;
    });

    // If shuffle is enabled and user is a student, shuffle the questions
    const questionsToReturn = options;
    if (assignment.shuffle_questions && !isInstructor) {
      // Fisher-Yates shuffle algorithm
      for (let i = questionsToReturn.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsToReturn[i], questionsToReturn[j]] = [questionsToReturn[j], questionsToReturn[i]];
        
        // Update ordering to reflect new order
        questionsToReturn[i].ordering = i;
        questionsToReturn[j].ordering = j;
      }
    }

    return NextResponse.json(questionsToReturn);
  } catch (error: unknown) {
    console.error("Error fetching assignment questions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
