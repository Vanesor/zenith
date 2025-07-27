import crypto from 'crypto';

export interface UserSession {
  userId: string;
  sessionId: string;
  lastActivity: Date;
  deviceInfo: string;
  ipAddress: string;
  isActive: boolean;
}

export class SessionManager {
  private static activeSessions = new Map<string, UserSession>();
  private static userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  
  // Create a new session
  static async createSession(
    userId: string, 
    deviceInfo: string, 
    ipAddress: string
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session: UserSession = {
      userId,
      sessionId,
      lastActivity: new Date(),
      deviceInfo,
      ipAddress,
      isActive: true
    };
    
    // Store session
    this.activeSessions.set(sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
    
    // Clean up old sessions for this user (keep max 5 active sessions)
    await this.cleanupUserSessions(userId, 5);
    
    return sessionId;
  }
  
  // Validate and refresh session
  static async validateSession(sessionId: string): Promise<UserSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }
    
    // Check if session is expired (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (session.lastActivity < sevenDaysAgo) {
      await this.destroySession(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    return session;
  }
  
  // Destroy a session
  static async destroySession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Remove from user sessions tracking
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }
    
    this.activeSessions.delete(sessionId);
  }
  
  // Get all active sessions for a user
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    const sessionIds = this.userSessions.get(userId) || new Set();
    const sessions: UserSession[] = [];
    
    for (const sessionId of sessionIds) {
      const session = this.activeSessions.get(sessionId);
      if (session && session.isActive) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }
  
  // Destroy all sessions for a user
  static async destroyAllUserSessions(userId: string): Promise<void> {
    const sessionIds = this.userSessions.get(userId) || new Set();
    
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }
    
    this.userSessions.delete(userId);
  }
  
  // Clean up old sessions for a user (keep only newest N sessions)
  static async cleanupUserSessions(userId: string, keepCount: number): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    
    if (sessions.length > keepCount) {
      // Sort by last activity (newest first)
      sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
      
      // Destroy oldest sessions
      const sessionsToDestroy = sessions.slice(keepCount);
      for (const session of sessionsToDestroy) {
        await this.destroySession(session.sessionId);
      }
    }
  }
  
  // Clean up expired sessions (run periodically)
  static async cleanupExpiredSessions(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < sevenDaysAgo) {
        await this.destroySession(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  // Get session statistics
  static getStats(): {
    totalActiveSessions: number;
    uniqueUsers: number;
    averageSessionsPerUser: number;
  } {
    const totalActiveSessions = this.activeSessions.size;
    const uniqueUsers = this.userSessions.size;
    const averageSessionsPerUser = uniqueUsers > 0 ? totalActiveSessions / uniqueUsers : 0;
    
    return {
      totalActiveSessions,
      uniqueUsers,
      averageSessionsPerUser: Math.round(averageSessionsPerUser * 100) / 100
    };
  }
}

// Run cleanup every hour
setInterval(async () => {
  const cleanedCount = await SessionManager.cleanupExpiredSessions();
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  }
}, 60 * 60 * 1000); // 1 hour
