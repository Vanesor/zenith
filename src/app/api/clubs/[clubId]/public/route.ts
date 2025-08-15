import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    // Create a public Supabase client (no authentication required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { clubId } = await params;

    // First, let's see what clubs are available
    const { data: allClubs, error: allClubsError } = await supabase
      .from("clubs")
      .select("id, name");

    // Fetch club basic information (public data)
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        type,
        description,
        long_description,
        icon,
        color,
        coordinator_id,
        co_coordinator_id,
        secretary_id,
        media_id
      `)
      .eq("id", clubId)
      .single();

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: "Club not found", details: clubError?.message, availableClubs: allClubs },
        { status: 404 }
      );
    }

    // Fetch leadership team information
    const leadershipIds = [
      clubData.coordinator_id,
      clubData.co_coordinator_id,
      clubData.secretary_id,
      clubData.media_id,
    ].filter(Boolean);

    let leadership = {
      coordinator: null,
      coCoordinator: null,
      secretary: null,
      media: null,
    };

    if (leadershipIds.length > 0) {
      const { data: leadershipData } = await supabase
        .from("users")
        .select("id, name, email, avatar")
        .in("id", leadershipIds);

      if (leadershipData) {
        const leaderMap = leadershipData.reduce((acc: any, leader: any) => {
          acc[leader.id] = {
            name: leader.name,
            email: leader.email,
            photo: leader.avatar,
          };
          return acc;
        }, {});

        leadership = {
          coordinator: clubData.coordinator_id ? leaderMap[clubData.coordinator_id] || null : null,
          coCoordinator: clubData.co_coordinator_id ? leaderMap[clubData.co_coordinator_id] || null : null,
          secretary: clubData.secretary_id ? leaderMap[clubData.secretary_id] || null : null,
          media: clubData.media_id ? leaderMap[clubData.media_id] || null : null,
        };
      }
    }

    // Count club members (users who have this club_id)
    const { count: memberCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId);

    // Fetch upcoming events (public data)
    const { data: eventsData } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        event_date,
        event_time,
        location
      `)
      .eq("club_id", clubId)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(10);

    // Fetch recent posts (public data)
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        users!posts_author_id_fkey(full_name)
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Format the response data
    const response = {
      club: {
        id: clubData.id,
        name: clubData.name,
        type: clubData.type,
        description: clubData.description,
        long_description: clubData.long_description,
        icon: clubData.icon,
        color: clubData.color,
        memberCount: memberCount || 0,
        leadership,
      },
      events: eventsData?.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        location: event.location,
        attendeeCount: 0, // You can add this if you have attendance tracking
      })) || [],
      posts: postsData?.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        author_name: post.users?.full_name || "Anonymous",
      })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching public club data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
