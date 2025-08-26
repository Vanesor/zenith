import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check both JWT and NextAuth authentication
    let userId: string | null = null;
    let userRole = 'student';
    
    // First try NextAuth session (for OAuth users)
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      try {
        const userResult = await db.query(
          'SELECT id, role FROM users WHERE email = $1',
          [nextAuthSession.user.email]
        );
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
          userRole = userResult.rows[0].role;
        }
      } catch (error) {
        console.error('Error fetching user from NextAuth session:', error);
      }
    }
    
    // If no NextAuth session, try JWT authentication
    if (!userId) {
      const authResult = await verifyAuth(request);
      if (authResult.success && authResult.user) {
        userId = authResult.user.id;
        userRole = authResult.user.role;
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
