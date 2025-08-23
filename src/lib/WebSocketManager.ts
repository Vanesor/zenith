import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { CacheManager, CacheKeys } from './CacheManager';
import { SessionManager } from './SessionManager';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  sessionId?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  roomId: string;
  timestamp: Date;
  replyTo?: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
  read: boolean;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private roomUsers: Map<string, Set<string>> = new Map(); // roomId -> userIds
  private typingUsers: Map<string, Map<string, TypingUser>> = new Map(); // roomId -> userId -> TypingUser

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, JWT_SECRET) as unknown as { 
          id: string; 
          role: string; 
          sessionId: string; 
        };
        
        // Validate session
        const session = await SessionManager.validateSession(decoded.sessionId);
        if (!session) {
          return next(new Error('Authentication error: Invalid session'));
        }

        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.sessionId = decoded.sessionId;
        
        next();
      } catch (_error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      // Track user socket
      this.trackUserSocket(socket.userId!, socket.id);

      // Join user to their personal room for notifications
      socket.join(`user:${socket.userId}`);

      // Handle chat room joining
      socket.on('join-room', async (roomId: string) => {
        await this.handleJoinRoom(socket, roomId);
      });

      // Handle leaving chat room
      socket.on('leave-room', async (roomId: string) => {
        await this.handleLeaveRoom(socket, roomId);
      });

      // Handle sending messages
      socket.on('send-message', async (data: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        await this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing-start', (roomId: string) => {
        this.handleTypingStart(socket, roomId);
      });

      socket.on('typing-stop', (roomId: string) => {
        this.handleTypingStop(socket, roomId);
      });

      // Handle notification acknowledgment
      socket.on('notification-read', async (notificationId: string) => {
        await this.handleNotificationRead(socket, notificationId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private trackUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, roomId: string) {
    try {
      // Verify user has access to the room
      const hasAccess = await this.verifyRoomAccess(socket.userId!, roomId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to room' });
        return;
      }

      socket.join(roomId);
      
      // Track room users
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId)!.add(socket.userId!);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        timestamp: new Date()
      });

      // Send recent messages from cache
      const recentMessages = await CacheManager.get(CacheKeys.chatMessages(roomId));
      if (recentMessages) {
        socket.emit('recent-messages', recentMessages);
      }

      console.log(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleLeaveRoom(socket: AuthenticatedSocket, roomId: string) {
    socket.leave(roomId);
    
    // Remove from room users tracking
    const roomUserSet = this.roomUsers.get(roomId);
    if (roomUserSet) {
      roomUserSet.delete(socket.userId!);
      if (roomUserSet.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }

    // Stop typing if user was typing
    this.handleTypingStop(socket, roomId);

    // Notify others in the room
    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      timestamp: new Date()
    });

    console.log(`User ${socket.userId} left room ${roomId}`);
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: Omit<ChatMessage, 'id' | 'timestamp'>) {
    try {
      // Create message object
      const message: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        authorId: socket.userId!,
        timestamp: new Date()
      };

      // Stop typing indicator
      this.handleTypingStop(socket, data.roomId);

      // Save message to database (you'll need to implement this)
      // await Database.saveMessage(message);

      // Cache recent messages
      const cacheKey = CacheKeys.chatMessages(data.roomId);
      const recentMessages = await CacheManager.get<ChatMessage[]>(cacheKey) || [];
      recentMessages.push(message);
      
      // Keep only last 50 messages in cache
      if (recentMessages.length > 50) {
        recentMessages.splice(0, recentMessages.length - 50);
      }
      
      await CacheManager.set(cacheKey, recentMessages, 3600); // 1 hour TTL

      // Broadcast message to room
      this.io.to(data.roomId).emit('new-message', message);

      // Send notifications to offline users in the room
      await this.sendOfflineNotifications(data.roomId, message);

      console.log(`Message sent in room ${data.roomId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, roomId: string) {
    const typingUser: TypingUser = {
      userId: socket.userId!,
      userName: '', // You'll need to get this from the database
      timestamp: Date.now()
    };

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }
    
    this.typingUsers.get(roomId)!.set(socket.userId!, typingUser);

    // Broadcast typing indicator to others in the room
    socket.to(roomId).emit('user-typing', {
      userId: socket.userId,
      userName: typingUser.userName
    });

    // Auto-stop typing after 5 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, roomId);
    }, 5000);
  }

  private handleTypingStop(socket: AuthenticatedSocket, roomId: string) {
    const roomTyping = this.typingUsers.get(roomId);
    if (roomTyping && roomTyping.has(socket.userId!)) {
      roomTyping.delete(socket.userId!);
      
      if (roomTyping.size === 0) {
        this.typingUsers.delete(roomId);
      }

      // Broadcast stop typing to others in the room
      socket.to(roomId).emit('user-stopped-typing', {
        userId: socket.userId
      });
    }
  }

  private async handleNotificationRead(socket: AuthenticatedSocket, notificationId: string) {
    // Mark notification as read in database
    // await Database.markNotificationAsRead(notificationId, socket.userId!);
    
    // Remove from cache
    await CacheManager.delete(`notification:${notificationId}`);
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove socket from user tracking
    const userSocketSet = this.userSockets.get(socket.userId!);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(socket.userId!);
      }
    }

    // Remove from all room users tracking
    for (const [roomId, userSet] of this.roomUsers.entries()) {
      if (userSet.has(socket.userId!)) {
        userSet.delete(socket.userId!);
        if (userSet.size === 0) {
          this.roomUsers.delete(roomId);
        }
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    }

    // Stop all typing indicators for this user
    for (const [roomId, typingMap] of this.typingUsers.entries()) {
      if (typingMap.has(socket.userId!)) {
        typingMap.delete(socket.userId!);
        if (typingMap.size === 0) {
          this.typingUsers.delete(roomId);
        }
        
        socket.to(roomId).emit('user-stopped-typing', {
          userId: socket.userId
        });
      }
    }
  }

  private async verifyRoomAccess(_userId: string, _roomId: string): Promise<boolean> {
    // Implement room access verification logic
    // Check if user is a member of the room
    return true; // For now, allow all access
  }

  private async sendOfflineNotifications(_roomId: string, _message: ChatMessage) {
    // Get room members who are not currently connected
    // Send push notifications or email notifications
    // This would integrate with your notification service
  }

  // Public methods for sending notifications
  public async sendNotificationToUser(userId: string, notification: Notification) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet && userSocketSet.size > 0) {
      // User is online, send real-time notification
      this.io.to(`user:${userId}`).emit('notification', notification);
    } else {
      // User is offline, cache notification
      await CacheManager.set(
        `notification:${notification.id}`, 
        notification, 
        86400 // 24 hours
      );
    }
  }

  public async broadcastToRoom(roomId: string, event: string, data: unknown) {
    this.io.to(roomId).emit(event, data);
  }

  public getStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalSockets: this.io.engine.clientsCount,
      activeRooms: this.roomUsers.size,
      typingUsers: Array.from(this.typingUsers.values()).reduce((acc, map) => acc + map.size, 0)
    };
  }
}

// Export singleton instance
let webSocketManager: WebSocketManager | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketManager {
  if (!webSocketManager) {
    webSocketManager = new WebSocketManager(server);
    console.log('WebSocket server initialized');
  }
  return webSocketManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return webSocketManager;
}
