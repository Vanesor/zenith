import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
}

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

// Helper function to verify JWT token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    
    // Get JWT claims
    const { userId, authenticated } = await verifyAuth(request);
    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get user's attempts for this assignment
    const attemptsQuery = `
      SELECT 
        id, attempt_number, start_time, end_time, score, status, 
        answers, violations, submitted_at
      FROM assignment_attempts 
      WHERE assignment_id = $1 AND user_id = $2
      ORDER BY attempt_number DESC
    `;
    
    const attemptsResult = await pool.query(attemptsQuery, [assignmentId, user.id]);
    
    const attempts = attemptsResult.rows.map(attempt => {
      // Safe JSON parsing with fallback
      const parseJsonSafely = (value: any, fallback: any) => {
        if (!value) return fallback;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.warn('Failed to parse JSON:', value);
            return fallback;
          }
        }
        return fallback;
      };

      return {
        id: attempt.id,
        attemptNumber: attempt.attempt_number,
        startTime: attempt.start_time.toISOString(),
        endTime: attempt.end_time ? attempt.end_time.toISOString() : null,
        score: attempt.score,
        status: attempt.status,
        answers: parseJsonSafely(attempt.answers, {}),
        violations: parseJsonSafely(attempt.violations, []),
        submittedAt: attempt.submitted_at ? attempt.submitted_at.toISOString() : null
      };
    });

    return NextResponse.json({ attempts });

  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { attemptId, answers, violation } = await request.json();
    
    // Get user from token (simplified - in production, verify JWT properly)
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [1]); // Replace with actual token verification
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Update attempt with new answers or violations
    if (violation) {
      // Add violation
      const getAttemptQuery = 'SELECT violations FROM assignment_attempts WHERE id = $1 AND user_id = $2';
      const attemptResult = await pool.query(getAttemptQuery, [attemptId, user.id]);
      
      if (attemptResult.rows.length === 0) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      // Safe JSON parsing with fallback
      const parseJsonSafely = (value: any, fallback: any) => {
        if (!value) return fallback;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.warn('Failed to parse JSON:', value);
            return fallback;
          }
        }
        return fallback;
      };

      const currentViolations = parseJsonSafely(attemptResult.rows[0].violations, []);
      const updatedViolations = [...currentViolations, {
        type: violation.type,
        message: violation.message,
        timestamp: new Date().toISOString()
      }];

      const updateViolationsQuery = `
        UPDATE assignment_attempts 
        SET violations = $1, updated_at = $2
        WHERE id = $3 AND user_id = $4
      `;
      
      await pool.query(updateViolationsQuery, [
        JSON.stringify(updatedViolations),
        new Date(),
        attemptId,
        user.id
      ]);

      return NextResponse.json({ success: true, violations: updatedViolations });
    } else if (answers) {
      // Save progress
      const updateAnswersQuery = `
        UPDATE assignment_attempts 
        SET answers = $1, updated_at = $2
        WHERE id = $3 AND user_id = $4
      `;
      
      await pool.query(updateAnswersQuery, [
        JSON.stringify(answers),
        new Date(),
        attemptId,
        user.id
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Error updating attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
