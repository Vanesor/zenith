import { NextRequest, NextResponse } from 'next/server';
import { ProjectManagementService } from '@/lib/ProjectManagementService';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';
import { verifyAuth } from '@/lib/auth-unified';


// GET /api/projects - Get user's projects
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    let token = request.headers.get("authorization");
    if (token?.startsWith("Bearer ")) {
      token = token.substring(7);
    }

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    let decoded;
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

      decoded = { userId: authResult.user.id, email: authResult.user.email };
    } catch (error) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const club_id = searchParams.get('club_id') || undefined;

    const projects = await ProjectManagementService.getUserProjects(decoded.userId, {
      status,
      club_id
    });

    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using unified auth system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        expired: authResult.expired || false,
        message: authResult.expired ? 'Session expired. Please sign in again.' : 'Please sign in to access this feature.'
      }, { status: 401 });
    }

    const decoded = { userId: authResult.user.id, email: authResult.user.email };

    const body = await request.json();
    const {
      name,
      description,
      club_id,
      project_type,
      priority,
      start_date,
      target_end_date,
      is_public
    } = body;

    if (!name || !description || !club_id) {
      return NextResponse.json(
        { error: 'Name, description, and club_id are required' },
        { status: 400 }
      );
    }

    // Check user permissions
    const permissions = await ProjectPermissionService.getUserPermissions(decoded.userId);
    
    if (!permissions.canCreateProject) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions to create projects. You need to be a Club Coordinator, Co-coordinator, or Zenith Committee member.',
          currentRole: permissions.role,
          required: 'Club Coordinator, Co-coordinator, or Committee member'
        },
        { status: 403 }
      );
    }

    const result = await ProjectManagementService.createProject({
      name,
      description,
      club_id,
      created_by: decoded.userId,
      project_type,
      priority,
      start_date,
      target_end_date,
      is_public
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.project
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
