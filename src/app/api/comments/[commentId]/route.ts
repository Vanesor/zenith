import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import db from '@/lib/database';

// GET /api/comments/[commentId] - Get single comment
export async function GET(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;

    const result = await db.query(
      `
      SELECT c.*, u.name as author_name, u.avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
      `,
      [commentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ comment: result.rows[0] });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Get the comment to check permissions
    const comment = await db.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );

    if (comment.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = comment.rows[0];
    
    // Check if user can edit (only creator within 2 hours)
    const canEdit = commentData.author_id === authResult.user.id;
    const createdAt = new Date(commentData.created_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const isWithinEditWindow = createdAt > twoHoursAgo;

    if (!canEdit || !isWithinEditWindow) {
      return NextResponse.json(
        { error: 'Cannot edit this comment. Comments can only be edited by their creator within 2 hours.' },
        { status: 403 }
      );
    }

    // Update the comment
    const result = await db.query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [content, commentId]
    );

    return NextResponse.json({
      success: true,
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    // Get the comment to check permissions
    const comment = await db.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );

    if (comment.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = comment.rows[0];
    
    // Check permissions for deletion
    const isCreator = commentData.author_id === authResult.user.id;
    const isZenithCommittee = authResult.user.role === 'zenith_committee';
    
    // Check if user is club coordinator/co-coordinator
    let isClubModerator = false;
    if (authResult.user.club_id) {
      const clubRole = await db.query(
        'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN ($3, $4)',
        [authResult.user.id, authResult.user.club_id, 'coordinator', 'co_coordinator']
      );
      isClubModerator = clubRole.rows.length > 0;
    }

    const createdAt = new Date(commentData.created_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let canDelete = false;
    
    if (isCreator && createdAt > twoHoursAgo) {
      // Creator can delete within 2 hours
      canDelete = true;
    } else if ((isZenithCommittee || isClubModerator) && createdAt > sevenDaysAgo) {
      // Moderators can delete within 7 days
      canDelete = true;
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Cannot delete this comment. Insufficient permissions or time limit exceeded.' },
        { status: 403 }
      );
    }

    // Delete the comment and its likes
    await db.query('DELETE FROM likes WHERE comment_id = $1', [commentId]);
    await db.query('DELETE FROM comments WHERE id = $1', [commentId]);

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
