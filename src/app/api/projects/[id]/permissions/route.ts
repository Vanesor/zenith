import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const projectId = params.id;

    // Get user's permissions for this specific project
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
    console.error('Error checking project permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
