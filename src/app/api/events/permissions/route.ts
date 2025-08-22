import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Get user's permissions (reuse project permission service as it has similar logic)
    const permissions = await ProjectPermissionService.getUserPermissions(userId);
    
    // Define event-specific permissions based on project permissions logic
    const eventPermissions = {
      canCreateEvent: permissions.canCreateProject, // Similar privilege levels required
      canEditEvent: permissions.canEditProject,
      canDeleteEvent: permissions.canDeleteProject,
      canManageAllEvents: permissions.canManageAllProjects,
      userRole: permissions.role,
      roleHierarchy: permissions.roleHierarchy,
      isPrivilegedRole: permissions.roleHierarchy <= 9 // Committee members and above
    };

    return NextResponse.json({
      permissions: eventPermissions
    });

  } catch (error) {
    console.error('Error checking event permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
