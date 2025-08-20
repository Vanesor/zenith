/**
 * Enhanced PostgreSQL Database Client
 * Single unified database client for all operations
 * Supports: Blog system, Project management, and all existing features
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { performance } from 'perf_hooks';

interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  club_id?: string;
  created_at: Date;
  updated_at: Date;
}

interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  coordinator_id?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  club_id?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  club_id: string;
  created_by: string;
  status: string;
  created_at: Date;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  assignee_id?: string;
  due_date?: Date;
  created_at: Date;
}

class EnhancedDatabaseClient {
  private pool: Pool;
  private queryCache = new Map<string, { data: any; expires: number }>();
  private stats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor() {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://zenithpostgres:AtharvaAyush@localhost:5432/zenith';

    this.pool = new Pool({
      connectionString,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
      application_name: 'zenith-app'
    });

    this.pool.on('connect', () => {
      console.log('✅ Database client connected to pool');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
    });

    this.initialize();
  }

  private async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW(), current_database(), current_user, version()');
      client.release();
      
      console.log('🗄️ Database Information:', {
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        postgres_version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
        max_connections: '25',
        connected_at: new Date().toISOString()
      });
      
      // Clear expired cache entries every 5 minutes
      setInterval(() => this.clearExpiredCache(), 5 * 60 * 1000);
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (value.expires < now) {
        this.queryCache.delete(key);
      }
    }
  }

  private getCacheKey(query: string, params?: any[]): string {
    return `${query}:${JSON.stringify(params || [])}`;
  }

  async query<T extends Record<string, any> = any>(
    text: string, 
    params?: any[], 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const { timeout = 30000, retries = 3, cache = false, cacheTTL = 300000 } = options;
    const startTime = performance.now();
    
    // Check cache first
    if (cache) {
      const cacheKey = this.getCacheKey(text, params);
      const cached = this.queryCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        this.stats.cacheHits++;
        return cached.data;
      }
      this.stats.cacheMisses++;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      let client: PoolClient | null = null;
      
      try {
        console.log('🔗 Database client acquired from pool');
        client = await this.pool.connect();
        
        if (timeout > 0) {
          await client.query(`SET statement_timeout = '${timeout}ms'`);
        }
        
        const result = await client.query(text, params);
        const duration = performance.now() - startTime;
        
        // Update statistics
        this.stats.totalQueries++;
        this.stats.successfulQueries++;
        this.stats.averageResponseTime = 
          (this.stats.averageResponseTime * (this.stats.successfulQueries - 1) + duration) / 
          this.stats.successfulQueries;

        console.log(`⚡ Database response time: ${duration.toFixed(2)}ms`);

        // Cache the result if requested
        if (cache) {
          const cacheKey = this.getCacheKey(text, params);
          this.queryCache.set(cacheKey, {
            data: result,
            expires: Date.now() + cacheTTL
          });
        }

        return result;
        
      } catch (error: any) {
        lastError = error;
        this.stats.totalQueries++;
        this.stats.failedQueries++;
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.warn(`⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        if (client) {
          client.release();
          console.log('🔄 Database client removed from pool');
        }
      }
    }

    console.error('❌ Query failed after all retries:', {
      query: text.substring(0, 100),
      error: lastError?.message,
      attempts: retries
    });
    
    throw lastError;
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const { timeout = 30000, isolationLevel = 'READ_COMMITTED' } = options;
    const client = await this.pool.connect();
    
    try {
      if (timeout > 0) {
        await client.query(`SET statement_timeout = '${timeout}ms'`);
      }
      
      await client.query('BEGIN');
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health', [], { timeout: 5000 });
      return result.rows[0]?.health === 1;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.queryCache.size,
      poolStats: {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      }
    };
  }

  async close(): Promise<void> {
    console.log('🔌 Database pool closed');
    await this.pool.end();
  }

  // ===================
  // USER OPERATIONS
  // ===================

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      { cache: true, cacheTTL: 60000 }
    );
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
      { cache: true, cacheTTL: 60000 }
    );
    return result.rows[0] || null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const { name, email, password_hash, role = 'student', club_id } = userData as any;
    const result = await this.query(`
      INSERT INTO users (name, email, password_hash, role, club_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, password_hash, role, club_id]);
    return result.rows[0];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE users SET ${setClause}, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [userId, ...values]);
    return result.rows[0] || null;
  }

  // ===================
  // CLUB OPERATIONS
  // ===================

  async getAllClubs(): Promise<Club[]> {
    const result = await this.query(
      'SELECT * FROM clubs ORDER BY name',
      [],
      { cache: true, cacheTTL: 300000 }
    );
    return result.rows;
  }

  async getClubById(clubId: string): Promise<Club | null> {
    const result = await this.query(
      'SELECT * FROM clubs WHERE id = $1',
      [clubId],
      { cache: true, cacheTTL: 300000 }
    );
    return result.rows[0] || null;
  }

  // ===================
  // BLOG OPERATIONS
  // ===================

  async getAllPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    const result = await this.query(`
      SELECT p.*, u.name as author_name, c.name as club_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset], { cache: true, cacheTTL: 60000 });
    return result.rows;
  }

  async getPostById(postId: string): Promise<Post | null> {
    const result = await this.query(`
      SELECT p.*, u.name as author_name, c.name as club_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      WHERE p.id = $1
    `, [postId], { cache: true, cacheTTL: 300000 });
    
    if (result.rows[0]) {
      // Increment view count
      await this.query(
        'UPDATE posts SET view_count = view_count + 1 WHERE id = $1',
        [postId]
      );
    }
    
    return result.rows[0] || null;
  }

  async createPost(postData: Partial<Post>): Promise<Post> {
    const { title, content, author_id, club_id, category = 'blog', status = 'draft' } = postData as any;
    const result = await this.query(`
      INSERT INTO posts (title, content, author_id, club_id, category, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, content, author_id, club_id, category, status]);
    return result.rows[0];
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE posts SET ${setClause}, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [postId, ...values]);
    return result.rows[0] || null;
  }

  async deletePost(postId: string): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM posts WHERE id = $1',
      [postId]
    );
    return (result.rowCount || 0) > 0;
  }

  // ===================
  // PROJECT MANAGEMENT OPERATIONS
  // ===================

  async getAllProjects(clubId?: string): Promise<Project[]> {
    let query = `
      SELECT p.*, u.name as created_by_name, c.name as club_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
    `;
    let params: any[] = [];
    
    if (clubId) {
      query += ' WHERE p.club_id = $1';
      params.push(clubId);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await this.query(query, params, { cache: true, cacheTTL: 60000 });
    return result.rows;
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const result = await this.query(`
      SELECT p.*, u.name as created_by_name, c.name as club_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      WHERE p.id = $1
    `, [projectId], { cache: true, cacheTTL: 300000 });
    return result.rows[0] || null;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const { name, description, club_id, created_by, project_key, status = 'planning' } = projectData as any;
    const result = await this.query(`
      INSERT INTO projects (name, description, club_id, created_by, project_key, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, club_id, created_by, project_key, status]);
    return result.rows[0];
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const result = await this.query(`
      SELECT t.*, u.name as assignee_name, r.name as reporter_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users r ON t.reporter_id = r.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [projectId], { cache: true, cacheTTL: 60000 });
    return result.rows;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const { project_id, title, description, assignee_id, reporter_id, status = 'todo' } = taskData as any;
    const result = await this.query(`
      INSERT INTO tasks (project_id, title, description, assignee_id, reporter_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [project_id, title, description, assignee_id, reporter_id, status]);
    return result.rows[0];
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE tasks SET ${setClause}, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [taskId, ...values]);
    return result.rows[0] || null;
  }

  // ===================
  // SESSION OPERATIONS
  // ===================

  async createSession(sessionData: any): Promise<any> {
    const { user_id, token, expires_at, ip_address, user_agent } = sessionData;
    const result = await this.query(`
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, token, expires_at, ip_address, user_agent]);
    return result.rows[0];
  }

  async getSession(token: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token],
      { cache: true, cacheTTL: 30000 }
    );
    return result.rows[0] || null;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );
    return (result.rowCount || 0) > 0;
  }

  // ===================
  // EVENT OPERATIONS
  // ===================

  async getAllEvents(userId?: string, limit: number = 20): Promise<any[]> {
    let query = `
      SELECT e.*, c.name as club_name, u.name as created_by_name
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.event_date >= CURRENT_DATE
    `;
    let params: any[] = [];
    
    if (userId) {
      query += ` AND (e.club_id IN (SELECT club_id FROM users WHERE id = $1) OR e.created_by = $1)`;
      params.push(userId);
    }
    
    query += ` ORDER BY e.event_date ASC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await this.query(query, params, { cache: true, cacheTTL: 300000 });
    return result.rows;
  }

  // ===================
  // STATISTICS AND ANALYTICS
  // ===================

  async getHomeStats(): Promise<any> {
    const result = await this.query(`
      SELECT 
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as total_posts,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM tasks) as total_tasks
    `, [], { cache: true, cacheTTL: 300000 });
    return result.rows[0];
  }

  async getClubStats(): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.description,
        c.color,
        c.icon,
        COUNT(DISTINCT u.id)::INTEGER as member_count,
        COUNT(DISTINCT e.id)::INTEGER as upcoming_events,
        COUNT(DISTINCT p.id)::INTEGER as total_posts,
        COUNT(DISTINCT pr.id)::INTEGER as total_projects
      FROM clubs c
      LEFT JOIN users u ON c.id = u.club_id
      LEFT JOIN events e ON c.id = e.club_id AND e.event_date >= CURRENT_DATE
      LEFT JOIN posts p ON c.id = p.club_id AND p.status = 'published'
      LEFT JOIN projects pr ON c.id = pr.club_id
      GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
      ORDER BY member_count DESC
    `, [], { cache: true, cacheTTL: 300000 });
    return result.rows;
  }

  // ===================
  // COMPATIBILITY LAYER FOR EXISTING CODE
  // ===================

  // Prisma-like methods for backward compatibility
  users = {
    findUnique: async (options: any) => {
      const { where } = options;
      if (where.id) return this.getUserById(where.id);
      if (where.email) return this.getUserByEmail(where.email);
      return null;
    },
    findFirst: async (options: any) => this.users.findUnique(options),
    findMany: async (options: any = {}) => {
      let query = 'SELECT * FROM users';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        if (options.where.club_id) {
          conditions.push(`club_id = $${params.length + 1}`);
          params.push(options.where.club_id);
        }
        if (options.where.role) {
          conditions.push(`role = $${params.length + 1}`);
          params.push(options.where.role);
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      if (options.orderBy?.created_at) {
        query += ' ORDER BY created_at DESC';
      }
      
      if (options.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await this.query(query, params, { cache: true, cacheTTL: 60000 });
      return result.rows;
    },
    create: async (options: any) => this.createUser(options.data),
    update: async (options: any) => this.updateUser(options.where.id, options.data),
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM users';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        if (options.where.role) {
          conditions.push(`role = $${params.length + 1}`);
          params.push(options.where.role);
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    },
    groupBy: async (options: any) => {
      const { by } = options;
      let query = `SELECT ${by.join(', ')}, COUNT(*) as _count FROM users`;
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      query += ` GROUP BY ${by.join(', ')}`;
      
      const result = await this.query(query, params);
      return result.rows;
    }
  };

  clubs = {
    findMany: async () => this.getAllClubs(),
    findUnique: async (options: any) => this.getClubById(options.where.id),
    count: async () => {
      const result = await this.query('SELECT COUNT(*) as count FROM clubs');
      return parseInt(result.rows[0].count);
    }
  };

  posts = {
    findMany: async (options: any = {}) => {
      const limit = options.take || 20;
      const offset = options.skip || 0;
      return this.getAllPosts(limit, offset);
    },
    findUnique: async (options: any) => this.getPostById(options.where.id),
    create: async (options: any) => this.createPost(options.data),
    update: async (options: any) => this.updatePost(options.where.id, options.data),
    delete: async (options: any) => this.deletePost(options.where.id),
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM posts';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        if (options.where.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(options.where.status);
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  projects = {
    findMany: async (options: any = {}) => {
      const clubId = options.where?.club_id;
      return this.getAllProjects(clubId);
    },
    findUnique: async (options: any) => this.getProjectById(options.where.id),
    create: async (options: any) => this.createProject(options.data),
    count: async () => {
      const result = await this.query('SELECT COUNT(*) as count FROM projects');
      return parseInt(result.rows[0].count);
    }
  };

  tasks = {
    findMany: async (options: any = {}) => {
      if (options.where?.project_id) {
        return this.getProjectTasks(options.where.project_id);
      }
      const result = await this.query('SELECT * FROM tasks ORDER BY created_at DESC');
      return result.rows;
    },
    create: async (options: any) => this.createTask(options.data),
    update: async (options: any) => this.updateTask(options.where.id, options.data),
    count: async () => {
      const result = await this.query('SELECT COUNT(*) as count FROM tasks');
      return parseInt(result.rows[0].count);
    }
  };

  events = {
    findMany: async (options: any = {}) => {
      const limit = options.take || 20;
      return this.getAllEvents(undefined, limit);
    },
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM events';
      const params: any[] = [];
      
      if (options.where?.event_date?.gte) {
        query += ' WHERE event_date >= $1';
        params.push(options.where.event_date.gte);
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  assignments = {
    findMany: async (options: any = {}) => {
      let query = 'SELECT * FROM assignments';
      const params: any[] = [];
      
      if (options.where) {
        const conditions = [];
        if (options.where.club_id) {
          conditions.push(`club_id = $${params.length + 1}`);
          params.push(options.where.club_id);
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      if (options.orderBy?.created_at) {
        query += ' ORDER BY created_at DESC';
      }
      
      if (options.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await this.query(query, params);
      return result.rows;
    },
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM assignments';
      const params: any[] = [];
      
      if (options.where) {
        const conditions = [];
        if (options.where.club_id) {
          conditions.push(`club_id = $${params.length + 1}`);
          params.push(options.where.club_id);
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  comments = {
    findMany: async (options: any = {}) => {
      let query = 'SELECT * FROM comments';
      const params: any[] = [];
      
      if (options.where?.post_id) {
        query += ' WHERE post_id = $1';
        params.push(options.where.post_id);
      }
      
      if (options.orderBy?.created_at) {
        query += ' ORDER BY created_at DESC';
      }
      
      const result = await this.query(query, params);
      return result.rows;
    },
    count: async () => {
      const result = await this.query('SELECT COUNT(*) as count FROM comments');
      return parseInt(result.rows[0].count);
    }
  };

  // Additional compatibility methods
  chat_rooms = {
    findFirst: async (options: any) => {
      let query = 'SELECT * FROM chat_rooms';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      query += ' LIMIT 1';
      const result = await this.query(query, params);
      return result.rows[0] || null;
    },
    findUnique: async (options: any) => {
      const result = await this.query('SELECT * FROM chat_rooms WHERE id = $1', [options.where.id]);
      return result.rows[0] || null;
    },
    update: async (options: any) => {
      const fields = Object.keys(options.data);
      const values = Object.values(options.data);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await this.query(`
        UPDATE chat_rooms SET ${setClause}, updated_at = NOW()
        WHERE id = $1 RETURNING *
      `, [options.where.id, ...values]);
      return result.rows[0] || null;
    },
    delete: async (options: any) => {
      const result = await this.query('DELETE FROM chat_rooms WHERE id = $1', [options.where.id]);
      return (result.rowCount || 0) > 0;
    }
  };

  chat_messages = {
    deleteMany: async (options: any) => {
      let query = 'DELETE FROM chat_messages';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return { count: result.rowCount || 0 };
    }
  };

  assignment_attempts = {
    findMany: async (options: any = {}) => {
      let query = 'SELECT * FROM assignment_attempts';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      if (options.orderBy?.submitted_at) {
        query += ' ORDER BY submitted_at DESC';
      }
      
      if (options.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await this.query(query, params);
      return result.rows;
    },
    groupBy: async (options: any) => {
      const { by } = options;
      let query = `SELECT ${by.join(', ')}, COUNT(*) as _count FROM assignment_attempts`;
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      query += ` GROUP BY ${by.join(', ')}`;
      
      const result = await this.query(query, params);
      return result.rows;
    }
  };

  assignment_submissions = {
    findMany: async (options: any = {}) => {
      let query = 'SELECT * FROM assignment_submissions';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      if (options.orderBy?.submitted_at) {
        query += ' ORDER BY submitted_at DESC';
      }
      
      if (options.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await this.query(query, params);
      return result.rows;
    },
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM assignment_submissions';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  user_activities = {
    findMany: async (options: any = {}) => {
      let query = 'SELECT ua.*, u.name, u.email FROM user_activities ua LEFT JOIN users u ON ua.user_id = u.id';
      const params: any[] = [];
      
      if (options.where?.created_at?.gte) {
        query += ' WHERE ua.created_at >= $1';
        params.push(options.where.created_at.gte);
      }
      
      if (options.orderBy?.created_at) {
        query += ' ORDER BY ua.created_at DESC';
      }
      
      if (options.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await this.query(query, params);
      return result.rows.map((row: any) => ({
        ...row,
        users: row.name ? { name: row.name, email: row.email } : null
      }));
    }
  };

  club_members = {
    count: async (options: any = {}) => {
      let query = 'SELECT COUNT(*) as count FROM club_members';
      const params: any[] = [];
      
      if (options.where) {
        const conditions: string[] = [];
        Object.keys(options.where).forEach(key => {
          if (options.where[key] !== undefined) {
            conditions.push(`${key} = $${params.length + 1}`);
            params.push(options.where[key]);
          }
        });
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  // Raw SQL execution methods for compatibility
  $executeRaw = async (query: TemplateStringsArray | string, ...params: any[]) => {
    if (typeof query === 'string') {
      const result = await this.query(query, params);
      return result.rowCount || 0;
    } else {
      // Handle template literals
      const sqlString = query.reduce((acc, part, i) => acc + part + (params[i] || ''), '');
      const result = await this.query(sqlString);
      return result.rowCount || 0;
    }
  };

  $queryRaw = async (query: TemplateStringsArray | string, ...params: any[]) => {
    if (typeof query === 'string') {
      const result = await this.query(query, params);
      return result.rows;
    } else {
      // Handle template literals
      const sqlString = query.reduce((acc, part, i) => acc + part + (params[i] || ''), '');
      const result = await this.query(sqlString);
      return result.rows;
    }
  };
}

// Create singleton instance
const databaseClient = new EnhancedDatabaseClient();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database connections...');
  await databaseClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database connections...');
  await databaseClient.close();
  process.exit(0);
});

// Default export
export default databaseClient;

// Named exports for backward compatibility
export const db = databaseClient;
export const query = databaseClient.query.bind(databaseClient);
export const transaction = databaseClient.transaction.bind(databaseClient);
export const healthCheck = databaseClient.healthCheck.bind(databaseClient);

// User operations
export const getUserById = databaseClient.getUserById.bind(databaseClient);
export const getUserByEmail = databaseClient.getUserByEmail.bind(databaseClient);
export const createUser = databaseClient.createUser.bind(databaseClient);
export const updateUser = databaseClient.updateUser.bind(databaseClient);

// Session operations
export const createSession = databaseClient.createSession.bind(databaseClient);
export const getSession = databaseClient.getSession.bind(databaseClient);
export const deleteSession = databaseClient.deleteSession.bind(databaseClient);

// Legacy compatibility
export const findUserById = getUserById;
export const findUserByEmail = getUserByEmail;
export const findSession = getSession;
export const executeRawSQL = query;
export const queryRawSQL = query;
export const checkDatabaseHealth = healthCheck;
export const findAllEvents = databaseClient.getAllEvents.bind(databaseClient);

// Type exports
export type { User, Club, Post, Project, Task };
