import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/lib/EmailService';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, projectId, creatorName, projectName } = await request.json();

    if (!email || !projectId || !creatorName || !projectName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email exists in users table
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User with this email does not exist in the system' },
        { status: 404 }
      );
    }

    // Generate invitation keys
    const { projectKey, accessKey } = EmailService.generateKeys();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update the existing project_invitations record or create new one
    await db.query(
      `INSERT INTO project_invitations (project_id, email, project_key, access_key, expires_at, project_password, status)
       VALUES ($1, $2, $3, $4, $5, '', 'pending')
       ON CONFLICT (project_id, email) 
       DO UPDATE SET 
         project_key = $3,
         access_key = $4,
         expires_at = $5,
         status = 'pending',
         sent_at = CURRENT_TIMESTAMP`,
      [projectId, email, projectKey, accessKey, expiresAt]
    );

    // Send invitation email
    const emailData = {
      email,
      project_id: projectId,
      project_name: projectName,
      creator_name: creatorName,
      project_key: projectKey,
      access_key: accessKey,
      expires_at: expiresAt
    };

    const emailSent = await EmailService.sendProjectInvitationEmail(emailData);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Project invitation sent successfully',
        projectKey,
        expiresAt: expiresAt.toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending project invitation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
