import Database from "@/lib/database";

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: "announcement" | "event" | "assignment" | "comment" | "like" | "system";
  related_id?: string;
  read?: boolean;
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
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }
}
