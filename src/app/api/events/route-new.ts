import { NextRequest, NextResponse } from "next/server";
import DatabaseClient from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

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
      let events;
      
      if (clubId) {
        console.log('📅 Fetching events for club:', clubId);
        events = await DatabaseClient.getEventsByClub(clubId);
      } else {
        console.log('📅 Fetching all events');
        events = await DatabaseClient.getAllEvents();
      }

      // Apply limit if specified
      if (limit && events.length > limit) {
        events = events.slice(0, limit);
      }

      console.log('✅ Found', events.length, 'events');
      
      return NextResponse.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (dbError) {
      console.error('❌ Database error in events API:', dbError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Events API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, event_date, event_time, location, club_id } = body;

    // Validate required fields
    if (!title || !event_date || !event_time || !location || !club_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const eventId = require('crypto').randomUUID();
      
      const result = await DatabaseClient.query(`
        INSERT INTO events (id, title, description, event_date, event_time, location, club_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [eventId, title, description || null, event_date, event_time, location, club_id, 'upcoming']);

      console.log('✅ Event created successfully:', result.rows[0].id);

      return NextResponse.json({
        success: true,
        data: result.rows[0]
      });
    } catch (dbError) {
      console.error('❌ Database error creating event:', dbError);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Events POST API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
