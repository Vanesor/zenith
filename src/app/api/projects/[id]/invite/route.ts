import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ProjectManagementService } from '@/lib/ProjectManagementService';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Check if user can invite members to this project
    const permissions = await ProjectPermissionService.getUserPermissions(userId, projectId);
    
    if (!permissions.canInviteMembers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Invite users
    const result = await ProjectManagementService.inviteMembers(projectId, userIds, userId);

    if (result.success) {
      return NextResponse.json({
        message: 'Users invited successfully',
        invitedCount: result.invitedCount,
        failedCount: result.failedCount
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

  } catch (error) {
    console.error('Error inviting users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
