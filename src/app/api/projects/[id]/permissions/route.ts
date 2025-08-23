import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import jwt from 'jsonwebtoken';
import { verifyAuth } from '@/lib/auth-unified';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';
import { verifyAuth } from '@/lib/auth-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuth(request) as any;
    const userId = authResult.user?.id;
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
