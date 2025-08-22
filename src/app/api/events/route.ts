import { NextRequest, NextResponse } from "next/server";
import db from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";
import AuditLogger from "@/lib/audit-logger";

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
        const result = await db.query(
          `SELECT e.*, c.name as club_name 
           FROM events e 
           LEFT JOIN clubs c ON e.club_id = c.id 
           WHERE e.club_id = $1 
           ORDER BY e.event_date ASC`,
          [clubId]
        );
        events = result.rows;
      } else {
        console.log('📅 Fetching all events');
        const result = await db.query(
          `SELECT e.*, c.name as club_name 
           FROM events e 
           LEFT JOIN clubs c ON e.club_id = c.id 
           ORDER BY e.event_date ASC`
        );
        events = result.rows;
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

    const userId = authResult.user!.id;
    const body = await request.json();
    const { 
      title, 
      description, 
      event_date, 
      location, 
      club_id,
      max_attendees,
      registration_required,
      is_public,
      event_type,
      tags,
      banner_url
    } = body;

    // Validate required fields
    if (!title || !event_date || !location || !club_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const eventId = require('crypto').randomUUID();
      
      const result = await db.query(`
        INSERT INTO events (
          id, title, description, event_date, location, club_id, creator_id,
          max_attendees, registration_required, is_public, event_type, tags, banner_url,
          status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published', NOW(), NOW())
        RETURNING *
      `, [
        eventId, 
        title, 
        description || null, 
        event_date, 
        location, 
        club_id, 
        userId,
        max_attendees || null,
        registration_required || false,
        is_public !== false, // default to true
        event_type || 'workshop',
        tags ? JSON.stringify(tags) : null,
        banner_url || null
      ]);

      console.log('✅ Event created successfully:', result.rows[0].id);

      // Log audit event for event creation
      await AuditLogger.logEventAction(
        'create',
        eventId,
        userId,
        undefined, // no old values
        {
          title,
          description,
          event_date,
          location,
          club_id,
          max_attendees,
          registration_required,
          is_public,
          event_type,
          tags,
          banner_url,
          status: 'published'
        },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      );

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
