import Database from "@/lib/database";
import emailService from "./EmailService";

export interface NotificationPreferences {
  email: {
    assignments: boolean;
    events: boolean;
    discussions: boolean;
    results: boolean;
  };
}

export class NotificationService {

  // Email notification templates
  static async notifyCommentOnPost(
    postId: string,
    postAuthorId: string,
    commenterName: string
  ): Promise<void> {
    // This functionality is now handled via email
    // Implementation will be added if needed
    console.log(`Comment notification would be sent for post ${postId}`);
  }

  static async notifyLikeOnPost(
    postId: string,
    postAuthorId: string,
    likerName: string
  ): Promise<void> {
    // This functionality is now handled via email
    // Implementation will be added if needed
    console.log(`Like notification would be sent for post ${postId}`);
  }

  static async notifyLikeOnComment(
    commentId: string,
    commentAuthorId: string,
    likerName: string
  ): Promise<void> {
    // This functionality is now handled via email
    // Implementation will be added if needed
    console.log(`Like notification would be sent for comment ${commentId}`);
  }

  static async notifyAssignmentCreated(
    assignmentId: string,
    memberIds: string[],
    clubName: string
  ): Promise<void> {
    console.log(`Assignment notification would be sent for ${memberIds.length} members`);
    // This is now handled by sendAssignmentNotification method
    // which sends emails directly
  }

  static async notifyEventCreated(
    eventId: string,
    memberIds: string[],
    eventTitle: string
  ): Promise<void> {
    console.log(`Event notification would be sent for ${memberIds.length} members`);
    // This is now handled by sendEventNotification method
    // which sends emails directly
  }

  static async notifyAnnouncement(
    memberIds: string[],
    title: string,
    message: string
  ): Promise<void> {
    console.log(`Announcement would be sent for ${memberIds.length} members`);
    // This functionality is now handled via email
    // Implementation will be added if needed
  }

  static async notifyChatRoomCreated(
    roomId: string,
    roomName: string,
    creatorId: string,
    roomType: 'public' | 'private' | 'club',
    memberIds: string[],
    clubId?: string
  ): Promise<void> {
    console.log(`Chat room creation notification would be sent for ${memberIds.length} members`);
    // This functionality is now handled via email
    // Implementation will be added if needed
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
      }
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
      }
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
