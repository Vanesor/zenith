import emailServiceV2 from './EmailServiceV2';
import db from "./database";

/**
 * EmailNotificationService replaces in-app notifications with email-only notifications
 * This service should be used for sending all application notifications
 */
export class EmailNotificationService {
  /**
   * Send an event notification via email
   */
  static async sendEventNotification(
    userId: string,
    eventTitle: string,
    eventDate: string,
    eventDetails: string,
    eventId: string
  ): Promise<boolean> {
    try {
      // Get user email
      const userResult = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.error(`User not found for notification: ${userId}`);
        return false;
      }

      const user = userResult.rows[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const eventUrl = `${baseUrl}/events/${eventId}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0d1829; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
            <h1 style="color: #333; font-size: 24px;">Event Notification</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Hello ${user.name},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              This is a notification about the upcoming event: <strong>${eventTitle}</strong>
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Date: ${eventDate}
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              ${eventDetails}
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${eventUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Event Details
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
            &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
          </div>
        </div>
      `;

      return await emailServiceV2.sendEmail({
        to: user.email,
        subject: `Event Notification: ${eventTitle}`,
        html
      }, 'event-notification', eventId);

    } catch (error) {
      console.error('Error sending event notification email:', error);
      return false;
    }
  }

  /**
   * Send an assignment notification via email
   */
  static async sendAssignmentNotification(
    userId: string,
    assignmentTitle: string,
    dueDate: string,
    assignmentId: string
  ): Promise<boolean> {
    try {
      // Get user email
      const userResult = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.error(`User not found for notification: ${userId}`);
        return false;
      }

      const user = userResult.rows[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const assignmentUrl = `${baseUrl}/assignments/${assignmentId}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0d1829; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
            <h1 style="color: #333; font-size: 24px;">Assignment Notification</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Hello ${user.name},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              A new assignment has been posted: <strong>${assignmentTitle}</strong>
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Due date: ${dueDate}
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${assignmentUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Assignment
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
            &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
          </div>
        </div>
      `;

      return await emailServiceV2.sendEmail({
        to: user.email,
        subject: `Assignment Notification: ${assignmentTitle}`,
        html
      }, 'assignment-notification', assignmentId);

    } catch (error) {
      console.error('Error sending assignment notification email:', error);
      return false;
    }
  }

  /**
   * Send a general notification via email
   */
  static async sendGeneralNotification(
    userId: string,
    title: string,
    message: string,
    link?: string,
    category?: string
  ): Promise<boolean> {
    try {
      // Get user email
      const userResult = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.error(`User not found for notification: ${userId}`);
        return false;
      }

      const user = userResult.rows[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      let buttonHtml = '';
      if (link) {
        const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
        buttonHtml = `
          <div style="margin: 30px 0; text-align: center;">
            <a href="${fullUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Details
            </a>
          </div>
        `;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0d1829; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
            <h1 style="color: #333; font-size: 24px;">${title}</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Hello ${user.name},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              ${message}
            </p>
            ${buttonHtml}
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
            &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
          </div>
        </div>
      `;

      return await emailServiceV2.sendEmail({
        to: user.email,
        subject: title,
        html
      }, category || 'general-notification');

    } catch (error) {
      console.error('Error sending general notification email:', error);
      return false;
    }
  }
}

export default EmailNotificationService;
