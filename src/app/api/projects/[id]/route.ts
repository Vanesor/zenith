import { NextRequest, NextResponse } from 'next/server';
import { ProjectManagementService } from '@/lib/ProjectManagementService';
import { TaskManagementService } from '@/lib/TaskManagementService';
import { ProjectPermissionService } from '@/lib/ProjectPermissionService';
import { verifyAuth } from '@/lib/auth-unified';

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error || "Authentication required",
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    const result = await ProjectManagementService.getProjectDetails(id, authResult.user?.id || '');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied to this project' ? 403 : 404 }
      );
    }

    // Get task statistics
    const taskStats = await TaskManagementService.getTaskStatistics(id);

    return NextResponse.json({
      success: true,
      project: result.project,
      taskStats
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to get project details' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error || "Authentication required",
          expired: authResult.expired || false
        },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Check user permissions
    const permissions = await ProjectPermissionService.getUserPermissions(authResult.user?.id || '', projectId);
    
    if (!permissions.canDeleteProject) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions to delete this project. You need to be a Club Coordinator, Co-coordinator, or Zenith Committee member.',
          currentRole: permissions.role
        },
        { status: 403 }
      );
    }

    // Delete the project
    const result = await ProjectManagementService.deleteProject(projectId, authResult.user?.id || '');
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
