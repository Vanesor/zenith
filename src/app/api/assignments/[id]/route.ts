import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyAuth } from '@/lib/AuthMiddleware';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

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

    // Get user details
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get assignment details
    const assignmentQuery = `
      SELECT 
        id, title, description, time_limit, max_attempts, due_date,
        allow_navigation, is_proctored, shuffle_questions, allow_calculator,
        show_results, allow_review, instructions, max_points, passing_score,
        is_published, created_at, updated_at
      FROM assignments 
      WHERE id = $1
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentResult.rows[0];

    // Check if user has access to this assignment (for now, allow all users)
    // In production, you might want to check if user is enrolled in the course, etc.

    // Get assignment questions
    const questionsQuery = `
      SELECT 
        id, type, title, description, options, correct_answer, points,
        time_limit, code_language as language, starter_code, test_cases, question_order
      FROM assignment_questions 
      WHERE assignment_id = $1
      ORDER BY question_order
    `;
    
    const questionsResult = await pool.query(questionsQuery, [assignmentId]);
    
    const questions = questionsResult.rows.map(question => ({
      id: question.id,
      type: question.type || 'multiple-choice',
      title: question.title || 'Untitled Question',
      description: question.description || question.question_text || '',
      options: question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : undefined,
      correctAnswer: question.correct_answer,
      points: question.points || question.marks || 1,
      timeLimit: question.time_limit,
      language: question.language,
      starterCode: question.starter_code,
      testCases: question.test_cases ? (typeof question.test_cases === 'string' ? JSON.parse(question.test_cases) : question.test_cases) : undefined
    }));

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
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name, role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, ['550e8400-e29b-41d4-a716-446655440020']); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if user has permission to update assignments
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update assignment
    const updateQuery = `
      UPDATE assignments 
      SET 
        title = $1, description = $2, time_limit = $3, max_attempts = $4,
        due_date = $5, allow_navigation = $6, is_proctored = $7, 
        shuffle_questions = $8, allow_calculator = $9, show_results = $10,
        allow_review = $11, instructions = $12, max_points = $13, 
        passing_score = $14, updated_at = $15
      WHERE id = $16
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [
      body.title,
      body.description,
      body.timeLimit,
      body.maxAttempts,
      new Date(body.dueDate),
      body.allowNavigation,
      body.isProctored,
      body.shuffleQuestions,
      body.allowCalculator,
      body.showResults,
      body.allowReview,
      body.instructions,
      body.maxPoints,
      body.passingScore,
      new Date(),
      assignmentId
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Assignment updated successfully',
      assignment: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name, role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, ['550e8400-e29b-41d4-a716-446655440020']); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if user has permission to delete assignments
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete assignment (this will cascade to questions and attempts if foreign keys are set up)
    const deleteQuery = 'DELETE FROM assignments WHERE id = $1 RETURNING id';
    const deleteResult = await pool.query(deleteQuery, [assignmentId]);

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Assignment deleted successfully',
      deletedId: assignmentId
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
