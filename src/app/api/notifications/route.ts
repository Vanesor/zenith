import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = searchParams.get("limit");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const notifications = await Database.getNotificationsByUser(
      userId,
      limit ? parseInt(limit) : undefined
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received notification request:', body);
    
    const { title, message, type, delivery_method, club_id, recipient_ids } = body;

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, and type are required" },
        { status: 400 }
      );
    }

    // Validate delivery method
    const validDeliveryMethods = ['in-app', 'email', 'both'];
    if (delivery_method && !validDeliveryMethods.includes(delivery_method)) {
      return NextResponse.json(
        { error: "Invalid delivery method. Must be 'in-app', 'email', or 'both'" },
        { status: 400 }
      );
    }

    // Validate recipients
    if (!club_id && (!recipient_ids || recipient_ids.length === 0)) {
      return NextResponse.json(
        { error: "Either club_id or recipient_ids must be provided" },
        { status: 400 }
      );
    }

    // TODO: Verify user is coordinator and has permission to send to this club
    // This should be implemented based on your auth system

    let notifications = [];

    if (club_id) {
      // For club-wide notifications, we need to get all club members
      // TODO: Implement proper club member fetching after database migration
      // For now, we'll use a placeholder approach
      console.log('Club-wide notification requested for club:', club_id);
      
      // Create a system notification for now (this is temporary)
      const notification = await Database.createNotification({
        user_id: 'system', // Temporary placeholder
        title,
        message,
        type,
        read: false,
        data: {
          delivery_method: delivery_method || 'in-app',
          club_id,
          is_club_wide: true,
          // sent_by: currentUser.id, // TODO: Get from auth token
        },
      });
      notifications.push(notification);
    } else {
      // Send to specific users
      for (const user_id of recipient_ids) {
        const notification = await Database.createNotification({
          user_id,
          title,
          message,
          type,
          read: false,
          data: {
            delivery_method: delivery_method || 'in-app',
            // sent_by: currentUser.id, // TODO: Get from auth token
          },
        });
        notifications.push(notification);
      }
    }

    // TODO: Handle email sending if delivery_method is 'email' or 'both'
    if (delivery_method === 'email' || delivery_method === 'both') {
      console.log('Email delivery requested but not implemented yet');
      // Implementation would go here:
      // - Get user email addresses
      // - Send emails using email service
      // - Update notifications with email_sent status
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notification sent successfully to ${notifications.length} recipient(s)`,
      notifications 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    if (read) {
      await Database.markNotificationAsRead(notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    await Database.markNotificationAsRead(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
