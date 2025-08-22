// Enhanced Cache Manager with LRU eviction and better performance
interface CacheItem {
  data: unknown;
  expires: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
}

// Enhanced in-memory cache store with LRU capability
const cache = new Map<string, CacheItem>();
const cacheMetrics = {
  hitCount: 0,
  missCount: 0,
  evictionCount: 0,
  maxSize: 50 * 1024 * 1024, // 50MB max cache size
  currentSize: 0
};

// Cache cleanup with LRU eviction - runs every minute instead of 5 minutes
setInterval(() => {
  cleanupExpired();
  enforceSizeLimit();
}, 60 * 1000); // Every minute for better performance

function calculateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes (UTF-16)
  } catch {
    return 1000; // Default size for non-serializable data
  }
}

function cleanupExpired(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cacheMetrics.currentSize -= item.size;
      cache.delete(key);
      cleanedCount++;
      cacheMetrics.evictionCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cache: Cleaned ${cleanedCount} expired items`);
  }
}

function enforceSizeLimit(): void {
  if (cacheMetrics.currentSize <= cacheMetrics.maxSize) return;
  
  // Convert to array and sort by LRU (least recently used first)
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  let removedCount = 0;
  for (const [key, item] of entries) {
    if (cacheMetrics.currentSize <= cacheMetrics.maxSize * 0.8) break; // Keep 20% buffer
    
    cacheMetrics.currentSize -= item.size;
    cache.delete(key);
    removedCount++;
    cacheMetrics.evictionCount++;
  }
  
  if (removedCount > 0) {
    console.log(`Cache: LRU evicted ${removedCount} items to maintain size limit`);
  }
}

export class CacheManager {
  // Get cached data with LRU tracking
  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = cache.get(key);
      if (!item) {
        cacheMetrics.missCount++;
        return null;
      }
      
      // Check if expired
      const now = Date.now();
      if (now > item.expires) {
        cacheMetrics.currentSize -= item.size;
        cache.delete(key);
        cacheMetrics.missCount++;
        cacheMetrics.evictionCount++;
        return null;
      }
      
      // Update access tracking for LRU
      item.lastAccessed = now;
      item.accessCount++;
      cacheMetrics.hitCount++;
      
      return item.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      cacheMetrics.missCount++;
      return null;
    }
  }

  // Set cached data with size tracking
  static async set(key: string, data: unknown, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      const now = Date.now();
      const expires = now + (ttlSeconds * 1000);
      const size = calculateSize(data);
      
      // Remove existing item if present
      const existingItem = cache.get(key);
      if (existingItem) {
        cacheMetrics.currentSize -= existingItem.size;
      }
      
      // Check if adding this item would exceed size limit
      if (cacheMetrics.currentSize + size > cacheMetrics.maxSize) {
        enforceSizeLimit();
      }
      
      // If still too large after cleanup, reject
      if (cacheMetrics.currentSize + size > cacheMetrics.maxSize) {
        console.warn(`Cache: Item too large to cache (${size} bytes), max: ${cacheMetrics.maxSize}`);
        return false;
      }
      
      const item: CacheItem = {
        data,
        expires,
        lastAccessed: now,
        accessCount: 1,
        size
      };
      
      cache.set(key, item);
      cacheMetrics.currentSize += size;
      
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
      const size = calculateSize(data);
      const now = Date.now();
      
      // Remove existing item if present
      const existingItem = cache.get(key);
      if (existingItem) {
        cacheMetrics.currentSize -= existingItem.size;
      }
      
      const item: CacheItem = {
        data,
        expires,
        lastAccessed: now,
        accessCount: 1,
        size
      };
      
      cache.set(key, item);
      cacheMetrics.currentSize += size;
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
  static async getStats(): Promise<CacheStats | null> {
    try {
      const hitRate = cacheMetrics.hitCount + cacheMetrics.missCount > 0 
        ? (cacheMetrics.hitCount / (cacheMetrics.hitCount + cacheMetrics.missCount)) * 100
        : 0;
        
      return {
        totalItems: cache.size,
        totalSize: cacheMetrics.currentSize,
        hitCount: cacheMetrics.hitCount,
        missCount: cacheMetrics.missCount,
        evictionCount: cacheMetrics.evictionCount,
        hitRate: Math.round(hitRate * 100) / 100
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return null;
    }
  }

  // Clear all cache
  static async clear(): Promise<boolean> {
    try {
      cache.clear();
      cacheMetrics.currentSize = 0;
      cacheMetrics.hitCount = 0;
      cacheMetrics.missCount = 0;
      cacheMetrics.evictionCount = 0;
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
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
