"use strict";
/**
 * Optimized Database Service for Supabase with Prisma
 *
 * This file provides a single, secure database interface following Prisma and Supabase best practices:
 * - Connection pooling optimization
 * - Proper error handling and retries
 * - Type-safe operations
 * - Performance monitoring
 * - Secure query patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaClient = exports.db = exports.DatabaseService = exports.prisma = void 0;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
// Global Prisma instance for Next.js hot reloading
const globalForPrisma = globalThis;
/**
 * Create Prisma client with optimized configuration for Supabase
 */
function createPrismaClient() {
    return new client_1.PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        errorFormat: 'pretty',
    });
}
// Singleton Prisma client
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
exports.prismaClient = exports.prisma;
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Connection health check with retries
async function checkDatabaseHealth() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
// Graceful shutdown
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
}
// Process cleanup handlers
if (typeof process !== 'undefined') {
    process.on('beforeExit', async () => {
        await disconnectDatabase();
    });
    process.on('SIGINT', async () => {
        await disconnectDatabase();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await disconnectDatabase();
        process.exit(0);
    });
}
/**
 * Database Service Class with optimized operations
 */
class DatabaseService {
    constructor() {
        this.client = exports.prisma;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    // ============================================================================
    // USER OPERATIONS
    // ============================================================================
    async createUser(data) {
        try {
            return await this.client.users.create({
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    avatar: true,
                    created_at: true,
                    email_verified: true,
                }
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }
    async findUserByEmail(email) {
        try {
            return await this.client.users.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    password_hash: true,
                    role: true,
                    avatar: true,
                    email_verified: true,
                    club_id: true,
                    totp_enabled: true,
                    totp_secret: true,
                    created_at: true,
                }
            });
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw new Error('Failed to find user');
        }
    }
    async findUserById(id) {
        try {
            return await this.client.users.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    club_id: true,
                    created_at: true,
                    email_verified: true,
                    totp_enabled: true,
                }
            });
        }
        catch (error) {
            console.error('Error finding user by ID:', error);
            throw new Error('Failed to find user');
        }
    }
    async updateUser(id, data) {
        try {
            return await this.client.users.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    updated_at: true,
                }
            });
        }
        catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }
    }
    async updateUserPassword(id, passwordHash) {
        try {
            return await this.client.users.update({
                where: { id },
                data: {
                    password_hash: passwordHash,
                    updated_at: new Date(),
                }
            });
        }
        catch (error) {
            console.error('Error updating user password:', error);
            throw new Error('Failed to update password');
        }
    }
    async verifyUserEmail(id) {
        try {
            return await this.client.users.update({
                where: { id },
                data: {
                    email_verified: true,
                    email_verification_token: null,
                    email_verification_token_expires_at: null,
                    updated_at: new Date(),
                }
            });
        }
        catch (error) {
            console.error('Error verifying user email:', error);
            throw new Error('Failed to verify email');
        }
    }
    // ============================================================================
    // SESSION OPERATIONS
    // ============================================================================
    async createSession(data) {
        try {
            return await this.client.sessions.create({
                data,
                select: {
                    id: true,
                    user_id: true,
                    token: true,
                    expires_at: true,
                    created_at: true,
                }
            });
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw new Error('Failed to create session');
        }
    }
    async findSessionByToken(token) {
        try {
            return await this.client.sessions.findUnique({
                where: { token },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            avatar: true,
                            club_id: true,
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error finding session:', error);
            throw new Error('Failed to find session');
        }
    }
    async deleteSession(token) {
        try {
            return await this.client.sessions.delete({
                where: { token }
            });
        }
        catch (error) {
            console.error('Error deleting session:', error);
            throw new Error('Failed to delete session');
        }
    }
    async deleteExpiredSessions() {
        try {
            return await this.client.sessions.deleteMany({
                where: {
                    expires_at: {
                        lt: new Date()
                    }
                }
            });
        }
        catch (error) {
            console.error('Error deleting expired sessions:', error);
            throw new Error('Failed to clean up sessions');
        }
    }
    // ============================================================================
    // CLUB OPERATIONS
    // ============================================================================
    async getAllClubs() {
        try {
            return await this.client.clubs.findMany({
                select: {
                    id: true,
                    name: true,
                    type: true,
                    description: true,
                    icon: true,
                    color: true,
                    logo_url: true,
                    member_count: true,
                    created_at: true,
                },
                orderBy: {
                    name: 'asc'
                }
            });
        }
        catch (error) {
            console.error('Error fetching clubs:', error);
            throw new Error('Failed to fetch clubs');
        }
    }
    async findClubById(id) {
        try {
            return await this.client.clubs.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            assignments: true,
                            events: true,
                            posts: true,
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error finding club:', error);
            throw new Error('Failed to find club');
        }
    }
    // ============================================================================
    // ASSIGNMENT OPERATIONS
    // ============================================================================
    async getAssignmentsByClub(clubId, limit) {
        try {
            return await this.client.assignments.findMany({
                where: {
                    club_id: clubId,
                    is_published: true,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    assignment_type: true,
                    due_date: true,
                    max_points: true,
                    status: true,
                    created_at: true,
                    clubs: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                        }
                    },
                    _count: {
                        select: {
                            assignment_questions: true,
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: limit,
            });
        }
        catch (error) {
            console.error('Error fetching assignments:', error);
            throw new Error('Failed to fetch assignments');
        }
    }
    async findAssignmentById(id) {
        try {
            return await this.client.assignments.findUnique({
                where: { id },
                include: {
                    assignment_questions: {
                        orderBy: {
                            question_order: 'asc'
                        }
                    },
                    clubs: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                        }
                    },
                    _count: {
                        select: {
                            assignment_questions: true,
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error finding assignment:', error);
            throw new Error('Failed to find assignment');
        }
    }
    async createAssignment(data) {
        try {
            return await this.client.assignments.create({
                data,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    assignment_type: true,
                    due_date: true,
                    max_points: true,
                    created_at: true,
                }
            });
        }
        catch (error) {
            console.error('Error creating assignment:', error);
            throw new Error('Failed to create assignment');
        }
    }
    // ============================================================================
    // POST OPERATIONS
    // ============================================================================
    async getRecentPosts(limit = 10, clubId) {
        try {
            return await this.client.posts.findMany({
                where: clubId ? { club_id: clubId } : undefined,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    category: true,
                    image_url: true,
                    is_pinned: true,
                    view_count: true,
                    likes_count: true,
                    comments_count: true,
                    created_at: true,
                    users_posts_author_idTousers: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        }
                    },
                    clubs: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                        }
                    }
                },
                orderBy: [
                    { is_pinned: 'desc' },
                    { created_at: 'desc' }
                ],
                take: limit,
            });
        }
        catch (error) {
            console.error('Error fetching posts:', error);
            throw new Error('Failed to fetch posts');
        }
    }
    async createPost(data) {
        try {
            return await this.client.posts.create({
                data,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    category: true,
                    created_at: true,
                    users_posts_author_idTousers: {
                        select: {
                            name: true,
                            avatar: true,
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error creating post:', error);
            throw new Error('Failed to create post');
        }
    }
    // ============================================================================
    // NOTIFICATION OPERATIONS
    // ============================================================================
    async getUserNotifications(userId, limit = 20) {
        try {
            return await this.client.$queryRaw `
        SELECT n.*, u.name as sender_name, u.avatar as sender_avatar
        FROM notifications n
        LEFT JOIN users u ON n.sent_by = u.id
        WHERE n.user_id = ${userId}
        ORDER BY n.created_at DESC
        LIMIT ${limit}
      `;
        }
        catch (error) {
            console.error('Error fetching notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }
    async getUnreadNotificationCount(userId) {
        try {
            const result = await this.client.$queryRaw `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ${userId} AND read = false
      `;
            return Number(result[0]?.count || 0);
        }
        catch (error) {
            console.error('Error counting unread notifications:', error);
            return 0;
        }
    }
    // ============================================================================
    // ANALYTICS OPERATIONS
    // ============================================================================
    async getDashboardStats() {
        try {
            const [userCount, clubCount, assignmentCount, postCount] = await Promise.all([
                this.client.users.count(),
                this.client.clubs.count(),
                this.client.assignments.count(),
                this.client.posts.count(),
            ]);
            return {
                users: userCount,
                clubs: clubCount,
                assignments: assignmentCount,
                posts: postCount,
            };
        }
        catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw new Error('Failed to fetch dashboard statistics');
        }
    }
    async getActiveUsers(days = 7) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            return await this.client.users.count({
                where: {
                    last_activity: {
                        gte: since
                    }
                }
            });
        }
        catch (error) {
            console.error('Error fetching active users:', error);
            throw new Error('Failed to fetch active users');
        }
    }
    // ============================================================================
    // COMMITTEE OPERATIONS
    // ============================================================================
    async getCommittees() {
        try {
            return await this.client.committees.findMany({
                where: { is_active: true },
                include: {
                    _count: {
                        select: {
                            committee_members: true,
                        }
                    }
                },
                orderBy: {
                    hierarchy_level: 'asc'
                }
            });
        }
        catch (error) {
            console.error('Error fetching committees:', error);
            throw new Error('Failed to fetch committees');
        }
    }
    // ============================================================================
    // UTILITY OPERATIONS
    // ============================================================================
    async executeTransaction(fn) {
        try {
            return await this.client.$transaction(fn);
        }
        catch (error) {
            console.error('Transaction failed:', error);
            throw new Error('Database transaction failed');
        }
    }
    async executeRawQuery(query, ...params) {
        try {
            return await this.client.$queryRawUnsafe(query, ...params);
        }
        catch (error) {
            console.error('Raw query failed:', error);
            throw new Error('Database query failed');
        }
    }
    // Health check
    async isHealthy() {
        return await checkDatabaseHealth();
    }
}
exports.DatabaseService = DatabaseService;
// Export singleton instance
exports.db = DatabaseService.getInstance();
// Default export
exports.default = exports.db;
