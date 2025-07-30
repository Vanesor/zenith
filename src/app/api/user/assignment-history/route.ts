import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zenith_user:zenith_password@localhost:5432/zenith_db'
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token verification
    const sessionQuery = 'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()';
    const sessionResult = await pool.query(sessionQuery, [token]);
    
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = sessionResult.rows[0].user_id;

    // Get user's assignment history with detailed information
    const historyQuery = `
      SELECT 
        a.id,
        a.title,
        c.name as club_name,
        aa.score,
        aa.max_score,
        aa.percentage,
        aa.status,
        aa.submitted_at,
        aa.time_spent,
        aa.attempt_number,
        COUNT(aa2.id) as total_attempts
      FROM assignments a
      JOIN assignment_attempts aa ON a.id = aa.assignment_id
      LEFT JOIN clubs c ON a.club_id = c.id
      LEFT JOIN assignment_attempts aa2 ON a.id = aa2.assignment_id AND aa2.user_id = aa.user_id
      WHERE aa.user_id = $1 
        AND aa.status IN ('completed', 'submitted', 'graded')
        AND aa.submitted_at IS NOT NULL
      GROUP BY a.id, a.title, c.name, aa.id, aa.score, aa.max_score, aa.percentage, 
               aa.status, aa.submitted_at, aa.time_spent, aa.attempt_number
      ORDER BY aa.submitted_at DESC
    `;
    
    const historyResult = await pool.query(historyQuery, [userId]);
    
    const assignments = historyResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      club: row.club_name || 'General',
      score: row.score || 0,
      maxScore: row.max_score || 100,
      percentage: row.percentage || 0,
      status: row.status,
      submittedAt: row.submitted_at.toISOString(),
      attempts: row.total_attempts || 1,
      timeSpent: row.time_spent || 0
    }));

    return NextResponse.json({
      success: true,
      assignments: assignments
    });

  } catch (error) {
    console.error('Error fetching assignment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment history' },
      { status: 500 }
    );
  }
}
