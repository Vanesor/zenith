import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

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
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

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
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
