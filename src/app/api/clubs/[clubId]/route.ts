import { NextRequest, NextResponse } from "next/server";
import PrismaDB from "@/lib/database-consolidated";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    const club = await PrismaDB.getClubById(clubId);
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Properly handle promises
    const [members, events, posts, leadership] = await Promise.all([
      PrismaDB.getClubMembers(clubId),
      PrismaDB.getEventsByClub(clubId),
      PrismaDB.getPostsByClub(clubId, 10),
      PrismaDB.getClubLeadership(clubId),
    ]);

    // Ensure arrays
    const membersArray = Array.isArray(members) ? members : [];
    const eventsArray = Array.isArray(events) ? events : [];
    const postsArray = Array.isArray(posts) ? posts : [];

    // Get post authors and comment counts
    const postsWithDetails = await Promise.all(
      postsArray.map(async (post: any) => {
        const author = await PrismaDB.getUserById(post.author_id);
        const comments = await PrismaDB.getCommentsByPost(post.id);
        const commentsArray = Array.isArray(comments) ? comments : [];

        return {
          ...post,
          author_name: author?.name || "Unknown",
          author_avatar: author?.avatar,
          author_role: author?.role,
          comment_count: commentsArray.length,
          like_count: post.like_count || 0,
        };
      })
    );

    // Get upcoming events only
    const upcomingEvents = eventsArray.filter(
      (event: any) => new Date(event.event_date) >= new Date()
    );

    return NextResponse.json({
      club: {
        ...club,
        memberCount: membersArray.length,
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
