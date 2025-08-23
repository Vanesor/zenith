import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { ProjectManagementService } from '@/lib/ProjectManagementService';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false 
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }
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
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
