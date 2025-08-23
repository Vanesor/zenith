import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { TaskManagementService } from '@/lib/TaskManagementService';

// GET /api/projects/[id]/tasks - Get project tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      assignee_id: searchParams.get('assignee_id') || undefined,
      priority: searchParams.get('priority') || undefined,
      task_type: searchParams.get('task_type') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await TaskManagementService.getProjectTasks(id, userId, filters);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied to this project' ? 403 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: result.tasks
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to get project tasks' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({
        error: authResult.error || 'Authentication required',
        expired: authResult.expired || false
      }, { status: 401 });
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      task_type,
      priority,
      assignee_id,
      parent_task_id,
      due_date,
      estimated_hours,
      labels
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const result = await TaskManagementService.createTask({
      project_id: id,
      title,
      description,
      task_type,
      priority,
      assignee_id,
      reporter_id: userId,
      parent_task_id,
      due_date,
      estimated_hours,
      labels
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      task: result.task
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
