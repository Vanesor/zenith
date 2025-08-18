/**
 * Database Service
 * 
 * Central point for all database operations in the Zenith application.
 * This file provides:
 *   1. A reference to the singleton Prisma client
 *   2. Common database operations as helper functions
 *   3. Type-safe interfaces for database operations
 *   4. Specialized operations for different domains
 */

import { db } from './db';
import { Prisma } from '../generated/prisma';

// Re-export everything from Prisma client
export * from '../generated/prisma';
export { db };

/**
 * Execute a raw SQL query with proper type handling
 * Use this instead of directly calling db.$executeRaw
 * 
 * @param sql The SQL query as a template literal
 * @param params Parameters to pass to the query
 */
export async function executeRawSQL(sql: string, ...params: any[]) {
  try {
    return await db.$executeRaw(Prisma.sql([sql], ...params));
  } catch (error) {
    console.error('Error executing raw SQL:', error);
    throw error;
  }
}

/**
 * Execute a raw SQL query that returns data
 * 
 * @param sql The SQL query as a template literal 
 * @param params Parameters to pass to the query
 * @returns An object with rows property containing the result rows
 */
export async function queryRawSQL<T = any>(sql: string, ...params: any[]): Promise<{ rows: T[] }> {
  try {
    const rawResult = await db.$queryRaw<T[]>(Prisma.sql([sql], ...params));
    return { rows: Array.isArray(rawResult) ? rawResult : [] };
  } catch (error) {
    console.error('Error querying raw SQL:', error);
    throw error;
  }
}

// Types for enhanced functions
type PaginationOptions = {
  page?: number;
  limit?: number;
};

type SearchOptions = {
  term?: string;
  field?: string;
};

// Common utilities
function buildPagination(options?: PaginationOptions) {
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;
  
  return {
    take: limit,
    skip
  };
}

// ==========================================
// SYSTEM OPERATIONS 
// ==========================================

/**
 * Check if the database is healthy
 * Returns database connection status and any error information
 */
export async function checkDatabaseHealth() {
  try {
    // Run a simple query to check if the database is responding
    const result = await db.$queryRaw`SELECT 1 as health_check`;
    return { 
      connected: true, 
      message: 'Database connection successful', 
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      connected: false, 
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    };
  }
}

// ==========================================
// USERS
// ==========================================

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string) {
  return db.users.findUnique({
    where: { email }
  });
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string) {
  return db.users.findUnique({
    where: { id }
  });
}

/**
 * Create a new user
 */
export async function createUser(data: Prisma.usersCreateInput) {
  return db.users.create({
    data
  });
}

/**
 * Update user data
 */
export async function updateUser(id: string, data: Prisma.usersUpdateInput) {
  return db.users.update({
    where: { id },
    data
  });
}

/**
 * Search users by name or email
 */
export async function searchUsers(search: string, options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.users.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    },
    ...pagination,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      created_at: true,
    },
  });
}

/**
 * Get users with pagination
 */
export async function getUsers(options?: PaginationOptions & { role?: string }) {
  const pagination = buildPagination(options);
  
  return db.users.findMany({
    where: options?.role ? { role: options.role } : undefined,
    ...pagination,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      created_at: true,
    },
  });
}

/**
 * Get user count (optionally by role)
 */
export async function getUserCount(role?: string) {
  return db.users.count({
    where: role ? { role } : undefined
  });
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  return db.users.delete({
    where: { id }
  });
}

// ==========================================
// SESSIONS
// ==========================================

/**
 * Create a new session
 */
export async function createSession(data: Prisma.sessionsCreateInput) {
  return db.sessions.create({
    data
  });
}

/**
 * Find a session by token
 */
export async function findSession(token: string) {
  return db.sessions.findUnique({
    where: { token },
    include: {
      users: true
    }
  });
}

/**
 * Update session data
 */
export async function updateSession(token: string, data: Prisma.sessionsUpdateInput) {
  return db.sessions.update({
    where: { token },
    data
  });
}

/**
 * Delete a session
 */
export async function deleteSession(token: string) {
  return db.sessions.delete({
    where: { token }
  });
}

/**
 * Delete expired sessions
 */
export async function deleteExpiredSessions() {
  return db.sessions.deleteMany({
    where: {
      expires_at: {
        lt: new Date()
      }
    }
  });
}

// ==========================================
// CLUBS
// ==========================================

/**
 * Find all clubs
 */
export async function findAllClubs(options?: {
  limit?: number;
  orderBy?: Prisma.clubsOrderByWithRelationInput;
}) {
  return db.clubs.findMany({
    take: options?.limit,
    orderBy: options?.orderBy || { name: 'asc' }
  });
}

/**
 * Find club by ID
 */
export async function findClubById(id: string) {
  return db.clubs.findUnique({
    where: { id }
  });
}

/**
 * Create a new club
 */
export async function createClub(data: Prisma.clubsCreateInput) {
  return db.clubs.create({
    data
  });
}

/**
 * Get club members
 */
export async function getClubMembers(clubId: string) {
  // Make sure clubId is a valid UUID
  if (typeof clubId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId)) {
    throw new Error(`Invalid UUID format for clubId: ${clubId}`);
  }
  
  return db.club_members.findMany({
    where: { club_id: clubId }
  });
}

/**
 * Search clubs by name or description
 */
export async function searchClubs(search: string, options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.clubs.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    },
    ...pagination,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get clubs with pagination
 */
export async function getClubsWithPagination(options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.clubs.findMany({
    ...pagination,
    orderBy: { name: 'asc' },
  });
}

/**
 * Update a club
 */
export async function updateClub(id: string, data: Prisma.clubsUpdateInput) {
  return db.clubs.update({
    where: { id },
    data
  });
}

/**
 * Delete a club
 */
export async function deleteClub(id: string) {
  return db.clubs.delete({
    where: { id }
  });
}

/**
 * Add a member to a club
 */
export async function addClubMember(userId: string, clubId: string, isLeader: boolean = false) {
  return db.club_members.create({
    data: {
      user_id: userId,
      club_id: clubId,
      is_leader: isLeader,
      joined_at: new Date()
    }
  });
}

/**
 * Remove a member from a club
 */
export async function removeClubMember(userId: string, clubId: string) {
  return db.club_members.deleteMany({
    where: {
      user_id: userId,
      club_id: clubId
    }
  });
}

/**
 * Update a club member's status
 */
export async function updateClubMemberStatus(userId: string, clubId: string, isLeader: boolean) {
  return db.club_members.updateMany({
    where: {
      user_id: userId,
      club_id: clubId
    },
    data: {
      is_leader: isLeader
    }
  });
}

// ==========================================
// EVENTS
// ==========================================

/**
 * Find all events
 */
export async function findAllEvents(options?: {
  limit?: number;
  orderBy?: Prisma.eventsOrderByWithRelationInput;
  where?: Prisma.eventsWhereInput;
}) {
  return db.events.findMany({
    take: options?.limit,
    orderBy: options?.orderBy || { event_date: 'desc' },
    where: options?.where
  });
}

/**
 * Find event by ID with details
 */
export async function findEventWithDetails(id: string) {
  const event = await db.events.findUnique({
    where: { id }
  });
  
  if (!event) return null;
  
  // Get club
  const club = event.club_id ? await db.clubs.findUnique({
    where: { id: event.club_id }
  }) : null;
  
  // Get attendees
  const attendees = await db.event_attendees.findMany({
    where: { event_id: id }
  });
  
  return {
    ...event,
    club,
    attendees
  };
}

/**
 * Create a new event
 */
export async function createEvent(data: Prisma.eventsCreateInput) {
  return db.events.create({
    data
  });
}

/**
 * Update an event
 */
export async function updateEvent(id: string, data: Prisma.eventsUpdateInput) {
  return db.events.update({
    where: { id },
    data
  });
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  return db.events.delete({
    where: { id }
  });
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(options?: PaginationOptions & { clubId?: string }) {
  const pagination = buildPagination(options);
  const today = new Date();
  
  return db.events.findMany({
    where: {
      event_date: { gte: today },
      ...(options?.clubId ? { club_id: options.clubId } : {})
    },
    orderBy: { event_date: 'asc' },
    ...pagination
  });
}

/**
 * Get past events
 */
export async function getPastEvents(options?: PaginationOptions & { clubId?: string }) {
  const pagination = buildPagination(options);
  const today = new Date();
  
  return db.events.findMany({
    where: {
      event_date: { lt: today },
      ...(options?.clubId ? { club_id: options.clubId } : {})
    },
    orderBy: { event_date: 'desc' },
    ...pagination
  });
}

/**
 * Search events
 */
export async function searchEvents(search: string, options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.events.findMany({
    where: {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ],
    },
    ...pagination,
    orderBy: { event_date: 'desc' },
  });
}

/**
 * Add attendee to event
 */
export async function addEventAttendee(eventId: string, userId: string, attendanceStatus: string = 'confirmed') {
  return db.event_attendees.create({
    data: {
      event_id: eventId,
      user_id: userId,
      attendance_status: attendanceStatus,
      registered_at: new Date()
    }
  });
}

/**
 * Remove attendee from event
 */
export async function removeEventAttendee(eventId: string, userId: string) {
  return db.event_attendees.deleteMany({
    where: {
      event_id: eventId,
      user_id: userId
    }
  });
}

/**
 * Get event attendees
 */
export async function getEventAttendees(eventId: string, options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.event_attendees.findMany({
    where: { event_id: eventId },
    ...pagination
  });
}

// ==========================================
// ASSIGNMENTS
// ==========================================

/**
 * Find all assignments
 */
export async function findAllAssignments(options?: {
  limit?: number;
  orderBy?: Prisma.assignmentsOrderByWithRelationInput;
  where?: Prisma.assignmentsWhereInput;
}) {
  return db.assignments.findMany({
    take: options?.limit,
    orderBy: options?.orderBy || { created_at: 'desc' },
    where: options?.where
  });
}

/**
 * Find assignment by ID
 */
export async function findAssignmentById(id: string) {
  return db.assignments.findUnique({
    where: { id },
    include: {
      assignment_questions: true
    }
  });
}

/**
 * Create a new assignment
 */
export async function createAssignment(data: Prisma.assignmentsCreateInput) {
  return db.assignments.create({
    data
  });
}

/**
 * Update an assignment
 */
export async function updateAssignment(id: string, data: Prisma.assignmentsUpdateInput) {
  return db.assignments.update({
    where: { id },
    data
  });
}

/**
 * Delete an assignment
 */
export async function deleteAssignment(id: string) {
  return db.assignments.delete({
    where: { id }
  });
}

/**
 * Add a question to an assignment
 */
export async function addAssignmentQuestion(assignmentId: string, questionData: Prisma.assignment_questionsCreateWithoutAssignmentsInput) {
  return db.assignment_questions.create({
    data: {
      ...questionData,
      assignment_id: assignmentId
    }
  });
}

/**
 * Get assignment questions
 */
export async function getAssignmentQuestions(assignmentId: string) {
  return db.assignment_questions.findMany({
    where: { assignment_id: assignmentId },
    orderBy: { question_order: 'asc' }
  });
}

// ==========================================
// CHAT
// ==========================================

/**
 * Create a chat room
 */
export async function createChatRoom(data: Prisma.chat_roomsCreateInput) {
  return db.chat_rooms.create({
    data
  });
}

/**
 * Find chat room by ID
 */
export async function findChatRoomById(id: string) {
  return db.chat_rooms.findUnique({
    where: { id }
  });
}

/**
 * Get user's chat rooms
 */
export async function getUserChatRooms(userId: string) {
  return db.chat_rooms.findMany({
    where: {
      members: {
        has: userId
      }
    },
    orderBy: {
      updated_at: 'desc'
    }
  });
}

/**
 * Send a chat message
 */
export async function sendChatMessage(roomId: string, userId: string, message: string, messageType: string = 'text') {
  return db.chat_messages.create({
    data: {
      room_id: roomId,
      user_id: userId,
      message,
      message_type: messageType,
      created_at: new Date(),
      sender_id: userId
    }
  });
}

/**
 * Get chat messages for a room
 */
export async function getChatMessages(roomId: string, options?: PaginationOptions) {
  const pagination = buildPagination(options);
  
  return db.chat_messages.findMany({
    where: {
      room_id: roomId
    },
    orderBy: {
      created_at: 'desc'
    },
    ...pagination
  });
}

/**
 * Add user to chat room
 */
export async function addUserToChatRoom(roomId: string, userId: string) {
  // First get the current room
  const room = await db.chat_rooms.findUnique({
    where: { id: roomId }
  });
  
  if (!room) throw new Error(`Chat room with ID ${roomId} not found`);
  
  // Update the members array
  const currentMembers = room.members || [];
  if (!currentMembers.includes(userId)) {
    return db.chat_rooms.update({
      where: { id: roomId },
      data: {
        members: {
          set: [...currentMembers, userId]
        }
      }
    });
  }
  
  return room;
}

/**
 * Remove user from chat room
 */
export async function removeUserFromChatRoom(roomId: string, userId: string) {
  // First get the current room
  const room = await db.chat_rooms.findUnique({
    where: { id: roomId }
  });
  
  if (!room) throw new Error(`Chat room with ID ${roomId} not found`);
  
  // Update the members array
  const currentMembers = room.members || [];
  return db.chat_rooms.update({
    where: { id: roomId },
    data: {
      members: {
        set: currentMembers.filter(memberId => memberId !== userId)
      }
    }
  });
}

// ==========================================
// TRANSACTIONS
// ==========================================

/**
 * Helper function for running transactions
 */
export async function transaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(callback);
}

// Default export for backward compatibility
export default db;
