import { NextRequest, NextResponse } from "next/server";
import { prisma, Database } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

// Define interfaces for database rows
interface QuestionRow {
  id: string;
  title: string;
  description?: string;
  question_text?: string;
  question_type: string;
  marks?: number;
  points?: number;
  time_limit?: number;
  code_language?: string;
  code_template?: string;
  starter_code?: string;
  test_cases?: unknown;
  expected_output?: string;
  solution?: string;
  options?: unknown;
  correct_answer?: unknown;
  question_order?: number;
  ordering?: number;
  allowed_languages?: unknown;
  allow_any_language?: boolean;
  explanation?: string;
}

// Get a single assignment with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get assignment details
    const assignmentQuery = `
      SELECT 
        a.*,
        u.name as creator_name,
        c.name as club_name
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN clubs c ON a.club_id = c.id
      WHERE a.id = $1
    `;
    
    const assignmentResult = await Database.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Get assignment questions - optimized to select only needed columns
    const questionsQuery = `
      SELECT 
        id, title, description, question_text, question_type, 
        marks, points, difficulty_level, explanation, hints, 
        question_order, sample_input, sample_output, test_cases, 
        coding_language, starter_code, solution, created_at, updated_at
      FROM assignment_questions
      WHERE assignment_id = $1
      ORDER BY question_order
    `;
    
    const questionsResult = await Database.query(questionsQuery, [assignmentId]);
    const questions = questionsResult.rows;
    
    // Format the response
    const formattedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      assignmentType: assignment.assignment_type,
      clubId: assignment.club_id,
      clubName: assignment.club_name,
      createdBy: {
        id: assignment.created_by,
        name: assignment.creator_name
      },
      dueDate: assignment.due_date,
      maxPoints: assignment.max_points,
      status: assignment.status,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      targetAudience: assignment.target_audience,
      targetClubs: assignment.target_clubs,
      timeLimit: assignment.time_limit,
      allowNavigation: assignment.allow_navigation,
      passingScore: assignment.passing_score,
      isProctored: assignment.is_proctored,
      shuffleQuestions: assignment.shuffle_questions,
      allowCalculator: assignment.allow_calculator,
      showResults: assignment.show_results,
      allowReview: assignment.allow_review,
      shuffleOptions: assignment.shuffle_options,
      maxAttempts: assignment.max_attempts,
      isPublished: assignment.is_published,
      requireFullscreen: assignment.require_fullscreen,
      autoSubmitOnViolation: assignment.auto_submit_on_violation,
      maxViolations: assignment.max_violations,
      codeEditorSettings: assignment.code_editor_settings,
      questions: questions.map((q: unknown) => {
        const question = q as QuestionRow;
        return {
          id: question.id,
          title: question.title,
          description: question.description || question.question_text,
          questionType: question.question_type,
          marks: question.marks || question.points,
          timeLimit: question.time_limit,
          codeLanguage: question.code_language,
          codeTemplate: question.code_template || question.starter_code,
          testCases: question.test_cases,
          expectedOutput: question.expected_output,
          solution: question.solution,
          options: question.options,
          correctAnswer: question.correct_answer,
          questionOrder: question.question_order || question.ordering,
          allowedLanguages: question.allowed_languages,
          allowAnyLanguage: question.allow_any_language,
          explanation: question.explanation
        };
      })
    };
    
    return NextResponse.json(formattedAssignment);
    
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const requestingUserId = authResult.user!.id;
    
    // Get requesting user role and club
    const userQuery = `
      SELECT role, club_id
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await Database.query(userQuery, [requestingUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    // Get assignment to check club
    const assignmentQuery = `
      SELECT club_id, created_by FROM assignments WHERE id = $1
    `;
    
    const assignmentResult = await Database.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if the user is authorized to edit the assignment
    const managerRoles = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "president",
      "vice_president",
      "admin"
    ];
    
    const isManager = managerRoles.includes(userRole) && userClubId === assignment.club_id;
    const isCreator = assignment.created_by === requestingUserId;
    const isAdmin = userRole === 'admin';
    
    if (!isManager && !isCreator && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to edit this assignment" }, { status: 403 });
    }
    
    // Get data from request
    const data = await request.json();
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Update the assignment
    const updateQuery = `
      UPDATE assignments
      SET 
        title = $1,
        description = $2,
        instructions = $3,
        max_points = $4,
        due_date = $5,
        time_limit = $6,
        allow_navigation = $7,
        passing_score = $8,
        is_proctored = $9,
        shuffle_questions = $10,
        allow_calculator = $11,
        show_results = $12,
        allow_review = $13,
        shuffle_options = $14,
        max_attempts = $15,
        is_published = $16,
        require_fullscreen = $17,
        auto_submit_on_violation = $18,
        max_violations = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING id
    `;
    
    await Database.query(updateQuery, [
      data.title,
      data.description,
      data.instructions,
      data.maxPoints || 100,
      data.dueDate,
      data.timeLimit,
      data.allowNavigation !== undefined ? data.allowNavigation : true,
      data.passingScore || 60,
      data.isProctored !== undefined ? data.isProctored : false,
      data.shuffleQuestions !== undefined ? data.shuffleQuestions : false,
      data.allowCalculator !== undefined ? data.allowCalculator : true,
      data.showResults !== undefined ? data.showResults : true,
      data.allowReview !== undefined ? data.allowReview : true,
      data.shuffleOptions !== undefined ? data.shuffleOptions : false,
      data.maxAttempts || 1,
      data.isPublished !== undefined ? data.isPublished : false,
      data.requireFullscreen !== undefined ? data.requireFullscreen : false,
      data.autoSubmitOnViolation !== undefined ? data.autoSubmitOnViolation : false,
      data.maxViolations || 3,
      assignmentId
    ]);
    
    // Handle question updates if provided
    if (data.questions && Array.isArray(data.questions)) {
      // Process each question
      for (const question of data.questions) {
        if (question.id) {
          // Update existing question
          const updateQuestionQuery = `
            UPDATE assignment_questions
            SET 
              title = $1,
              description = $2,
              question_type = $3,
              marks = $4,
              time_limit = $5,
              options = $6,
              correct_answer = $7,
              code_language = $8,
              starter_code = $9,
              test_cases = $10,
              question_order = $11,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $12 AND assignment_id = $13
          `;
          
          await Database.query(updateQuestionQuery, [
            question.title,
            question.description,
            question.questionType,
            question.marks || 1,
            question.timeLimit,
            question.options ? JSON.stringify(question.options) : null,
            question.correctAnswer ? JSON.stringify(question.correctAnswer) : null,
            question.codeLanguage,
            question.codeTemplate || question.starterCode,
            question.testCases ? JSON.stringify(question.testCases) : null,
            question.questionOrder || 0,
            question.id,
            assignmentId
          ]);
        } else {
          // Insert new question
          const insertQuestionQuery = `
            INSERT INTO assignment_questions (
              assignment_id, title, description, question_type, 
              marks, time_limit, options, correct_answer, 
              code_language, starter_code, test_cases, question_order
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `;
          
          await Database.query(insertQuestionQuery, [
            assignmentId,
            question.title,
            question.description,
            question.questionType,
            question.marks || 1,
            question.timeLimit,
            question.options ? JSON.stringify(question.options) : null,
            question.correctAnswer ? JSON.stringify(question.correctAnswer) : null,
            question.codeLanguage,
            question.codeTemplate || question.starterCode,
            question.testCases ? JSON.stringify(question.testCases) : null,
            question.questionOrder || 0
          ]);
        }
      }
    }
    
    // If there are questions to delete
    if (data.questionsToDelete && Array.isArray(data.questionsToDelete) && data.questionsToDelete.length > 0) {
      // Delete questions
      const deleteQuestionsQuery = `
        DELETE FROM assignment_questions
        WHERE id = ANY($1) AND assignment_id = $2
      `;
      
      await Database.query(deleteQuestionsQuery, [data.questionsToDelete, assignmentId]);
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Assignment updated successfully",
      assignmentId
    });
    
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }
    
    const requestingUserId = authResult.user!.id;
    
    // Get requesting user role and club
    const userQuery = `
      SELECT role, club_id
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await Database.query(userQuery, [requestingUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = userResult.rows[0].role;
    const userClubId = userResult.rows[0].club_id;
    
    // Get assignment to check club
    const assignmentQuery = `
      SELECT club_id, created_by FROM assignments WHERE id = $1
    `;
    
    const assignmentResult = await Database.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if the user is authorized to delete the assignment
    const managerRoles = [
      "coordinator",
      "co_coordinator", 
      "president",
      "admin"
    ];
    
    const isManager = managerRoles.includes(userRole) && userClubId === assignment.club_id;
    const isCreator = assignment.created_by === requestingUserId;
    const isAdmin = userRole === 'admin';
    
    if (!isManager && !isCreator && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to delete this assignment" }, { status: 403 });
    }
    
    // Check if the assignment has submissions
    const submissionCountQuery = `
      SELECT COUNT(*) as count FROM assignment_submissions
      WHERE assignment_id = $1
    `;
    
    const submissionCountResult = await Database.query(submissionCountQuery, [assignmentId]);
    const submissionCount = parseInt(submissionCountResult.rows[0].count);
    
    // If there are submissions, soft delete by changing status
    if (submissionCount > 0) {
      await Database.query(
        `UPDATE assignments SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [assignmentId]
      );
      
      return NextResponse.json({ 
        success: true,
        message: "Assignment has been soft deleted due to existing submissions",
        softDelete: true
      });
    }
    
    // Hard delete if no submissions
    // First delete questions
    await Database.query(
      `DELETE FROM assignment_questions WHERE assignment_id = $1`,
      [assignmentId]
    );
    
    // Then delete the assignment
    await Database.query(
      `DELETE FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Assignment has been permanently deleted"
    });
    
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
