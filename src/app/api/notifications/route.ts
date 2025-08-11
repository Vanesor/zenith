import { NextRequest, NextResponse } from "next/server";

// Email notifications only - no in-app notifications API needed
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "In-app notifications are not supported. Only email notifications are available." },
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received email notification request:', body);
    
    const { title, message, type, club_id, recipient_emails } = body;

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, and type are required" },
        { status: 400 }
      );
    }

    // Validate recipients
    if (!club_id && (!recipient_emails || recipient_emails.length === 0)) {
      return NextResponse.json(
        { error: "Either club_id or recipient_emails must be provided" },
        { status: 400 }
      );
    }

    // TODO: Implement email sending logic
    if (club_id) {
      console.log('Club-wide email notification requested for club:', club_id);
      // TODO: Get club member emails and send
    } else {
      console.log('Sending emails to specific recipients:', recipient_emails);
      // TODO: Send emails to specific recipients
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email notification sent successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error sending email notification:", error);
    return NextResponse.json(
      { error: "Failed to send email notification" },
      { status: 500 }
    );
  }
}
