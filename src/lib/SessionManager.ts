import crypto from 'crypto';
import { createAdminClient } from './supabase';
import { db, executeRawSQL, queryRawSQL } from './database-service';

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
    
    // Add to memory cache
    this.activeSessions.set(sessionId, session);
    
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
    
    // Store in database
    try {
      // Use the executeRawSQL function from our database service
      await executeRawSQL(`
        INSERT INTO sessions (
          id, user_id, token, expires_at, user_agent, ip_address, last_active_at
        ) VALUES (
          gen_random_uuid(), $1::uuid, $2, NOW() + interval '30 days', $3, $4, NOW()
        )
      `, userId, sessionId, deviceInfo, ipAddress);
    } catch (error) {
      console.error('Error saving session to database:', error);
      
      // Fallback to supabase directly
      try {
        const supabase = createAdminClient();
        await supabase.from('sessions').insert({
          user_id: userId,
          token: sessionId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          user_agent: deviceInfo,
          ip_address: ipAddress,
          last_active_at: new Date()
        });
      } catch (supabaseError) {
        console.error('Error saving session to Supabase:', supabaseError);
      }
    }
    
    // Clean up old sessions for this user (keep max 5 active sessions)
    await this.cleanupUserSessions(userId, 5);
    
    return sessionId;
  }
  
  // Validate and refresh session
  static async validateSession(sessionId: string): Promise<UserSession | null> {
    // If no sessionId provided, return null
    if (!sessionId) return null;
    
    // First check in memory cache
    let session = this.activeSessions.get(sessionId);
    
    // If not in memory cache, try to get from database
    if (!session) {
      try {
        // Try the main database first
        const db = (await import('./database')).default;
        
        try {
          // Use proper parameter processing to ensure correct type handling
          // The token is a string and id might be a UUID or string
          
          const result = await queryRawSQL(`
            SELECT id, user_id, token, expires_at, user_agent, ip_address, last_active_at
            FROM sessions 
            WHERE token = $1::text OR id::text = $2::text
          `, sessionId, sessionId);
          
          if (result && result.rows && result.rows.length > 0) {
            const data = result.rows[0];
            
            // Check if session has expired
            const expiresAt = new Date(data.expires_at);
            if (expiresAt < new Date()) {
              console.log("Session expired:", sessionId);
              return null;
            }
            
            // Create session object
            session = {
              userId: data.user_id || '',
              sessionId: data.token || data.id,
              lastActivity: data.last_active_at ? new Date(data.last_active_at) : new Date(),
              deviceInfo: data.user_agent || '',
              ipAddress: data.ip_address || '',
              isActive: true
            };
            
            // Cache in memory
            this.activeSessions.set(sessionId, session);
            
            if (!this.userSessions.has(session.userId)) {
              this.userSessions.set(session.userId, new Set());
            }
            this.userSessions.get(session.userId)!.add(sessionId);
          }
        } catch (queryError) {
          console.error("Error querying session from database:", queryError);
          
          // Fallback to prisma client
          try {
            const dbSession = await db.sessions.findFirst({
              where: {
                OR: [
                  { token: sessionId },
                  { id: sessionId }
                ]
              }
            });
            
            if (dbSession) {
              // Check if session has expired
              if (dbSession.expires_at && dbSession.expires_at < new Date()) {
                console.log("Session expired:", sessionId);
                return null;
              }
              
              // Create session object
              session = {
                userId: dbSession.user_id || '',
                sessionId: dbSession.token || dbSession.id,
                lastActivity: dbSession.last_active_at || new Date(),
                deviceInfo: dbSession.user_agent || '',
                ipAddress: dbSession.ip_address || '',
                isActive: true
              };
              
              // Cache in memory
              this.activeSessions.set(sessionId, session);
              
              if (!this.userSessions.has(session.userId)) {
                this.userSessions.set(session.userId, new Set());
              }
              this.userSessions.get(session.userId)!.add(sessionId);
            }
          } catch (prismaError) {
            console.error("Error querying session with Prisma:", prismaError);
          }
        }
        
        // If we still don't have a session, try Supabase
        if (!session) {
          try {
            const supabase = createAdminClient();
            // Use proper filter query approach for Supabase
            const { data: sessionData } = await supabase
              .from('sessions')
              .select('*')
              .or(`token.eq.${sessionId},id.eq.${sessionId}`)
              .single();
              
            if (sessionData) {
              const expiresAt = new Date(sessionData.expires_at);
              if (expiresAt < new Date()) {
                return null;
              }
              
              session = {
                userId: sessionData.user_id,
                sessionId: sessionData.token || sessionData.id,
                lastActivity: new Date(sessionData.last_active_at),
                deviceInfo: sessionData.user_agent || '',
                ipAddress: sessionData.ip_address || '',
                isActive: true
              };
              
              // Add to memory cache
              this.activeSessions.set(sessionId, session);
              
              // Track user sessions
              if (!this.userSessions.has(sessionData.user_id)) {
                this.userSessions.set(sessionData.user_id, new Set());
              }
              this.userSessions.get(sessionData.user_id)!.add(sessionId);
            }
          } catch (supabaseError) {
            console.error('Failed to fetch session from Supabase:', supabaseError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session from database:', error);
        return null;
      }
    }
    
    // At this point, session should exist in memory if it's valid
    if (!session || !session.isActive) {
      return null;
    }
    
    // Check if session is expired (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (session.lastActivity < sevenDaysAgo) {
      await this.destroySession(sessionId);
      return null;
    }
    
    // Update last activity in memory
    session.lastActivity = new Date();
    
    // Update last activity in database
    try {
      const supabase = createAdminClient();
      await supabase
        .from('sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('token', sessionId);
    } catch (error) {
      console.error('Failed to update session activity in database:', error);
    }
    
    return session;
  }
  
  // Destroy a session
  static async destroySession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Remove from user sessions tracking in memory
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
    }
    
    // Remove from database
    try {
      await executeRawSQL(`
        DELETE FROM sessions
        WHERE token = $1 OR id::text = $2
      `, sessionId, sessionId);
    } catch (error) {
      console.error('Failed to delete session from database:', error);
      
      // Fallback to Supabase
      try {
        const supabase = createAdminClient();
        await supabase
          .from('sessions')
          .delete()
          .or(`token.eq.${sessionId},id.eq.${sessionId}`);
      } catch (supabaseError) {
        console.error('Failed to delete session from Supabase:', supabaseError);
      }
    }
  }
  
  // Get user's sessions
  static getUserSessions(userId: string): string[] {
    const sessionSet = this.userSessions.get(userId);
    return sessionSet ? Array.from(sessionSet) : [];
  }
  
  // Clean up old sessions, keeping only the most recent ones
  static async cleanupUserSessions(userId: string, maxSessions: number = 5): Promise<void> {
    const userSessions = this.getUserSessions(userId);
    if (userSessions.length <= maxSessions) return;
    
    // Sort sessions by last activity
    const sessionsWithActivity: [string, Date][] = userSessions
      .map(sid => {
        const session = this.activeSessions.get(sid);
        return [sid, session ? session.lastActivity : new Date(0)] as [string, Date];
      })
      .sort((a, b) => b[1].getTime() - a[1].getTime());
    
    // Keep only the most recent sessions
    const sessionsToRemove = sessionsWithActivity.slice(maxSessions).map(([sid]) => sid);
    
    // Destroy each old session
    for (const sid of sessionsToRemove) {
      await this.destroySession(sid);
    }
  }
  
  // Cleanup inactive sessions periodically
  static {
    setInterval(async () => {
      try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Clean up inactive sessions in memory
        for (const [sessionId, session] of this.activeSessions.entries()) {
          if (session.lastActivity < sevenDaysAgo) {
            await this.destroySession(sessionId);
          }
        }
        
        // Clean up database sessions older than 7 days
        try {
          await executeRawSQL(`
            DELETE FROM sessions
            WHERE last_active_at < NOW() - INTERVAL '7 days'
          `);
        } catch (error) {
          console.error('Failed to cleanup old sessions from database:', error);
        }
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}
