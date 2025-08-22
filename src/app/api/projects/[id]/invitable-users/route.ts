import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const projectId = params.id;

    // Check if user can invite members to this project
    const permissions = await ProjectPermissionService.getUserPermissions(userId, projectId);
    
    if (!permissions.canInviteMembers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get invitable users
    const users = await ProjectPermissionService.getInvitableUsers(projectId);

    return NextResponse.json({
      users
    });

  } catch (error) {
    console.error('Error fetching invitable users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
