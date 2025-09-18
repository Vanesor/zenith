import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // Enhanced SQL query to fetch users with more details
    const rawUsers = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        u.created_at,
        u.updated_at,
        u.phone_number,
        u.avatar,
        u.profile_image_url,
        u.last_activity,
        c.name as club_name,
        c.id as club_id,
        -- Calculate user status based on activity and account state
        CASE 
          WHEN u.created_at > NOW() - INTERVAL '7 days' AND cm.id IS NULL THEN 'pending'
          WHEN u.last_activity < NOW() - INTERVAL '90 days' THEN 'inactive'
          ELSE 'active'
        END as status
      FROM users u
      LEFT JOIN 
        club_members cm ON u.id = cm.user_id
      LEFT JOIN 
        clubs c ON cm.club_id = c.id
      ORDER BY 
        u.name ASC
    `);
    
    // Format the data to match what the UI expects
    const formattedUsers = rawUsers.rows.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email || 'No Email',
      role: user.role || 'student',
      status: user.status || 'active',
      club_name: user.club_name || 'No Club',
      club_id: user.club_id || null,
      created_at: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
      updated_at: user.updated_at ? user.updated_at.toISOString() : new Date().toISOString(),
      last_login: user.last_activity ? user.last_activity.toISOString() : undefined,
      avatar: user.avatar || user.profile_image_url || null,
      profile_image_url: user.profile_image_url || user.avatar || null,
      phone: user.phone_number || null
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      total: formattedUsers.length
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
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
