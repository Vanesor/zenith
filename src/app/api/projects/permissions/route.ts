import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';

export async function GET(request: NextRequest) {
  try {
    // Use unified auth system with automatic token refresh
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        expired: authResult.expired || false,
        message: authResult.expired ? 'Session expired. Please sign in again.' : 'Please sign in to access this feature.'
      }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Get user's permissions for project creation
    const permissions = await ProjectPermissionService.getUserPermissions(userId);
    
    console.log('API: User permissions for', authResult.user.email, '(', authResult.user.role, '):', permissions);
    
    const response = NextResponse.json({
      permissions: {
        canCreateProject: permissions.canCreateProject,
        canManageAllProjects: permissions.canManageAllProjects,
        userRole: permissions.role,
        roleHierarchy: permissions.roleHierarchy,
        isPrivilegedRole: permissions.roleHierarchy <= 9 // Committee members and above
      }
    });

    // Set new token if it was refreshed
    if (authResult.newToken) {
      response.cookies.set('zenith-token', authResult.newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 1 day
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
