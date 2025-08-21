import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user's permissions for project creation
    const permissions = await ProjectPermissionService.getUserPermissions(userId);
    
    return NextResponse.json({
      permissions: {
        canCreateProject: permissions.canCreateProject,
        canManageAllProjects: permissions.canManageAllProjects,
        userRole: permissions.role,
        roleHierarchy: permissions.roleHierarchy,
        isPrivilegedRole: permissions.roleHierarchy <= 9 // Committee members and above
      }
    });

  } catch (error) {
    console.error('Error checking user permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
