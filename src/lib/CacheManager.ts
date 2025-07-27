import Redis from 'ioredis';

// Initialize Redis connection
let redis: Redis | null = null;

export function initializeRedis(): void {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('disconnect', () => {
      console.log('Redis disconnected');
    });

  } catch (error) {
    console.error('Failed to initialize Redis:', error);
  }
}

// Initialize Redis on module load
initializeRedis();

export class CacheManager {
  // Get cached data
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data with TTL
  static async set(key: string, data: unknown, ttlSeconds: number = 3600): Promise<boolean> {
    if (!redis) return false;
    
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached data
  static async delete(key: string): Promise<boolean> {
    if (!redis) return false;
    
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set with no expiration
  static async setForever(key: string, data: unknown): Promise<boolean> {
    if (!redis) return false;
    
    try {
      await redis.set(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache setForever error:', error);
      return false;
    }
  }

  // Increment counter
  static async increment(key: string, by: number = 1): Promise<number | null> {
    if (!redis) return null;
    
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

  // Get multiple keys
  static async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    if (!redis || keys.length === 0) return [];
    
    try {
      const values = await redis.mget(...keys);
      return values.map((value: string | null) => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache getMultiple error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  // Set multiple keys
  static async setMultiple(data: Record<string, unknown>, ttlSeconds: number = 3600): Promise<boolean> {
    if (!redis) return false;
    
    try {
      const pipeline = redis.pipeline();
      
      for (const [key, value] of Object.entries(data)) {
        pipeline.setex(key, ttlSeconds, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache setMultiple error:', error);
      return false;
    }
  }

  // Clear cache by pattern
  static async clearPattern(pattern: string): Promise<number> {
    if (!redis) return 0;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache clearPattern error:', error);
      return 0;
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    connected: boolean;
    usedMemory: string;
    totalKeys: number;
  } | null> {
    if (!redis) return null;
    
    try {
      const info = await redis.info('memory');
      const dbSize = await redis.dbsize();
      
      const usedMemoryMatch = info.match(/used_memory_human:(.+)/);
      const usedMemory = usedMemoryMatch ? usedMemoryMatch[1].trim() : 'Unknown';
      
      return {
        connected: redis.status === 'ready',
        usedMemory,
        totalKeys: dbSize
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return null;
    }
  }
}

// Cache key generators for consistent naming
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userPosts: (userId: string) => `user:${userId}:posts`,
  clubPosts: (clubId: string) => `club:${clubId}:posts`,
  clubMembers: (clubId: string) => `club:${clubId}:members`,
  postComments: (postId: string) => `post:${postId}:comments`,
  notifications: (userId: string) => `user:${userId}:notifications`,
  chatRooms: (userId: string) => `user:${userId}:chat_rooms`,
  chatMessages: (roomId: string) => `chat:${roomId}:messages`,
  viewCount: (postId: string) => `post:${postId}:views`,
  likeCount: (postId: string) => `post:${postId}:likes`,
  sessionCount: () => 'stats:active_sessions',
  apiCalls: (endpoint: string) => `api:${endpoint}:calls`,
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redis) {
    console.log('Closing Redis connection...');
    await redis.quit();
    redis = null;
  }
});

process.on('SIGTERM', async () => {
  if (redis) {
    console.log('Closing Redis connection...');
    await redis.quit();
    redis = null;
  }
});
