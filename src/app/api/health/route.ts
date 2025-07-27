import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database";
import { DatabaseRouter } from "@/lib/DatabaseRouter";
import { CacheManager } from "@/lib/CacheManager";
import { SessionManager } from "@/lib/SessionManager";
import { WebSocketManager } from "@/lib/WebSocketManager";

export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - startTime;
    
    // Check database router stats
    const dbStats = DatabaseRouter.getStats();
    const dbRouterHealth = await DatabaseRouter.healthCheck();

    // Check cache connection
    const cacheStats = await CacheManager.getStats();
    const cacheHealthy = cacheStats?.connected || false;

    // Check session manager
    const sessionStats = SessionManager.getStats();
    
    // Check WebSocket stats
    const wsStats = WebSocketManager.getStats();

    // Overall health status
    const isHealthy = dbHealthy && cacheHealthy && dbRouterHealth.healthy;
    const status = isHealthy ? 'healthy' : 'unhealthy';

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      instance: process.env.INSTANCE_ID || 'unknown',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealthy && dbRouterHealth.healthy ? 'healthy' : 'unhealthy',
          responseTime: dbResponseTime,
          master: dbRouterHealth.master,
          replicas: dbRouterHealth.replicas,
          connections: dbStats
        },
        cache: {
          status: cacheHealthy ? 'healthy' : 'unhealthy',
          connected: cacheHealthy,
          memory: cacheStats?.usedMemory || 'unknown',
          keys: cacheStats?.totalKeys || 0
        },
        sessions: {
          status: 'healthy',
          activeSessions: sessionStats.totalActiveSessions,
          uniqueUsers: sessionStats.uniqueUsers
        },
        websocket: {
          status: 'healthy',
          connections: wsStats?.totalConnections || 0,
          rooms: wsStats?.totalRooms || 0
        }
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });

  } catch (error) {
    console.error("Health check error:", error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

// Simple ping endpoint for load balancers
export async function HEAD() {
  try {
    // Quick health check without detailed info
    const dbHealthy = await checkDatabaseHealth();
    
    if (dbHealthy) {
      return new Response(null, { status: 200 });
    } else {
      return new Response(null, { status: 503 });
    }
  } catch {
    return new Response(null, { status: 503 });
  }
}
