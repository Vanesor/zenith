import Database from "@/lib/database";
import emailService from "./EmailService";

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: "announcement" | "event" | "assignment" | "comment" | "like" | "system";
  related_id?: string;
  read?: boolean;
}

export interface NotificationPreferences {
  email: {
    assignments: boolean;
    events: boolean;
    discussions: boolean;
    results: boolean;
  };
}

export class NotificationService {
  static async createNotification(data: NotificationData): Promise<void> {
    try {
      await Database.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          data.user_id,
          data.title,
          data.message,
          data.type,
          data.related_id || null,
          data.read !== undefined ? data.read : data.read || false,
        ]
      );
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  static async createBulkNotifications(
    notifications: NotificationData[]
  ): Promise<void> {
    try {
      const values = notifications
        .map((notif, index) => {
          const base = index * 6;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
            base + 5
          }, $${base + 6})`;
        })
        .join(", ");

      const params = notifications.flatMap((notif) => [
        notif.user_id,
        notif.title,
        notif.message,
        notif.type,
        notif.related_id || null,
        notif.read !== undefined ? notif.read : notif.read || false,
      ]);

      await Database.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, read) 
         VALUES ${values}`,
        params
      );
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
    }
  }

  // Notification templates
  static async notifyCommentOnPost(
    postId: string,
    postAuthorId: string,
    commenterName: string
  ): Promise<void> {
    if (postAuthorId) {
      await this.createNotification({
        user_id: postAuthorId,
        title: "New Comment",
        message: `${commenterName} commented on your post`,
        type: "comment",
        related_id: postId,
      });
    }
  }

  static async notifyLikeOnPost(
    postId: string,
    postAuthorId: string,
    likerName: string
  ): Promise<void> {
    if (postAuthorId) {
      await this.createNotification({
        user_id: postAuthorId,
        title: "Post Liked",
        message: `${likerName} liked your post`,
        type: "like",
        related_id: postId,
      });
    }
  }

  static async notifyLikeOnComment(
    commentId: string,
    commentAuthorId: string,
    likerName: string
  ): Promise<void> {
    if (commentAuthorId) {
      await this.createNotification({
        user_id: commentAuthorId,
        title: "Comment Liked",
        message: `${likerName} liked your comment`,
        type: "like",
        related_id: commentId,
      });
    }
  }

  static async notifyAssignmentCreated(
    assignmentId: string,
    memberIds: string[],
    clubName: string
  ): Promise<void> {
    const notifications = memberIds.map((memberId) => ({
      user_id: memberId,
      title: "New Assignment",
      message: `New assignment posted in ${clubName}`,
      type: "assignment" as const,
      related_id: assignmentId,
    }));

    await this.createBulkNotifications(notifications);
  }

  static async notifyEventCreated(
    eventId: string,
    memberIds: string[],
    eventTitle: string
  ): Promise<void> {
    const notifications = memberIds.map((memberId) => ({
      user_id: memberId,
      title: "New Event",
      message: `New event: ${eventTitle}`,
      type: "event" as const,
      related_id: eventId,
    }));

    await this.createBulkNotifications(notifications);
  }

  static async notifyAnnouncement(
    memberIds: string[],
    title: string,
    message: string
  ): Promise<void> {
    const notifications = memberIds.map((memberId) => ({
      user_id: memberId,
      title: title,
      message: message,
      type: "announcement" as const,
    }));

    await this.createBulkNotifications(notifications);
  }

  static async notifyChatRoomCreated(
    roomId: string,
    roomName: string,
    creatorId: string,
    roomType: 'public' | 'private' | 'club',
    memberIds: string[],
    clubId?: string
  ): Promise<void> {
    const filteredMembers = memberIds.filter(id => id !== creatorId);
    let title: string;
    let message: string;

    switch(roomType) {
      case 'public':
        title = 'New Public Chat Room';
        message = `A new public chat room "${roomName}" is now available`;
        break;
      case 'private':
        title = 'Added to Private Chat';
        message = `You were added to a private chat room "${roomName}"`;
        break;
      case 'club':
        title = 'New Club Chat Room';
        message = `A new chat room "${roomName}" was created for your club`;
        break;
    }

    // Notify members
    if (filteredMembers.length > 0) {
      const notifications = filteredMembers.map((memberId) => ({
        user_id: memberId,
        title: title,
        message: message,
        type: "system" as const,
        related_id: roomId,
      }));
      
      await this.createBulkNotifications(notifications);
    }
    
    // Notify creator
    await this.createNotification({
      user_id: creatorId,
      title: 'Chat Room Created',
      message: `You successfully created the chat room "${roomName}"`,
      type: 'system',
      related_id: roomId,
    });
  }
  
  /**
   * Delete old notifications (older than 1 month)
   */
  static async deleteOldNotifications(): Promise<number> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const result = await Database.query(
        `DELETE FROM notifications 
         WHERE created_at < $1
         RETURNING id`,
        [oneMonthAgo.toISOString()]
      );
      
      console.log(`Deleted ${result.rowCount} old notifications`);
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error deleting old notifications:", error);
      return 0;
    }
  }
      
  /**
   * Send assignment notification to all club members
   */
  static async sendAssignmentNotification(
    assignmentId: string,
    assignmentTitle: string,
    clubId?: string
  ): Promise<void> {
    try {
      let clubName = "All Clubs";
      let userQuery: string;
      let queryParams: any[] = [];
      
      if (clubId) {
        // Get club name
        const clubResult = await Database.query(
          "SELECT name FROM clubs WHERE id = $1",
          [clubId]
        );
        
        if (clubResult.rows.length > 0) {
          clubName = clubResult.rows[0].name;
        }
        
        // Get users from specific club
        userQuery = `
          SELECT u.id, u.name, u.email, u.notification_preferences
          FROM users u
          WHERE u.club_id = $1 AND u.email_verified = true
        `;
        queryParams = [clubId];
      } else {
        // Get all users
        userQuery = `
          SELECT u.id, u.name, u.email, u.notification_preferences
          FROM users u
          WHERE u.email_verified = true
        `;
        queryParams = [];
      }
      
      // Query for assignment details
      const assignmentResult = await Database.query(
        "SELECT title, due_date FROM assignments WHERE id = $1",
        [assignmentId]
      );
      
      if (assignmentResult.rows.length === 0) {
        console.error(`Assignment ${assignmentId} not found`);
        return;
      }
      
      const assignment = assignmentResult.rows[0];
      const dueDate = new Date(assignment.due_date).toLocaleDateString();
      
      // Get all relevant users
      const usersResult = await Database.query(userQuery, queryParams);
      
      // Send notification to each user
      for (const user of usersResult.rows) {
        // Skip if user has disabled assignment notifications
        const preferences = user.notification_preferences as NotificationPreferences;
        if (preferences?.email?.assignments === false) {
          continue;
        }
        
        // Send email notification
        await emailService.sendAssignmentNotification(
          user.email,
          user.name,
          assignmentTitle,
          dueDate,
          clubId ? clubName : undefined
        );

        // Create in-app notification
        await this.createNotification({
          user_id: user.id,
          title: "New Assignment",
          message: `A new assignment "${assignmentTitle}" is available${clubId ? ` for ${clubName}` : ''}`,
          type: "assignment",
          related_id: assignmentId,
        });
      }
      
      // Update assignment with notification sent flag
      await Database.query(
        "UPDATE assignments SET notification_sent = true, notification_sent_at = NOW() WHERE id = $1",
        [assignmentId]
      );
    } catch (error) {
      console.error("Error sending assignment notifications:", error);
    }
  }
  
  /**
   * Send assignment results notification to specific user
   */
  static async sendAssignmentResultNotification(
    userId: string,
    assignmentId: string
  ): Promise<void> {
    try {
      // Get user details
      const userResult = await Database.query(
        "SELECT name, email, notification_preferences FROM users WHERE id = $1",
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        console.error(`User ${userId} not found`);
        return;
      }
      
      const user = userResult.rows[0];
      
      // Skip if user has disabled result notifications
      const preferences = user.notification_preferences as NotificationPreferences;
      if (preferences?.email?.results === false) {
        return;
      }
      
      // Get assignment details
      const assignmentResult = await Database.query(
        "SELECT title FROM assignments WHERE id = $1",
        [assignmentId]
      );
      
      if (assignmentResult.rows.length === 0) {
        console.error(`Assignment ${assignmentId} not found`);
        return;
      }
      
      const assignment = assignmentResult.rows[0];
      
      // Get submission details
      const submissionResult = await Database.query(
        "SELECT total_score, grade FROM assignment_submissions WHERE user_id = $1 AND assignment_id = $2",
        [userId, assignmentId]
      );
      
      let scoreText = undefined;
      if (submissionResult.rows.length > 0) {
        const submission = submissionResult.rows[0];
        if (submission.grade) {
          scoreText = submission.grade;
        } else if (submission.total_score !== null) {
          scoreText = `${submission.total_score} points`;
        }
      }
      
      // Send email notification
      await emailService.sendAssignmentResultNotification(
        user.email,
        user.name,
        assignment.title,
        scoreText
      );

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: "Assignment Results Available",
        message: `Results for "${assignment.title}" are now available`,
        type: "assignment",
        related_id: assignmentId,
      });
    } catch (error) {
      console.error("Error sending assignment result notification:", error);
    }
  }
  
  /**
   * Send event notification to all club members
   */
  static async sendEventNotification(
    eventId: string,
    clubId?: string
  ): Promise<void> {
    try {
      let clubName = "All Clubs";
      let userQuery: string;
      let queryParams: any[] = [];
      
      if (clubId) {
        // Get club name
        const clubResult = await Database.query(
          "SELECT name FROM clubs WHERE id = $1",
          [clubId]
        );
        
        if (clubResult.rows.length > 0) {
          clubName = clubResult.rows[0].name;
        }
        
        // Get users from specific club
        userQuery = `
          SELECT u.id, u.name, u.email, u.notification_preferences
          FROM users u
          WHERE u.club_id = $1 AND u.email_verified = true
        `;
        queryParams = [clubId];
      } else {
        // Get all users
        userQuery = `
          SELECT u.id, u.name, u.email, u.notification_preferences
          FROM users u
          WHERE u.email_verified = true
        `;
        queryParams = [];
      }
      
      // Query for event details
      const eventResult = await Database.query(
        "SELECT title, event_date, event_time, location FROM events WHERE id = $1",
        [eventId]
      );
      
      if (eventResult.rows.length === 0) {
        console.error(`Event ${eventId} not found`);
        return;
      }
      
      const event = eventResult.rows[0];
      const eventDate = new Date(event.event_date).toLocaleDateString();
      const formattedDate = `${eventDate} at ${event.event_time}`;
      
      // Get all relevant users
      const usersResult = await Database.query(userQuery, queryParams);
      
      // Send notification to each user
      for (const user of usersResult.rows) {
        // Skip if user has disabled event notifications
        const preferences = user.notification_preferences as NotificationPreferences;
        if (preferences?.email?.events === false) {
          continue;
        }
        
        // Send email notification
        await emailService.sendEventNotification(
          user.email,
          user.name,
          event.title,
          formattedDate,
          event.location,
          clubId ? clubName : undefined
        );

        // Create in-app notification
        await this.createNotification({
          user_id: user.id,
          title: "New Event",
          message: `New event "${event.title}" on ${formattedDate}${clubId ? ` for ${clubName}` : ''}`,
          type: "event",
          related_id: eventId,
        });
      }
      
      // Update event with notification sent flag
      await Database.query(
        "UPDATE events SET notification_sent = true, notification_sent_at = NOW() WHERE id = $1",
        [eventId]
      );
    } catch (error) {
      console.error("Error sending event notifications:", error);
    }
  }
  
  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      await Database.query(
        "UPDATE users SET notification_preferences = $1 WHERE id = $2",
        [preferences, userId]
      );
      
      return true;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }
  }
}
