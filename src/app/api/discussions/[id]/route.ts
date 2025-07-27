import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

interface Props {
  params: { id: string };
}

// GET /api/discussions/[id]
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;

    // Get discussion details
    const discussionQuery = `
      SELECT 
        d.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar,
        c.name as club_name
      FROM discussions d
      JOIN users u ON d.author_id = u.id
      LEFT JOIN clubs c ON d.club_id = c.id
      WHERE d.id = $1
    `;

    const discussionResult = await Database.query(discussionQuery, [id]);

    if (discussionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    // Get discussion replies
    const repliesQuery = `
      SELECT 
        dr.*,
        u.name as author_name,
        u.role as author_role,
        u.avatar as author_avatar
      FROM discussion_replies dr
      JOIN users u ON dr.author_id = u.id
      WHERE dr.discussion_id = $1
      ORDER BY dr.created_at ASC
    `;

    const repliesResult = await Database.query(repliesQuery, [id]);

    // Increment view count
    await Database.query(
      "UPDATE discussions SET views = views + 1 WHERE id = $1",
      [id]
    );

    return NextResponse.json({
      discussion: discussionResult.rows[0],
      replies: repliesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching discussion:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussion" },
      { status: 500 }
    );
  }
}

// PUT /api/discussions/[id] - Update discussion
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;
    const { title, description, category, tags, pinned, locked } =
      await request.json();

    const query = `
      UPDATE discussions 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          tags = COALESCE($4, tags),
          pinned = COALESCE($5, pinned),
          locked = COALESCE($6, locked),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const result = await Database.query(query, [
      title,
      description,
      category,
      tags,
      pinned,
      locked,
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ discussion: result.rows[0] });
  } catch (error) {
    console.error("Error updating discussion:", error);
    return NextResponse.json(
      { error: "Failed to update discussion" },
      { status: 500 }
    );
  }
}

// DELETE /api/discussions/[id] - Delete discussion (only by author within 3 hours or managers)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { id } = await params;

    // Get current discussion
    const currentDiscussion = await Database.query(
      "SELECT author_id, created_at FROM discussions WHERE id = $1",
      [id]
    );

    if (currentDiscussion.rows.length === 0) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    const discussion = currentDiscussion.rows[0];

    // Check if user is author or manager
    const user = await Database.getUserById(userId);
    const isAuthor = discussion.author_id === userId;
    const isManager =
      user &&
      [
        "coordinator",
        "co_coordinator",
        "secretary",
        "media",
        "president",
        "vice_president",
        "innovation_head",
        "treasurer",
        "outreach",
      ].includes(user.role);

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You don't have permission to delete this discussion" },
        { status: 403 }
      );
    }

    // Check if within 3 hours for regular users (managers can delete anytime)
    if (!isManager) {
      const createdAt = new Date(discussion.created_at);
      const now = new Date();
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return NextResponse.json(
          {
            error: "You can only delete discussions within 3 hours of creation",
          },
          { status: 403 }
        );
      }
    }

    // Delete related data first (foreign key constraints)
    await Database.query(
      "DELETE FROM discussion_replies WHERE discussion_id = $1",
      [id]
    );

    // Delete the discussion
    await Database.query("DELETE FROM discussions WHERE id = $1", [id]);

    return NextResponse.json({ message: "Discussion deleted successfully" });
  } catch (error) {
    console.error("Error deleting discussion:", error);
    return NextResponse.json(
      { error: "Failed to delete discussion" },
      { status: 500 }
    );
  }
}
