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
    const userEmail = authResult.user.email;
    const userRole = authResult.user.role.toLowerCase();
    
    console.log('Auth user info:', {
      userId,
      userEmail,
      userRole,
      originalRole: authResult.user.role
    });

    // Get user's permissions (reuse project permission service as it has similar logic)
    const permissions = await ProjectPermissionService.getUserPermissions(userId);
    
    // Define club-specific permissions based on project permissions logic
    const clubPermissions = {
      canCreatePost: permissions.canCreateProject, // Similar privilege levels required
      canEditPost: permissions.canEditProject,
      canDeletePost: permissions.canDeleteProject,
      canManageClub: permissions.canManageAllProjects,
      canModerateComments: permissions.canEditProject,
      userRole: permissions.role,
      roleHierarchy: permissions.roleHierarchy,
      isPrivilegedRole: permissions.roleHierarchy <= 9, // Committee members and above
      
      // Check specific roles for the Zenith committee
      isZenithCommittee: ['president', 'vice_president', 'innovation_head', 
                         'secretary', 'treasurer', 'outreach_coordinator', 
                         'media_head', 'zenith_committee'].includes(userRole),
      
      // Check for club coordinator roles
      isCoordinator: ['club_coordinator', 'coordinator'].includes(userRole),
      isCoCoordinator: ['co_coordinator', 'co-coordinator'].includes(userRole)
    };

    console.log(`API: Club permissions for user ${authResult.user.email} (${userRole}):`, clubPermissions);

    return NextResponse.json({
      permissions: clubPermissions
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
