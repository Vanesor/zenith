import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple email sending function (you can replace with your preferred service)
async function sendInvitationEmail(to: string, inviterName: string, inviteUrl: string, message?: string) {
  // This is a placeholder - integrate with your email service
  // Options: SendGrid, AWS SES, Resend, etc.
  console.log(`Sending invitation email to ${to}`);
  console.log(`Invite URL: ${inviteUrl}`);
  console.log(`Message: ${message || 'No message'}`);
  
  // For now, just return success
  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, inviteeEmail, inviterName, message } = body;
    const inviterId = request.headers.get('x-user-id') || '1'; // Mock user ID

    if (!roomId || !inviteeEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room ID and invitee email are required' 
      }, { status: 400 });
    }

    // Check if user is already in the room
    const { data: existingMember } = await supabase
      .from('chat_room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_email', inviteeEmail)
      .single();

    if (existingMember) {
      return NextResponse.json({ 
        success: false, 
        error: 'User is already a member of this room' 
      }, { status: 400 });
    }

    // Generate invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('chat_invitations')
      .insert({
        room_id: roomId,
        inviter_id: inviterId,
        invitee_email: inviteeEmail,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        message: message || null
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invitation creation error:', inviteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create invitation' 
      }, { status: 500 });
    }

    // Send invitation email
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/chat/invite/${invitationToken}`;
      await sendInvitationEmail(inviteeEmail, inviterName || 'Someone', inviteUrl, message);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitationToken,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get pending invitations for a room
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    
    if (!roomId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room ID is required' 
      }, { status: 400 });
    }

    const { data: invitations, error } = await supabase
      .from('chat_invitations')
      .select(`
        id, invitee_email, created_at, expires_at, status,
        inviter:users!chat_invitations_inviter_id_fkey(name)
      `)
      .eq('room_id', roomId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch invitations' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.invitee_email,
        inviter: (inv as any).inviter?.name || 'Unknown',
        created_at: inv.created_at,
        expires_at: inv.expires_at
      }))
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
