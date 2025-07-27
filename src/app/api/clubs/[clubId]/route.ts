import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { clubId } = await params;

    const club = await Database.getClubById(clubId);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const [members, events, posts, leadership] = await Promise.all([
      Database.getClubMembers(clubId),
      Database.getEventsByClub(clubId),
      Database.getPostsByClub(clubId, 10),
      Database.getClubLeadership(clubId),
    ]);

    // Get post authors and comment counts
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = await Database.getUserById(post.author_id);
        const comments = await Database.getCommentsByPost(post.id);

        return {
          ...post,
          author_name: author?.name || "Unknown",
          author_avatar: author?.avatar,
          author_role: author?.role,
          comment_count: comments.length,
          like_count: post.like_count,
        };
      })
    );

    // Get upcoming events only
    const upcomingEvents = events.filter(
      (event) => new Date(event.event_date) >= new Date()
    );

    return NextResponse.json({
      club: {
        ...club,
        memberCount: members.length,
        leadership,
      },
      members,
      events: upcomingEvents,
      posts: postsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching club details:", error);
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}
