import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // SQL query to fetch users with their primary club
    const rawUsers = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        c.name as club_name
      FROM users u
      LEFT JOIN 
        club_members cm ON u.id = cm.user_id
      LEFT JOIN 
        clubs c ON cm.club_id = c.id
      WHERE u.deleted_at IS NULL
      ORDER BY 
        u.name ASC
    `);
    
    // Format the data to match what the UI expects
    const formattedUsers = rawUsers.rows.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email || 'No Email',
      role: user.role || 'student',
      status: 'active', // Assuming default status is active
      club_name: user.club_name || 'No Club',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
