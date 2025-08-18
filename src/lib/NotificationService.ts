import { prismaClient as prisma } from "./database";
import emailServiceV2 from "./EmailServiceV2";

export interface NotificationPreferences {
  email: {
    assignments: boolean;
    events: boolean;
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
        const club = await db.clubs.findUnique({
          where: { id: clubId },
          select: { name: true }
        });
        
        if (club) {
          clubName = club.name;
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
      const assignment = await db.assignments.findUnique({
        where: { id: assignmentId },
        select: { title: true, due_date: true }
      });
      
      if (!assignment) {
        console.error(`Assignment ${assignmentId} not found`);
        return;
      }
      
      const dueDate = new Date(assignment.due_date).toLocaleDateString();
      
      // Get all relevant users
      const usersResult = await db.$queryRawUnsafe(userQuery, ...queryParams) as any[];
      
      // Send notification to each user
      for (const user of usersResult) {
        // Skip if user has disabled assignment notifications
        const preferences = user.notification_preferences as NotificationPreferences;
        if (preferences?.email?.assignments === false) {
          continue;
        }
        
        // Send email notification
        await emailServiceV2.sendAssignmentNotification(
          user.email,
          user.name,
          assignmentTitle,
          dueDate,
          clubId ? clubName : undefined,
          assignmentId
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
      const user = await db.users.findUnique({
        where: { id: userId },
        select: { 
          name: true, 
          email: true, 
          notification_preferences: true 
        }
      });
      
      if (!user) {
        console.error(`User ${userId} not found`);
        return;
      }
      
      // Skip if user has disabled result notifications
      const preferences = user.notification_preferences as unknown as NotificationPreferences;
      if (preferences?.email?.results === false) {
        return;
      }
      
      // Get assignment details
      const assignment = await db.assignments.findUnique({
        where: { id: assignmentId },
        select: { title: true }
      });
      
      if (!assignment) {
        console.error(`Assignment ${assignmentId} not found`);
        return;
      }
      
      // Get submission details
      const submission = await db.assignment_submissions.findFirst({
        where: {
          user_id: userId,
          assignment_id: assignmentId
        },
        select: {
          total_score: true,
          status: true
        }
      });
      
      let scoreText = undefined;
      if (submission) {
        // Use status as grade if it contains a grade value (like "A", "B+", etc.)
        if (submission.status && !["submitted", "graded", "pending", "reviewing"].includes(submission.status)) {
          scoreText = submission.status;
        } else if (submission.total_score !== null) {
          scoreText = `${submission.total_score} points`;
        }
      }
      
      // Send email notification
      await emailServiceV2.sendAssignmentResultNotification(
        user.email,
        user.name,
        assignment.title,
        scoreText,
        assignmentId
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
        const club = await db.clubs.findUnique({
          where: { id: clubId },
          select: { name: true }
        });
        
        if (club) {
          clubName = club.name;
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
      const event = await db.events.findUnique({
        where: { id: eventId },
        select: { 
          title: true, 
          event_date: true, 
          event_time: true, 
          location: true 
        }
      });
      
      if (!event) {
        console.error(`Event ${eventId} not found`);
        return;
      }
      
      const eventDate = new Date(event.event_date).toLocaleDateString();
      const formattedDate = `${eventDate} at ${event.event_time}`;
      
      // Get all relevant users
      const usersResult = await db.$queryRawUnsafe(userQuery, ...queryParams) as any[];
      
      // Send notification to each user
      for (const user of usersResult) {
        // Skip if user has disabled event notifications
        const preferences = user.notification_preferences as unknown as NotificationPreferences;
        if (preferences?.email?.events === false) {
          continue;
        }
        
        // Send email notification using EmailNotificationService
        // TODO: Implement sendEventNotification in EmailServiceV2
        console.log(`Event notification needed for ${user.email}: ${event.title}`);
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
      await db.users.update({
        where: { id: userId },
        data: { 
          notification_preferences: preferences as any 
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }
  }
}
