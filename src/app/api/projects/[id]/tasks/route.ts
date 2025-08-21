import { NextRequest, NextResponse } from 'next/server';
import { TaskManagementService } from '@/lib/TaskManagementService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET /api/projects/[id]/tasks - Get project tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      assignee_id: searchParams.get('assignee_id') || undefined,
      priority: searchParams.get('priority') || undefined,
      task_type: searchParams.get('task_type') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await TaskManagementService.getProjectTasks(params.id, decoded.userId, filters);

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
    console.error('Error getting project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get project tasks' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create new task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
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
      project_id: params.id,
      title,
      description,
      task_type,
      priority,
      assignee_id,
      reporter_id: decoded.userId,
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
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
