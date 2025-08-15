import { NextRequest, NextResponse } from "next/server";
import PrismaDB, { UUIDUtils } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";

export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const clubId = searchParams.get("clubId");
    
    // Parse limit if present
    const limit = limitParam ? parseInt(limitParam) : undefined;

    try {
      // Use optimized PrismaDB method for fetching events
      const events = await PrismaDB.getAllEvents(userId, limit, clubId || undefined);
      
      // Handle BigInt serialization more efficiently
      const serializedEvents = events.map(event => {
        // Create a new object with all properties processed
        return Object.fromEntries(
          Object.entries(event).map(([key, value]) => {
            // Convert BigInt to string, preserve other values
            if (typeof value === 'bigint') {
              // Explicitly cast value to BigInt to ensure TypeScript knows it has toString method
              return [key, (value as BigInt).toString()];
            }
            return [key, value];
          })
        );
      });
      
      return NextResponse.json(serializedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      
      // Fallback to using Prisma's standard methods if raw query fails
      const prisma = PrismaDB.getClient();
      
      const fallbackEvents = await prisma.event.findMany({
        orderBy: {
          event_date: 'desc'
        },
        include: {
          club: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        where: clubId ? {
          club_id: clubId
        } : undefined,
        ...(limit ? { take: limit } : {})
      });
      
      return NextResponse.json(fallbackEvents);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use centralized authentication system
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const userId = authResult.user!.id;
    
    // Check if user has permission to create events using PrismaDB
    const user = await PrismaDB.getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userRole = user.role;
    const userClubId = user.club_id;
    
    const allowedRoles = ["coordinator", "co_coordinator", "secretary", "president", "vice_president", "admin"];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    
    if (!userClubId) {
      return NextResponse.json({ error: "User not associated with any club" }, { status: 400 });
    }
    
    const body = await request.json();
    const {
      title,
      description,
      date,
      startTime,
      location,
      maxAttendees,
      imageUrl
    } = body;

    // Validate required fields
    if (!title || !date || !startTime || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the event using PrismaDB
    const eventId = await PrismaDB.createEvent({
      title,
      description,
      event_date: date,
      event_time: startTime,
      location,
      club_id: userClubId,
      created_by: userId,
      max_attendees: maxAttendees || undefined,
      status: "upcoming",
      image_url: imageUrl || undefined
    });
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }
    
    // Create notifications for club members using Prisma - modified to use only email notifications
    // Instead of creating notifications for each user, we'll create one notification template
    // that will be sent via email (as per user's request for email-only notifications)
    
    // Create a notification record for the event
    await PrismaDB.createNotification({
      user_id: userId, // We'll use the creator's ID as a placeholder
      title: `New event created`,
      message: `A new event "${title}" has been scheduled for ${date}`,
      type: 'event',
      data: {
        eventId,
        clubId: userClubId,
        emailOnly: true, // Flag for email-only notification
        eventTitle: title,
        eventDate: date
      },
      related_id: eventId
    });

    return NextResponse.json({ id: eventId, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
