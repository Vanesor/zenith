import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

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

// DELETE /api/discussions/[id]
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = params;

    const result = await Database.query(
      "DELETE FROM discussions WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Discussion deleted successfully" });
  } catch (error) {
    console.error("Error deleting discussion:", error);
    return NextResponse.json(
      { error: "Failed to delete discussion" },
      { status: 500 }
    );
  }
}
