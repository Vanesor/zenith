import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.userId;

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
    
    const historyResult = await Database.query(historyQuery, [userId]);
    
    const assignments = historyResult.rows.map((row: any) => ({
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
