import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const clubId = searchParams.get("clubId");

    let posts;
    if (clubId) {
      posts = await Database.getPostsByClub(
        clubId,
        limit ? parseInt(limit) : undefined
      );
    } else {
      // Get recent posts from all clubs
      const result = await Database.query(
        `SELECT p.*, c.name as club_name, c.color as club_color 
         FROM posts p 
         LEFT JOIN clubs c ON p.club_id = c.id 
         ORDER BY p.created_at DESC 
         ${limit ? "LIMIT $1" : ""}`,
        limit ? [parseInt(limit)] : []
      );
      posts = result.rows;
    }

    // Get post details with author info and comments
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [author, comments] = await Promise.all([
          Database.getUserById(post.author_id),
          Database.getCommentsByPost(post.id),
        ]);

        return {
          ...post,
          author: author
            ? {
                name: author.name,
                avatar: author.avatar,
                role: author.role,
              }
            : null,
          commentCount: comments.length,
          likeCount: post.likes.length,
        };
      })
    );

    return NextResponse.json(postsWithDetails);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author_id, club_id, attachments } = body;

    // Validate required fields
    if (!title || !content || !author_id || !club_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const post = await Database.createPost({
      title,
      content,
      author_id,
      club_id,
      likes: [],
      comments: [],
      attachments: attachments || [],
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
