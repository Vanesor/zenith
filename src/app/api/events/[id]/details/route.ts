import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id]/details
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    // Get event with details
    const eventQuery = `
      SELECT 
        e.*,
        ed.guidelines,
        ed.prerequisites,
        ed.resources,
        ed.agenda,
        ed.speakers,
        ed.sponsors,
        ed.prizes,
        ed.faq,
        ed.contact_info,
        ed.social_links,
        c.name as club_name,
        c.color as club_color,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'registered') as registration_count
      FROM events e
      LEFT JOIN event_details ed ON e.id = ed.event_id
      LEFT JOIN clubs c ON e.club_id = c.id
      WHERE e.id = $1
    `;

    const eventResult = await db.query(eventQuery, [id]);

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Get recent registrations
    const recentRegistrationsQuery = `
      SELECT 
        er.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.role as user_role
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at DESC
      LIMIT 10
    `;

    const registrationsResult = await db.query(recentRegistrationsQuery, [
      id,
    ]);

    return NextResponse.json({
      event,
      recent_registrations: registrationsResult.rows,
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch event details" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/details - Update event details
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const {
      guidelines,
      prerequisites,
      resources,
      agenda,
      speakers,
      sponsors,
      prizes,
      faq,
      contact_info,
      social_links,
    } = await request.json();

    // Check if event details exist
    const existingQuery = "SELECT id FROM event_details WHERE event_id = $1";
    const existingResult = await db.query(existingQuery, [id]);

    let query: string;
    let queryParams: (string | string[] | object | null)[];

    if (existingResult.rows.length > 0) {
      // Update existing details
      query = `
        UPDATE event_details 
        SET guidelines = COALESCE($1, guidelines),
            prerequisites = COALESCE($2, prerequisites),
            resources = COALESCE($3, resources),
            agenda = COALESCE($4, agenda),
            speakers = COALESCE($5, speakers),
            sponsors = COALESCE($6, sponsors),
            prizes = COALESCE($7, prizes),
            faq = COALESCE($8, faq),
            contact_info = COALESCE($9, contact_info),
            social_links = COALESCE($10, social_links),
            updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $11
        RETURNING *
      `;
      queryParams = [
        guidelines,
        prerequisites,
        resources,
        agenda,
        speakers,
        sponsors,
        prizes,
        faq,
        contact_info,
        social_links,
        id,
      ];
    } else {
      // Insert new details
      query = `
        INSERT INTO event_details (
          event_id, guidelines, prerequisites, resources, agenda,
          speakers, sponsors, prizes, faq, contact_info, social_links
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      queryParams = [
        id,
        guidelines,
        prerequisites,
        resources,
        agenda,
        speakers,
        sponsors,
        prizes,
        faq,
        contact_info,
        social_links,
      ];
    }

    const result = await db.query(query, queryParams);

    return NextResponse.json({ event_details: result.rows[0] });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to update event details" },
      { status: 500 }
    );
  }
}
