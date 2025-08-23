import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Check if user has access to this project
    const accessQuery = `
      SELECT 1 FROM project_members 
      WHERE project_id = $1 AND user_id = $2 AND status = 'active'
    `;
    const accessResult = await db.query(accessQuery, [projectId, userId]);
    
    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get project members
    const membersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        pm.role,
        pm.joined_at,
        pm.status
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 AND pm.status = 'active'
      ORDER BY pm.joined_at ASC
    `;
    
    const membersResult = await db.query(membersQuery, [projectId]);

    return NextResponse.json({
      members: membersResult.rows
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
