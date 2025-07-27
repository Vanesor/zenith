import { NextResponse } from "next/server";
import Database, { Post, Comment } from "@/lib/database";

export async function GET() {
  try {
    const posts: Post[] = await Database.getAllPosts();

    // Get posts with club details and author info
    const postsWithDetails = await Promise.all(
      posts.map(async (post: Post) => {
        const [club, author] = await Promise.all([
          Database.getClubById(post.club_id),
          Database.getUserById(post.author_id),
        ]);

        const comments: Comment[] = await Database.getCommentsByPost(post.id);

        return {
          ...post,
          club_name: club?.name || "Unknown Club",
          club_color: club?.color || "from-gray-500 to-gray-600",
          author_name: author?.name || "Unknown Author",
          comment_count: comments.length,
          like_count: post.likes?.length || 0,
        };
      })
    );

    // Sort by creation date (newest first)
    const sortedPosts = postsWithDetails.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      posts: sortedPosts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
