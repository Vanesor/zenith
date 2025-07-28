import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Example API route using Supabase
 * 
 * GET /api/events?clubId={clubId}
 * POST /api/events with body { clubId, title, description, eventDate, eventTime, location }
 */
export async function GET(request) {
  try {
    // Extract the club ID from the URL or query parameters
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    
    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }

    // Use Supabase to get events
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_date,
        event_time,
        end_time,
        location,
        max_attendees,
        status,
        club_id,
        created_by,
        users (
          id,
          first_name,
          last_name
        )
      `)
      .eq('club_id', clubId)
      .order('event_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      clubId, 
      title, 
      description, 
      eventDate, 
      eventTime,
      endTime,
      location,
      maxAttendees,
      createdBy 
    } = data;
    
    // Validate required fields
    if (!clubId || !title || !eventDate || !eventTime || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Supabase to create a new event
    const supabase = createAdminClient();
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        club_id: clubId,
        title,
        description,
        event_date: eventDate,
        event_time: eventTime,
        end_time: endTime || null,
        location,
        max_attendees: maxAttendees || null,
        created_by: createdBy,
        status: 'upcoming'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notifications for club members
    const { data: clubMembers, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId);
      
    if (!membersError && clubMembers) {
      const notifications = clubMembers.map(member => ({
        user_id: member.user_id,
        title: 'New Event',
        message: `A new event "${title}" has been added to your club`,
        type: 'event',
        related_id: event.id,
        read: false
      }));
      
      // Batch insert notifications
      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
