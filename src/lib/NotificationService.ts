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
          data.read || false,
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
        notif.read || false,
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
}
