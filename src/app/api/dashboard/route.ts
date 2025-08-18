import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database-service';
import { verifyAuth } from "@/lib/AuthMiddleware";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  // Debug auth headers and cookies
  console.log("Dashboard API - Auth header:", request.headers.get("authorization") ? "Present" : "Missing");
  console.log("Dashboard API - Cookie token:", request.cookies.get("zenith-token") ? "Present" : "Missing");
  
  // Verify authentication
  const authResult = await verifyAuth(request);
  
  if (!authResult.success) {
    try {
      // If token expired but we generated a new one from refresh token
      if (authResult.error?.includes("expired") && authResult.newToken) {
        // Create a response with the new token
        const response = NextResponse.json({
          tokenRefreshed: true,
          message: "Token refreshed successfully"
        });
        
        // Set the new token as a cookie
        response.cookies.set('zenith-token', authResult.newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60, // 24 hours
        });
        
        return response;
      }
      
      // If the session is invalid but we have a valid token, create a new session
      if (authResult.error === "Session expired or invalid") {
        // Try to extract user info from the token
        const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                     request.cookies.get("zenith-token")?.value;
        
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            
            if (decoded && decoded.userId) {
              // Generate a new session token
              const sessionToken = `zenith_${Date.now()}_${Math.random().toString(36).substring(2)}`;
              
              // Create a new session in the database
              try {
                await db.$executeRaw`
                  INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address, last_active_at)
                  VALUES (
                    ${decoded.userId}::uuid,
                    ${sessionToken},
                    NOW() + INTERVAL '24 hours',
                    ${request.headers.get('user-agent') || 'Unknown'},
                    ${request.headers.get('x-forwarded-for') || '127.0.0.1'},
                    NOW()
                  )
                `;
                
                console.log("Created new session for user:", decoded.userId);
                
                // Continue with request using the decoded user info
                const user = {
                  id: decoded.userId,
                  email: decoded.email,
                  role: decoded.role,
                  sessionId: sessionToken
                };
                
                // Set the session cookie
                const response = NextResponse.json({
                  sessionRestored: true,
                  message: "Session restored successfully"
                });
                
                response.cookies.set('zenith-session', sessionToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                  maxAge: 24 * 60 * 60, // 24 hours
                });
                
                return response;
              } catch (dbError) {
                console.error("Failed to create new session:", dbError);
              }
            }
          } catch (jwtError) {
            console.error("Failed to verify token for session creation:", jwtError);
          }
        }
      }
    } catch (error) {
      console.error("Error handling authentication failure:", error);
    }
    
    console.log("Dashboard API - Auth failed:", authResult.error);
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Log if this is a trusted device
  if (authResult.trustedDevice) {
    console.log("Dashboard API - User is on a trusted device");
  }
  
  const userId = authResult.user!.id;
  try {
    // Get all clubs with member counts and upcoming eventsd
    const clubsResult = await db.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT CASE WHEN e.event_date >= CURRENT_DATE THEN e.id END) as upcoming_events
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY c.name
    `;
    
    // Get the current user's club information
    const userClubQuery = await db.$queryRaw`
      SELECT club_id FROM users WHERE id = ${userId}::uuid
    `;

    // Get recent announcements
    const announcementsResult = await db.$queryRaw`
      SELECT 
        a.id,
        a.title,
        a.content,
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
    `;

    // Get upcoming events - use a different approach with Prisma
    let eventsResult = [];
    
    try {
      // First try with prisma client functions instead of raw query
      const events = await db.events.findMany({
        where: {
          event_date: {
            gte: new Date()
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          event_date: true,
          event_time: true,
          location: true,
          image_url: true,
          clubs: {
            select: {
              name: true,
              color: true,
              icon: true
            }
          }
        },
        orderBy: {
          event_date: 'asc'
        },
        take: 5
      });
      
      // Map to match the expected structure
      eventsResult = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        event_time: event.event_time,
        location: event.location,
        image_url: event.image_url,
        club_name: event.clubs?.name || 'General',
        club_color: event.clubs?.color || '#888888',
        club_icon: event.clubs?.icon || 'calendar'
      }));
    } catch (eventError) {
      console.error("Error fetching events with Prisma client:", eventError);
      // Fallback to a simpler query if the complex one fails
      try {
        const simpleEvents = await db.$queryRaw`
          SELECT id, title, description, event_date, location, image_url
          FROM events
          WHERE event_date >= CURRENT_DATE
          ORDER BY event_date ASC
          LIMIT 5
        `;
        
        eventsResult = Array.isArray(simpleEvents) ? simpleEvents : [];
      } catch (fallbackError) {
        console.error("Fallback event query also failed:", fallbackError);
        eventsResult = []; // Empty array as last resort
      }
    }

    // Get recent posts
    const postsResult = await db.$queryRaw`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        u.name as author_name,
        u.avatar as author_avatar,
        c.name as club_name,
        c.color as club_color,
        c.icon as club_icon
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `;

    // Get the user's club_id - Prisma returns array directly
    const userClubId = Array.isArray(userClubQuery) && userClubQuery.length > 0 
      ? userClubQuery[0].club_id 
      : null;

    // Type assertions to work with Prisma's return types
    const clubs = clubsResult as any[];
    const announcements = announcementsResult as any[];
    const events = eventsResult as any[];
    const posts = postsResult as any[];

    return NextResponse.json({
      userClubId: userClubId, // Add user's club ID directly in the response
      clubs: clubs.map((club) => ({
        id: club.id,
        name: club.name,
        type: club.type,
        description: club.description,
        icon: club.icon,
        color: club.color,
        member_count: parseInt(club.member_count),
        upcoming_events: parseInt(club.upcoming_events),
      })),
      announcements: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        created_at: announcement.created_at,
        club_name: announcement.club_name,
        club_color: announcement.club_color,
        author_name: announcement.author_name,
      })),
      upcomingEvents: events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.event_date,
        time: event.event_time,
        location: event.location,
        image_url: event.image_url,
        club_name: event.club_name,
        club_color: event.club_color,
        club_icon: event.club_icon,
      })),
      recentPosts: posts.map((post) => ({
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
    
    // Return more specific error information to help debug
    let errorMessage = "Failed to fetch dashboard data";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        errorMessage = `Schema error: ${error.message}`;
        console.error("Schema mismatch detected. Please check database schema and queries.");
      } else if (error.message.includes("operator does not exist")) {
        errorMessage = `Type casting error: ${error.message}`;
        console.error("Type casting error. Please check parameter types in queries.");
      }
    }
    
    // Return basic information to client but detailed logs for server
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
