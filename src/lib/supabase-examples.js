import { supabase, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Example server action to get a user's profile
 */
export async function getUser(id) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { user: data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Example server action to get a club's details with members
 */
export async function getClubWithMembers(clubId) {
  try {
    // Get club details
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;

    // Get club members
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select(`
        id,
        role,
        joined_at,
        users (
          id,
          first_name,
          last_name,
          email,
          profile_image
        )
      `)
      .eq('club_id', clubId);

    if (membersError) throw membersError;

    return { 
      club, 
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        joined_at: m.joined_at,
        user: m.users
      }))
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Example server action to create a new post
 */
export async function createPost({ title, content, clubId, authorId }) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        club_id: clubId,
        author_id: authorId
      })
      .select()
      .single();

    if (error) throw error;
    return { post: data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Example API route to get all events for a club
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

    // Get events for the club
    const { data: events, error } = await supabase
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
        status
      `)
      .eq('club_id', clubId)
      .order('event_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Example API route to create a notification
 */
export async function POST(request) {
  try {
    const requestData = await request.json();
    const { userId, title, message, type, relatedId } = requestData;
    
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Use admin client for privileged operations
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return NextResponse.json({ notification: data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Example server component that fetches data from Supabase
 */
export async function EventsPage({ params }) {
  const { clubId } = params;
  
  // Get the club and its events
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .single();
    
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      event_date,
      event_time,
      location,
      status,
      users (
        id, 
        first_name,
        last_name
      )
    `)
    .eq('club_id', clubId)
    .order('event_date', { ascending: true });
    
  // Get the current user's session
  const cookieStore = cookies();
  const supabaseToken = cookieStore.get('sb-token')?.value;
  let currentUser = null;
  
  if (supabaseToken) {
    const { data: { user } } = await supabase.auth.getUser(supabaseToken);
    currentUser = user;
  }
  
  return {
    club,
    events,
    currentUser
  };
}
