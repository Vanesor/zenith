import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import jwt from 'jsonwebtoken';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }
    
    const { id: projectId } = await params;    // Get user's permissions for this specific project
    const permissions = await ProjectPermissionService.getUserPermissions(userId, projectId);
    
    return NextResponse.json({
      permissions: {
        canEditProject: permissions.canEditProject,
        canDeleteProject: permissions.canDeleteProject,
        canInviteMembers: permissions.canInviteMembers,
        canCreateTasks: permissions.canCreateTasks,
        canEditTasks: permissions.canEditTasks,
        canDeleteTasks: permissions.canDeleteTasks,
        canAssignTasks: permissions.canAssignTasks,
        userRole: permissions.role,
        roleHierarchy: permissions.roleHierarchy,
        isPrivilegedRole: permissions.roleHierarchy <= 9
      }
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
