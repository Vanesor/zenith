import { NextResponse } from "next/server";
import Database from "@/lib/database";

export async function GET() {
  try {
    // Get all clubs with member counts and upcoming events
    const clubsResult = await Database.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT CASE WHEN e.date >= CURRENT_DATE THEN e.id END) as upcoming_events
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY c.name
    `);

    // Get recent announcements
    const announcementsResult = await Database.query(`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.type,
        a.priority,
        a.created_at,
        c.name as club_name,
        c.color as club_color,
        u.name as author_name
      FROM announcements a
      LEFT JOIN clubs c ON a.club_id = c.id
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    // Get upcoming events
    const eventsResult = await Database.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.location,
        c.name as club_name,
        c.color as club_color,
        u.name as organizer_name
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.date >= CURRENT_DATE
      ORDER BY e.date ASC, e.time ASC
      LIMIT 6
    `);

    // Get recent posts
    const postsResult = await Database.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        c.name as club_name,
        c.color as club_color,
        u.name as author_name
      FROM posts p
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 4
    `);

    return NextResponse.json({
      clubs: clubsResult.rows.map((club) => ({
        id: club.id,
        name: club.name,
        type: club.type,
        description: club.description,
        icon: club.icon,
        color: club.color,
        member_count: parseInt(club.member_count),
        upcoming_events: parseInt(club.upcoming_events),
      })),
      announcements: announcementsResult.rows.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        created_at: announcement.created_at,
        club_name: announcement.club_name,
        club_color: announcement.club_color,
        author_name: announcement.author_name,
      })),
      upcomingEvents: eventsResult.rows.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        club_name: event.club_name,
        club_color: event.club_color,
        organizer_name: event.organizer_name,
      })),
      recentPosts: postsResult.rows.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        club_name: post.club_name,
        club_color: post.club_color,
        author_name: post.author_name,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
