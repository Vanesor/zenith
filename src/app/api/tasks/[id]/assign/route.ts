import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { TaskManagementService } from '@/lib/TaskManagementService';
import jwt from 'jsonwebtoken';


// PATCH /api/tasks/[id]/assign - Assign task to user
export async function PATCH(
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
      const authResult = await verifyAuth(request);
      if (!authResult.success || !authResult.user) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      decoded = { userId: authResult.user.id, email: authResult.user.email };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignee_id } = body;

    const result = await TaskManagementService.assignTask(params.id, assignee_id, decoded.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task assigned successfully'
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
