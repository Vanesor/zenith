import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/lib/EmailService';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, assignmentName, dueDate, createdBy } = await request.json();

    if (!assignmentId || !assignmentName || !dueDate || !createdBy) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get assignment details and target users
    const assignmentResult = await db.query(
      `SELECT a.target_audience, a.club_id, u.name as creator_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    const assignment = assignmentResult.rows[0];
    const { target_audience, club_id, creator_name } = assignment;

    let targetUsers = [];

    // Determine target users based on assignment audience
    if (target_audience === 'club') {
      // Get all club members
      const clubMembersResult = await db.query(
        `SELECT u.email, u.name 
         FROM users u 
         JOIN club_members cm ON u.id = cm.user_id 
         WHERE cm.club_id = $1 AND u.email_verified = true`,
        [club_id]
      );
      targetUsers = clubMembersResult.rows;
    } else if (target_audience === 'all_clubs') {
      // Get all users from all clubs
      const allUsersResult = await db.query(
        `SELECT email, name FROM users WHERE club_id IS NOT NULL AND email_verified = true`
      );
      targetUsers = allUsersResult.rows;
    } else if (target_audience === 'specific_clubs') {
      // Get users from specific clubs (assuming club_id contains multiple clubs as JSON)
      const specificClubsResult = await db.query(
        `SELECT u.email, u.name 
         FROM users u 
         WHERE u.club_id = ANY($1) AND u.email_verified = true`,
        [Array.isArray(club_id) ? club_id : [club_id]]
      );
      targetUsers = specificClubsResult.rows;
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No target users found for this assignment',
        emailsSent: 0
      });
    }

    // Send emails to all target users
    let emailsSent = 0;
    const emailPromises = targetUsers.map(async (user: any) => {
      try {
        const emailData = {
          email: user.email,
          assignment_name: assignmentName,
          due_date: dueDate,
          created_by: creator_name,
          assignment_id: assignmentId
        };

        const sent = await EmailService.sendAssignmentNotification(emailData);
        if (sent) emailsSent++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Assignment notifications sent to ${emailsSent} out of ${targetUsers.length} users`,
      emailsSent,
      totalTargetUsers: targetUsers.length
    });

  } catch (error) {
    console.error('Error sending assignment notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
