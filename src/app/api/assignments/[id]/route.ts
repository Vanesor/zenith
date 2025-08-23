import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyAuth, withAuth } from "@/lib/auth-unified";

// Safe JSON parsing utility
function safeJsonParse(jsonString: string, defaultValue: unknown) {
  try {
    // Check if it's already a valid object/array
    if (typeof jsonString !== 'string') {
      return jsonString;
    }
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
}

// Helper function to check if user is in a management role
function isManagerRole(role: string): boolean {
  return [
    "coordinator",
    "co_coordinator", 
    "secretary",
    "media",
    "president",
    "vice_president",
    "innovation_head",
    "treasurer",
    "outreach",
  ].includes(role);
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

    // Get user details using SQL
    const userResult = await db.query(`
      SELECT id, email, name FROM users WHERE id = $1 AND deleted_at IS NULL
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get assignment details with questions using SQL
    const assignmentResult = await db.query(`
      SELECT * FROM assignments WHERE id = $1 AND deleted_at IS NULL
    `, [assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignment = assignmentResult.rows[0];
    
    // Get questions for this assignment
    const questionsResult = await db.query(`
      SELECT * FROM assignment_questions 
      WHERE assignment_id = $1 
      ORDER BY ordering ASC, created_at ASC
    `, [assignmentId]);

    const questions = questionsResult.rows;

    // Transform assignment data for response
    const transformedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      timeLimit: assignment.time_limit || 60,
      maxAttempts: assignment.max_attempts || 1,
      dueDate: assignment.due_date,
      allowNavigation: assignment.allow_navigation !== false,
      isProctored: assignment.is_proctored === true,
      shuffleQuestions: assignment.shuffle_questions === true,
      allowCalculator: assignment.allow_calculator !== false,
      showResults: assignment.show_results !== false,
      allowReview: assignment.allow_review !== false,
      instructions: assignment.instructions || '',
      maxPoints: assignment.max_points || 100,
      questions: questions,
      status: assignment.status || 'active'
    };

    return NextResponse.json({
      success: true,
      assignment: transformedAssignment
    });

    // Shuffle questions if required
    if (assignment.shuffle_questions) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    const response = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      timeLimit: assignment.time_limit || 60,
      maxAttempts: assignment.max_attempts || 1,
      dueDate: assignment.due_date.toISOString(),
      allowNavigation: assignment.allow_navigation !== false,
      isProctored: assignment.is_proctored === true,
      shuffleQuestions: assignment.shuffle_questions === true,
      allowCalculator: assignment.allow_calculator !== false,
      showResults: assignment.show_results !== false,
      allowReview: assignment.allow_review !== false,
      instructions: assignment.instructions || '',
      maxPoints: assignment.max_points || 100,
      passingScore: assignment.passing_score || 60,
      questions: questions
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentIdToUpdate = params.id;
    const body = await request.json();
    
    // Get user authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authResult.user.id;
    
    // Update assignment using SQL
    const updateResult = await db.query(`
      UPDATE assignments 
      SET title = $1, description = $2, updated_at = NOW()
      WHERE id = $3 AND created_by = $4 AND deleted_at IS NULL
      RETURNING *
    `, [body.title, body.description, assignmentIdToUpdate, userId]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      assignment: updateResult.rows[0] 
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ 
      error: "Error updating assignment", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    
    // Verify authentication using centralized AuthMiddleware
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    
    // Check if user has permission to delete the assignment (must be a club manager)
    const userCheck = await db.query(
      "SELECT role, club_id FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    
    // Check if user is in a management role
    if (!isManagerRole(user.role)) {
      return NextResponse.json(
        { error: "Only management positions can delete assignments" },
        { status: 403 }
      );
    }
    
    // Check if the assignment exists and belongs to the user's club
    const assignmentCheck = await db.query(
      `SELECT a.*, a.start_date as "startDate" FROM assignments a 
       WHERE a.id = $1 AND (a.created_by = $2 OR a.club_id = $3)`,
      [assignmentId, userId, user.club_id]
    );
    
    if (assignmentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    const assignment = assignmentCheck.rows[0];
    
    // Check if the assignment has already started (has submissions)
    const submissionsCheck = await db.query(
      "SELECT COUNT(*) as submission_count FROM assignment_attempts WHERE assignment_id = $1",
      [assignmentId]
    );
    
    const submissionCount = parseInt(submissionsCheck.rows[0].submission_count);
    
    if (submissionCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete assignment with existing submissions", 
          message: "This assignment already has submissions and cannot be deleted."
        },
        { status: 400 }
      );
    }

    // Begin transaction
    await db.query('BEGIN');
    
    // First delete all questions related to the assignment
    await db.query(
      "DELETE FROM assignment_questions WHERE assignment_id = $1",
      [assignmentId]
    );
    
    // Then delete the assignment
    const deleteResult = await db.query(
      "DELETE FROM assignments WHERE id = $1 RETURNING id",
      [assignmentId]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    if (deleteResult.rows.length === 0) {
      // Should not happen due to our previous check, but just in case
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Assignment deleted successfully',
      deletedId: assignmentId
    });

  } catch (error) {
    // Rollback transaction if there was an error
    try {
      await db.query('ROLLBACK');
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ 
      error: "Error deleting assignment", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
