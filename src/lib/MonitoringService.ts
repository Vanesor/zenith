import { CacheManager } from './CacheManager';
import { SessionManager } from './SessionManager';
import { getDatabaseStatus } from './database';

export interface SystemStats {
  timestamp: Date;
  database: {
    connected: boolean;
    responseTime: number;
  };
  cache: {
    totalItems: number;
    totalSize: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
    hitRate: number;
  } | null;
  sessions: {
    totalActiveSessions: number;
    uniqueUsers: number;
    averageSessionsPerUser: number;
  };
  api: {
    totalRequests: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  websocket: {
    connectedUsers: number;
    totalSockets: number;
    activeRooms: number;
  };
}

export interface ApiMetrics {
  endpoint: string;
  method: string;
  count: number;
  avgResponseTime: number;
  errorCount: number;
  lastCalled: Date;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metricsInterval: NodeJS.Timeout | null = null;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Start collecting metrics
  startMonitoring(): void {
    console.log('Starting system monitoring...');
    
    // Collect metrics every minute
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, 60000);

    // Collect initial metrics
    this.collectMetrics();
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('System monitoring stopped');
  }

  // Collect system metrics
  private async collectMetrics(): Promise<void> {
    try {
      const stats = await this.getSystemStats();
      
      // Store metrics in cache for dashboard
      await CacheManager.set('system:stats', stats, 300); // 5 minutes TTL
      
      // Log critical issues
      if (!stats.database.connected) {
        console.error('CRITICAL: Database connection lost');
      }
      
      if (stats.sessions.totalActiveSessions > 1000) {
        console.warn(`HIGH LOAD: ${stats.sessions.totalActiveSessions} active sessions`);
      }
      
      if (stats.api.errorRate > 5) {
        console.warn(`HIGH ERROR RATE: ${stats.api.errorRate}% API errors`);
      }

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  // Get current system statistics
  async getSystemStats(): Promise<SystemStats> {
    const [dbStatus, cacheStats, sessionStats] = await Promise.all([
      this.getDatabaseStats(),
      CacheManager.getStats(),
      SessionManager.getStats()
    ]);

    const apiStats = await this.getApiStats();
    const wsStats = await this.getWebSocketStats();

    return {
      timestamp: new Date(),
      database: dbStatus,
      cache: cacheStats,
      sessions: sessionStats,
      api: apiStats,
      websocket: wsStats
    };
  }

  // Database health and performance
  private async getDatabaseStats(): Promise<{
    connected: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const connected = getDatabaseStatus();
    const responseTime = Date.now() - startTime;

    return { connected, responseTime };
  }

  // API usage statistics
  private async getApiStats(): Promise<{
    totalRequests: number;
    requestsPerMinute: number;
    errorRate: number;
  }> {
    // Get total requests from cache
    const totalRequests = await CacheManager.get<number>('metrics:total_requests') || 0;
    
    // Get requests in last minute
    const recentRequests = await CacheManager.get<number>('metrics:requests_last_minute') || 0;
    
    // Get error count
    const totalErrors = await CacheManager.get<number>('metrics:total_errors') || 0;
    
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      totalRequests,
      requestsPerMinute: recentRequests,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  // WebSocket statistics
  private async getWebSocketStats(): Promise<{
    connectedUsers: number;
    totalSockets: number;
    activeRooms: number;
  }> {
    // This would integrate with your WebSocket manager
    // For now, return mock data
    return {
      connectedUsers: await CacheManager.get<number>('ws:connected_users') || 0,
      totalSockets: await CacheManager.get<number>('ws:total_sockets') || 0,
      activeRooms: await CacheManager.get<number>('ws:active_rooms') || 0
    };
  }

  // Track API request
  async trackApiRequest(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    const key = `api:${method}:${endpoint}`;
    
    // Increment total requests
    await CacheManager.increment('metrics:total_requests');
    await CacheManager.increment('metrics:requests_last_minute');
    
    // Track errors
    if (statusCode >= 400) {
      await CacheManager.increment('metrics:total_errors');
      await CacheManager.increment(`${key}:errors`);
    }
    
    // Track endpoint specific metrics
    await CacheManager.increment(`${key}:count`);
    
    // Store response time (simple average for now)
    const currentAvg = await CacheManager.get<number>(`${key}:avg_time`) || 0;
    const currentCount = await CacheManager.get<number>(`${key}:count`) || 1;
    const newAvg = (currentAvg * (currentCount - 1) + responseTime) / currentCount;
    
    await CacheManager.set(`${key}:avg_time`, newAvg, 3600);
    await CacheManager.set(`${key}:last_called`, new Date().toISOString(), 3600);

    // Reset minute counter every minute
    setTimeout(async () => {
      await CacheManager.set('metrics:requests_last_minute', 0, 60);
    }, 60000);
  }

  // Get API metrics for dashboard
  async getApiMetrics(limit: number = 10): Promise<ApiMetrics[]> {
    const metrics: ApiMetrics[] = [];
    
    // This would require scanning cache keys
    // For production, you'd want a more efficient approach
    const endpoints = [
      'GET:/api/posts',
      'POST:/api/posts',
      'GET:/api/clubs',
      'POST:/api/auth/login',
      'GET:/api/dashboard',
      'GET:/api/chat/rooms',
      'POST:/api/chat/messages'
    ];

    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(':');
      const key = `api:${method}:${path}`;
      
      const [count, avgTime, errorCount, lastCalled] = await Promise.all([
        CacheManager.get<number>(`${key}:count`),
        CacheManager.get<number>(`${key}:avg_time`),
        CacheManager.get<number>(`${key}:errors`),
        CacheManager.get<string>(`${key}:last_called`)
      ]);

      const requestCount = count || 0;
      const avgResponseTime = avgTime || 0;
      const errors = errorCount || 0;

      if (requestCount > 0) {
        metrics.push({
          endpoint: path,
          method,
          count: requestCount,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          errorCount: errors,
          lastCalled: lastCalled ? new Date(lastCalled) : new Date()
        });
      }
    }

    return metrics
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Alert system for critical issues
  async checkAlerts(): Promise<string[]> {
    const alerts: string[] = [];
    const stats = await this.getSystemStats();

    // Database alerts
    if (!stats.database.connected) {
      alerts.push('🔴 Database connection lost');
    } else if (stats.database.responseTime > 1000) {
      alerts.push('🟡 Database response time high (>1s)');
    }

    // Session alerts
    if (stats.sessions.totalActiveSessions > 1000) {
      alerts.push('🟡 High number of active sessions');
    }

    // API alerts
    if (stats.api.errorRate > 10) {
      alerts.push('🔴 High API error rate (>10%)');
    } else if (stats.api.errorRate > 5) {
      alerts.push('🟡 Elevated API error rate (>5%)');
    }

    // Cache alerts
    if (!stats.cache) {
      alerts.push('🟡 Cache not available');
    } else if (stats.cache.totalItems > 10000) {
      alerts.push('🟡 High cache usage - consider cleanup');
    }

    return alerts;
  }

  // Performance optimization suggestions
  async getOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const stats = await this.getSystemStats();

    if (stats.database.responseTime > 500) {
      suggestions.push('Consider optimizing database queries or adding indexes');
    }

    if (stats.sessions.averageSessionsPerUser > 3) {
      suggestions.push('Users have multiple sessions - consider session cleanup');
    }

    if (!stats.cache) {
      suggestions.push('Consider implementing caching for better performance');
    } else if (stats.cache.hitRate < 50) {
      suggestions.push('Low cache hit rate - consider optimizing cache strategy');
    }

    if (stats.api.requestsPerMinute > 100) {
      suggestions.push('Consider implementing more aggressive caching');
    }

    return suggestions;
  }

  // Export metrics for external monitoring tools
  async exportMetrics(): Promise<{
    timestamp: string;
    metrics: SystemStats;
    alerts: string[];
    suggestions: string[];
  }> {
    const [stats, alerts, suggestions] = await Promise.all([
      this.getSystemStats(),
      this.checkAlerts(),
      this.getOptimizationSuggestions()
    ]);

    return {
      timestamp: new Date().toISOString(),
      metrics: stats,
      alerts,
      suggestions
    };
  }
}

// Middleware for automatic API tracking
export function withMonitoring(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;

    try {
      const response = await handler(request);
      const responseTime = Date.now() - startTime;
      
      // Track the request
      await MonitoringService.getInstance().trackApiRequest(
        endpoint,
        method,
        responseTime,
        response.status
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Track the error
      await MonitoringService.getInstance().trackApiRequest(
        endpoint,
        method,
        responseTime,
        500
      );

      throw error;
    }
  };
}

// Initialize monitoring
export function initializeMonitoring(): void {
  const monitoring = MonitoringService.getInstance();
  monitoring.startMonitoring();

  // Graceful shutdown
  process.on('SIGINT', () => {
    monitoring.stopMonitoring();
  });

  process.on('SIGTERM', () => {
    monitoring.stopMonitoring();
  });

  console.log('Monitoring service initialized');
}
