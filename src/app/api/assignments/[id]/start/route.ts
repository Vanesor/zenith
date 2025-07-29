import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [1]); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if assignment exists and is available
    const assignmentQuery = `
      SELECT 
        id, title, description, time_limit, max_attempts, due_date,
        allow_navigation, is_proctored, shuffle_questions, allow_calculator,
        show_results, allow_review, instructions, max_points, passing_score
      FROM assignments 
      WHERE id = $1 AND is_published = true
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [assignmentId]);
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentResult.rows[0];
    
    // Check if assignment is still available
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (now > dueDate) {
      return NextResponse.json({ error: 'Assignment has expired' }, { status: 400 });
    }

    // Check existing attempts
    const attemptsQuery = `
      SELECT COUNT(*) as attempt_count
      FROM assignment_attempts 
      WHERE assignment_id = $1 AND user_id = $2 AND status IN ('completed', 'submitted')
    `;
    
    const attemptsResult = await pool.query(attemptsQuery, [assignmentId, user.id]);
    const attemptCount = parseInt(attemptsResult.rows[0].attempt_count);
    
    if (attemptCount >= assignment.max_attempts) {
      return NextResponse.json({ error: 'Maximum attempts exceeded' }, { status: 400 });
    }

    // Check for existing in-progress attempt
    const inProgressQuery = `
      SELECT id FROM assignment_attempts 
      WHERE assignment_id = $1 AND user_id = $2 AND status = 'in_progress'
    `;
    
    const inProgressResult = await pool.query(inProgressQuery, [assignmentId, user.id]);
    
    if (inProgressResult.rows.length > 0) {
      return NextResponse.json({ 
        id: inProgressResult.rows[0].id,
        startTime: new Date().toISOString(),
        status: 'in_progress',
        answers: {},
        violations: []
      });
    }

    // Create new attempt
    const createAttemptQuery = `
      INSERT INTO assignment_attempts (
        assignment_id, user_id, attempt_number, start_time, status, answers, violations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, start_time, status, answers, violations
    `;
    
    const newAttemptResult = await pool.query(createAttemptQuery, [
      assignmentId,
      user.id,
      attemptCount + 1,
      now,
      'in_progress',
      JSON.stringify({}),
      JSON.stringify([])
    ]);

    const newAttempt = newAttemptResult.rows[0];

    return NextResponse.json({
      id: newAttempt.id,
      startTime: newAttempt.start_time.toISOString(),
      status: newAttempt.status,
      answers: JSON.parse(newAttempt.answers),
      violations: JSON.parse(newAttempt.violations)
    });

  } catch (error) {
    console.error('Error starting assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
