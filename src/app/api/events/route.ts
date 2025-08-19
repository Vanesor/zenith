import { NextRequest, NextResponse } from "next/server";
import { db, findUserById, findAllEvents } from '@/lib/database-service';
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
      // Use the database service methods to fetch events
      const events = await findAllEvents({
        limit,
        where: clubId ? { club_id: clubId } : undefined
      });
      
      // Add attendance status information
      const eventsWithAttendance = await Promise.all(events.map(async event => {
        // Check if user is attending this event
        const attendance = await db.event_attendees.findFirst({
          where: {
            event_id: event.id,
            user_id: userId
          }
        });
        
        return {
          ...event,
          isAttending: !!attendance
        };
      }));
      
      // Handle BigInt serialization more efficiently
      const serializedEvents = eventsWithAttendance.map(event => {
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
      
      // Perform direct database query with proper relations
      const fallbackEvents = await db.events.findMany({
        orderBy: {
          event_date: 'desc'
        },
        include: {
          clubs: true,
          users: true, // This is the creator relation in the Prisma schema
          event_attendees: {
            where: {
              user_id: userId
            }
          }
        },
        where: clubId ? {
          club_id: clubId
        } : undefined,
        ...(limit ? { take: limit } : {})
      });
      
      // Add isAttending flag based on attendees
      const processedEvents = fallbackEvents.map(event => {
        // Transform to the expected format
        return {
          ...event,
          isAttending: event.event_attendees.length > 0,
          // Convert club object to simple string for frontend compatibility
          club: event.clubs?.name || "Unknown Club",
          // Add organizer info
          organizer: event.users?.name || "Unknown"
        };
      });
      
      return NextResponse.json(processedEvents);
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
    
    // Check if user has permission to create events
    const user = await findUserById(userId);
    
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

    // Create the event using the database service
    const eventData = await db.events.create({
      data: {
        title,
        description,
        event_date: new Date(date),
        event_time: startTime,
        location,
        club_id: userClubId,
        created_by: userId,
        max_attendees: maxAttendees || undefined,
        status: "upcoming",
        image_url: imageUrl || undefined
      }
    });
    
    const eventId = eventData.id;
    
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
    await db.notifications.create({
      data: {
        user_id: userId, // We'll use the creator's ID as a placeholder
        title: `New event created`,
        message: `A new event "${title}" has been scheduled for ${date}`,
        type: 'event',
        related_id: eventId,
        metadata: {
          eventId,
          clubId: userClubId,
          emailOnly: true, // Flag for email-only notification
          eventTitle: title,
          eventDate: date
        },
        delivery_method: 'email',
        club_id: userClubId
      }
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
