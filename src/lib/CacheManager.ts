// Simple in-memory cache implementation
interface CacheItem {
  data: unknown;
  expires: number;
}

// In-memory cache store
const cache = new Map<string, CacheItem>();

// Cl}s every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class CacheManager {
  // Get cached data
  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = cache.get(key);
      if (!item) return null;
      
      // Check if expired
      if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
      }
      
      return item.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data with TTL
  static async set(key: string, data: unknown, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      const expires = Date.now() + (ttlSeconds * 1000);
      cache.set(key, { data, expires });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached data
  static async delete(key: string): Promise<boolean> {
    try {
      return cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const item = cache.get(key);
      if (!item) return false;
      
      // Check if expired
      if (Date.now() > item.expires) {
        cache.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set with no expiration
  static async setForever(key: string, data: unknown): Promise<boolean> {
    try {
      // Set with very long expiration (100 years)
      const expires = Date.now() + (100 * 365 * 24 * 60 * 60 * 1000);
      cache.set(key, { data, expires });
      return true;
    } catch (error) {
      console.error('Cache setForever error:', error);
      return false;
    }
  }

  // Increment counter
  static async increment(key: string, by: number = 1): Promise<number | null> {
    try {
      const current = await this.get<number>(key) || 0;
      const newValue = current + by;
      await this.set(key, newValue, 3600);
      return newValue;
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

  // Get multiple keys
  static async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    
    try {
      const promises = keys.map(key => this.get<T>(key));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Cache getMultiple error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  // Set multiple keys
  static async setMultiple(data: Record<string, unknown>, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      const promises = Object.entries(data).map(([key, value]) => 
        this.set(key, value, ttlSeconds)
      );
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('Cache setMultiple error:', error);
      return false;
    }
  }

  // Clear cache by pattern
  static async clearPattern(pattern: string): Promise<number> {
    try {
      let count = 0;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key);
          count++;
        }
      }
      
      return count;
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
    try {
      return {
        connected: true,
        usedMemory: `${cache.size} items (in-memory)`,
        totalKeys: cache.size
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
