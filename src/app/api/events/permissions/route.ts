import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
    }

    const userId = authResult.user.id;

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
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
