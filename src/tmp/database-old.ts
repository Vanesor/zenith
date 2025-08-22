/**
 * Optimized PostgreSQL Database Client
 * High-performance direct PostgreSQL operations with advanced features
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { performance } from 'perf_hooks';

interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
  readOnly?: boolean;
}

interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  averageTime: number;
  errors: number;
}

class OptimizedDatabaseClient {
  private pool: Pool;
  private queryStats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    averageTime: 0,
    errors: 0
  };
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'zenith',
      user: process.env.DB_USER || 'zenithpostgres',
      password: process.env.DB_PASSWORD || 'AtharvaAyush',
      max: 25, // Increased pool size
      idleTimeoutMillis: 60000, // Increased idle timeout
      connectionTimeoutMillis: 5000, // Increased connection timeout
      acquireTimeoutMillis: 10000, // Wait time for connection from pool
      createTimeoutMillis: 10000, // Time to establish new connection
      destroyTimeoutMillis: 5000, // Time to close connection
      reapIntervalMillis: 1000, // How often to check for idle connections
      createRetryIntervalMillis: 200, // Retry interval for failed connections
      // Optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    };

    this.pool = new Pool(dbConfig);
    this.setupEventHandlers();
    this.initializeConnection();
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('✅ Database client connected to pool');
      // Set optimal PostgreSQL settings for each connection
      client.query(`
        SET statement_timeout = '30s';
        SET lock_timeout = '10s';
        SET idle_in_transaction_session_timeout = '60s';
      `).catch(console.warn);
    });

    this.pool.on('acquire', () => {
      console.log('🔗 Database client acquired from pool');
    });

    this.pool.on('error', (err: Error) => {
      console.error('❌ Database pool error:', {
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });

    this.pool.on('remove', () => {
      console.log('🔄 Database client removed from pool');
    });
  }

  private async initializeConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      // Get comprehensive database information
      const info = await client.query(`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          current_setting('server_version') as postgres_version,
          current_setting('max_connections') as max_connections,
          current_setting('shared_buffers') as shared_buffers,
          now() as connected_at
      `);

      console.log('🗄️ Database Information:', {
        database: info.rows[0].database,
        user: info.rows[0].user,
        postgres_version: info.rows[0].postgres_version,
        max_connections: info.rows[0].max_connections,
        shared_buffers: info.rows[0].shared_buffers,
        connected_at: info.rows[0].connected_at
      });

      // Test query performance
      const perfStart = performance.now();
      await client.query('SELECT 1 as test');
      const perfEnd = performance.now();
      
      console.log(`⚡ Database response time: ${(perfEnd - perfStart).toFixed(2)}ms`);
      
      client.release();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute optimized query with caching, retries, and performance monitoring
   */
  async query(text: string, params?: any[], options: QueryOptions = {}): Promise<QueryResult> {
    const {
      timeout = 30000,
      retries = 3,
      cache = false
    } = options;

    const cacheKey = cache ? `${text}:${JSON.stringify(params)}` : null;
    
    // Check cache first
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        console.log('📋 Query result from cache');
        return cached.result;
      } else {
        this.queryCache.delete(cacheKey);
      }
    }

    const startTime = performance.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool.connect();
        
        try {
          // Set query timeout
          await client.query(`SET statement_timeout = '${timeout}ms'`);
          
          const result = await client.query(text, params);
          const duration = performance.now() - startTime;
          
          // Update statistics
          this.updateQueryStats(duration);
          
          // Log query performance
          this.logQuery(text, params, duration, result.rowCount);
          
          // Cache result if requested
          if (cacheKey && cache) {
            this.queryCache.set(cacheKey, {
              result,
              timestamp: Date.now(),
              ttl: this.CACHE_TTL
            });
          }
          
          client.release();
          return result;
          
        } catch (queryError) {
          client.release();
          throw queryError;
        }
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          console.warn(`⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.queryStats.errors++;
    console.error('❌ Query failed after all retries:', {
      query: text.substring(0, 100),
      error: lastError?.message,
      attempts: retries
    });
    
    throw lastError;
  }

  /**
   * Execute optimized transaction with isolation levels and rollback safety
   */
  async transaction<T>(
    operations: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      isolationLevel = 'READ COMMITTED',
      timeout = 60000,
      readOnly = false
    } = options;

    const client = await this.pool.connect();
    const startTime = performance.now();
    
    try {
      // Set transaction timeout
      await client.query(`SET statement_timeout = '${timeout}ms'`);
      
      // Begin transaction with options
      let beginQuery = 'BEGIN';
      if (readOnly) beginQuery += ' READ ONLY';
      await client.query(beginQuery);
      
      // Set isolation level
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      
      console.log(`🔄 Transaction started (${isolationLevel}${readOnly ? ', READ ONLY' : ''})`);
      
      // Execute operations
      const result = await operations(client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      const duration = performance.now() - startTime;
      console.log(`✅ Transaction completed successfully in ${duration.toFixed(2)}ms`);
      
      return result;
      
    } catch (error) {
      // Rollback on error
      try {
        await client.query('ROLLBACK');
        console.log('🔄 Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      const duration = performance.now() - startTime;
      console.error(`❌ Transaction failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a single transaction efficiently
   */
  async batch(queries: Array<{ text: string; params?: any[] }>): Promise<QueryResult[]> {
    return this.transaction(async (client) => {
      const results: QueryResult[] = [];
      
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }
      
      return results;
    });
  }

  /**
   * Prepared statement execution for repeated queries
   */
  async preparedQuery(name: string, text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    
    try {
      // Prepare statement if not exists
      await client.query(`PREPARE ${name} AS ${text}`);
      
      // Execute prepared statement
      const paramPlaceholders = params ? params.map((_, i) => `$${i + 1}`).join(', ') : '';
      const result = await client.query(`EXECUTE ${name}${paramPlaceholders ? `(${paramPlaceholders})` : ''}`, params);
      
      return result;
      
    } finally {
      client.release();
    }
  }

  /**
   * Stream large result sets efficiently
   */
  async* queryStream(text: string, params?: any[], batchSize: number = 1000) {
    const client = await this.pool.connect();
    
    try {
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const paginatedQuery = `${text} LIMIT ${batchSize} OFFSET ${offset}`;
        const result = await client.query(paginatedQuery, params);
        
        if (result.rows.length === 0) {
          hasMore = false;
        } else {
          yield result.rows;
          offset += batchSize;
          hasMore = result.rows.length === batchSize;
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get a client for manual connection management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Health check with comprehensive diagnostics
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: {
      connection: boolean;
      queryPerformance: number;
      poolStatus: any;
      stats: QueryStats;
    }
  }> {
    try {
      const startTime = performance.now();
      await this.query('SELECT 1 as health');
      const queryTime = performance.now() - startTime;
      
      return {
        healthy: true,
        details: {
          connection: true,
          queryPerformance: queryTime,
          poolStatus: this.getPoolStatus(),
          stats: this.queryStats
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          connection: false,
          queryPerformance: -1,
          poolStatus: this.getPoolStatus(),
          stats: this.queryStats
        }
      };
    }
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log('🧹 Query cache cleared');
  }

  /**
   * Get detailed pool status
   */
  getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxSize: 25,
      usage: `${this.pool.totalCount}/25`
    };
  }

  /**
   * Get query performance statistics
   */
  getStats(): QueryStats & { cacheSize: number; slowQueryThreshold: number } {
    return {
      ...this.queryStats,
      cacheSize: this.queryCache.size,
      slowQueryThreshold: this.SLOW_QUERY_THRESHOLD
    };
  }

  /**
   * Close all connections gracefully
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Database pool closed');
  }

  private updateQueryStats(duration: number): void {
    this.queryStats.totalQueries++;
    
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.queryStats.slowQueries++;
    }
    
    // Update rolling average
    this.queryStats.averageTime = 
      (this.queryStats.averageTime * (this.queryStats.totalQueries - 1) + duration) / 
      this.queryStats.totalQueries;
  }

  private logQuery(text: string, params: any[] | undefined, duration: number, rowCount: number | null): void {
    const isSlowQuery = duration > this.SLOW_QUERY_THRESHOLD;
    const logLevel = isSlowQuery ? 'warn' : 'log';
    
    const logData = {
      query: text.replace(/\s+/g, ' ').trim().substring(0, 100),
      params: params ? params.length : 0,
      duration: `${duration.toFixed(2)}ms`,
      rows: rowCount,
      slow: isSlowQuery,
      timestamp: new Date().toISOString()
    };

    if (isSlowQuery) {
      console.warn('🐌 Slow Query Detected:', logData);
    } else {
      console.log('📊 Query:', logData);
    }
  }
}

// Create singleton instance
const databaseClient = new OptimizedDatabaseClient();

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

export default databaseClient;

// Backward compatibility methods
export class DatabaseClient {
  static query = databaseClient.query.bind(databaseClient);
  static transaction = databaseClient.transaction.bind(databaseClient);
  static getClient = databaseClient.getClient.bind(databaseClient);
  static healthCheck = databaseClient.healthCheck.bind(databaseClient);
  static getPoolStatus = databaseClient.getPoolStatus.bind(databaseClient);

  // User operations for backward compatibility
  static async getUserById(userId: string) {
    const result = await databaseClient.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async getUserByEmail(email: string) {
    const result = await databaseClient.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async createUser(userData: {
    id?: string;
    email: string;
    password_hash: string;
    name: string;
    username?: string;
    role?: string;
    club_id?: string;
  }) {
    const { id, email, password_hash, name, username, role, club_id } = userData;
    const userId = id || require('crypto').randomUUID();
    
    const result = await databaseClient.query(`
      INSERT INTO users (id, email, password_hash, name, username, role, club_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [userId, email, password_hash, name, username || null, role || 'user', club_id || null]);
    
    return result.rows[0];
  }

  static async updateUser(userId: string, updateData: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await databaseClient.query(`
      UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId, ...values]);
    
    return result.rows[0];
  }

  // Event operations
  static async getEventsByClub(clubId: string) {
    const result = await databaseClient.query(`
      SELECT e.*, c.name as club_name 
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      WHERE e.club_id = $1
      ORDER BY e.event_date ASC
    `, [clubId]);
    return result.rows;
  }

  static async getAllEvents() {
    const result = await databaseClient.query(`
      SELECT e.*, c.name as club_name 
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      ORDER BY e.event_date ASC
    `);
    return result.rows;
  }

  // Club operations
  static async getClubById(clubId: string) {
    const result = await databaseClient.query(
      'SELECT * FROM clubs WHERE id = $1',
      [clubId]
    );
    return result.rows[0] || null;
  }

  static async getAllClubs() {
    const result = await databaseClient.query('SELECT * FROM clubs ORDER BY name ASC');
    return result.rows;
  }

  // Session operations
  static async createSession(sessionData: {
    id: string;
    user_id: string;
    expires_at: Date;
  }) {
    const { id, user_id, expires_at } = sessionData;
    
    const result = await databaseClient.query(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [id, user_id, expires_at]);
    
    return result.rows[0];
  }

  static async getSession(sessionId: string) {
    const result = await databaseClient.query(`
      SELECT s.*, u.email, u.name, u.role, u.club_id
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW()
    `, [sessionId]);
    
    return result.rows[0] || null;
  }

  static async deleteSession(sessionId: string) {
    await databaseClient.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }

  static async cleanExpiredSessions() {
    const result = await databaseClient.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    console.log(`🧹 Cleaned ${result.rowCount} expired sessions`);
  }

  // Table-like accessors for backward compatibility
  static users = {
    findFirst: async (options: any) => {
      if (options.where?.email) {
        return await DatabaseClient.getUserByEmail(options.where.email);
      }
      if (options.where?.id) {
        return await DatabaseClient.getUserById(options.where.id);
      }
      const result = await databaseClient.query('SELECT * FROM users LIMIT 1');
      return result.rows[0] || null;
    },
    findUnique: async (options: any) => {
      if (options.where?.email) {
        return await DatabaseClient.getUserByEmail(options.where.email);
      }
      if (options.where?.id) {
        return await DatabaseClient.getUserById(options.where.id);
      }
      return null;
    },
    create: async (options: any) => {
      return await DatabaseClient.createUser(options.data);
    },
    update: async (options: any) => {
      const { where, data } = options;
      if (where.id) {
        return await DatabaseClient.updateUser(where.id, data);
      }
      throw new Error('Update requires user ID');
    },
    delete: async (options: any) => {
      const { where } = options;
      if (where.id) {
        const result = await databaseClient.query('DELETE FROM users WHERE id = $1 RETURNING *', [where.id]);
        return result.rows[0] || null;
      }
      throw new Error('Delete requires user ID');
    },
    findMany: async (options?: any) => {
      let query = 'SELECT * FROM users';
      const params: any[] = [];
      
      if (options?.where) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        if (options.where.role) {
          conditions.push(`role = $${paramIndex++}`);
          params.push(options.where.role);
        }
        if (options.where.club_id) {
          conditions.push(`club_id = $${paramIndex++}`);
          params.push(options.where.club_id);
        }
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      if (options?.orderBy) {
        query += ' ORDER BY created_at DESC';
      }
      
      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await databaseClient.query(query, params);
      return result.rows;
    },
    count: async (options?: any) => {
      let query = 'SELECT COUNT(*) as count FROM users';
      const params: any[] = [];
      
      if (options?.where) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        if (options.where.role) {
          conditions.push(`role = $${paramIndex++}`);
          params.push(options.where.role);
        }
        if (options.where.created_at) {
          if (options.where.created_at.gte) {
            conditions.push(`created_at >= $${paramIndex++}`);
            params.push(options.where.created_at.gte);
          }
        }
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      const result = await databaseClient.query(query, params);
      return parseInt(result.rows[0].count);
    },
    groupBy: async (options: any) => {
      const groupField = options.by[0];
      const query = `
        SELECT ${groupField}, COUNT(*) as _count
        FROM users 
        GROUP BY ${groupField}
        ORDER BY ${groupField}
      `;
      const result = await databaseClient.query(query);
      return result.rows.map((row: any) => ({
        role: row[groupField],
        _count: { role: parseInt(row._count) }
      }));
    }
  };

  static clubs = {
    findMany: async (options?: any) => {
      let query = 'SELECT * FROM clubs';
      
      if (options?.orderBy) {
        query += ' ORDER BY name ASC';
      }
      
      const result = await databaseClient.query(query);
      return result.rows;
    },
    count: async () => {
      const result = await databaseClient.query('SELECT COUNT(*) as count FROM clubs');
      return parseInt(result.rows[0].count);
    }
  };

  static events = {
    findMany: async (options?: any) => {
      let query = 'SELECT e.*, c.name as club_name FROM events e LEFT JOIN clubs c ON e.club_id = c.id';
      const params: any[] = [];
      
      if (options?.where?.club_id) {
        query += ' WHERE e.club_id = $1';
        params.push(options.where.club_id);
      }
      
      if (options?.where?.event_date?.gte) {
        const whereClause = params.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} e.event_date >= $${params.length + 1}`;
        params.push(options.where.event_date.gte);
      }
      
      query += ' ORDER BY e.event_date ASC';
      
      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await databaseClient.query(query, params);
      return result.rows;
    },
    count: async (options?: any) => {
      let query = 'SELECT COUNT(*) as count FROM events';
      const params: any[] = [];
      
      if (options?.where) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        if (options.where.event_date?.gte) {
          conditions.push(`event_date >= $${paramIndex++}`);
          params.push(options.where.event_date.gte);
        }
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      const result = await databaseClient.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  static assignments = {
    findMany: async (options?: any) => {
      let query = 'SELECT * FROM assignments';
      const params: any[] = [];
      
      if (options?.where) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        if (options.where.due_date?.gte) {
          conditions.push(`due_date >= $${paramIndex++}`);
          params.push(options.where.due_date.gte);
        }
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += ' ORDER BY due_date ASC';
      
      const result = await databaseClient.query(query, params);
      return result.rows;
    },
    count: async (options?: any) => {
      let query = 'SELECT COUNT(*) as count FROM assignments';
      const params: any[] = [];
      
      if (options?.where?.due_date?.gte) {
        query += ' WHERE due_date >= $1';
        params.push(options.where.due_date.gte);
      }
      
      const result = await databaseClient.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  static posts = {
    count: async (options?: any) => {
      let query = 'SELECT COUNT(*) as count FROM posts';
      const params: any[] = [];
      
      if (options?.where?.created_at?.gte) {
        query += ' WHERE created_at >= $1';
        params.push(options.where.created_at.gte);
      }
      
      const result = await databaseClient.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  static comments = {
    count: async () => {
      const result = await databaseClient.query('SELECT COUNT(*) as count FROM comments');
      return parseInt(result.rows[0].count);
    }
  };

  static club_members = {
    findMany: async () => {
      const result = await databaseClient.query('SELECT * FROM club_members');
      return result.rows;
    },
    count: async (options?: any) => {
      let query = 'SELECT COUNT(*) as count FROM club_members';
      const params: any[] = [];
      
      if (options?.where?.club_id) {
        query += ' WHERE club_id = $1';
        params.push(options.where.club_id);
      }
      
      const result = await databaseClient.query(query, params);
      return parseInt(result.rows[0].count);
    }
  };

  static user_activities = {
    findMany: async (options?: any) => {
      let query = 'SELECT ua.*, u.name, u.email FROM user_activities ua LEFT JOIN users u ON ua.user_id = u.id';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (options?.where?.created_at?.gte) {
        query += ` WHERE ua.created_at >= $${paramIndex++}`;
        params.push(options.where.created_at.gte);
      }
      
      if (options?.orderBy?.created_at) {
        query += ' ORDER BY ua.created_at DESC';
      }
      
      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }
      
      const result = await databaseClient.query(query, params);
      return result.rows.map((row: any) => ({
        ...row,
        users: row.name ? { name: row.name, email: row.email } : null
      }));
    }
  };
}

// Backward compatibility exports
export const db = DatabaseClient;
export const findUserById = DatabaseClient.getUserById.bind(DatabaseClient);
export const findUserByEmail = DatabaseClient.getUserByEmail.bind(DatabaseClient);
export const createUser = DatabaseClient.createUser.bind(DatabaseClient);
export const updateUser = DatabaseClient.updateUser.bind(DatabaseClient);
export const createSession = DatabaseClient.createSession.bind(DatabaseClient);
export const findSession = DatabaseClient.getSession.bind(DatabaseClient);
export const executeRawSQL = DatabaseClient.query.bind(DatabaseClient);
export const queryRawSQL = DatabaseClient.query.bind(DatabaseClient);
export const checkDatabaseHealth = DatabaseClient.healthCheck.bind(DatabaseClient);
export const findAllEvents = DatabaseClient.getAllEvents.bind(DatabaseClient);
