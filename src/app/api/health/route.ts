import { NextResponse } from "next/server";
import { db, checkDatabaseHealth } from '@/lib/database';
import { CacheManager } from "@/lib/CacheManager";
import { MonitoringService } from "@/lib/MonitoringService";
import { WebSocketManager } from "@/lib/WebSocketManager";

export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    const dbResponseTime = Date.now() - startTime;
    
    // Check database health with db instance
    const prismaHealthy = await checkDatabaseHealth();
    const prismaResponseTime = Date.now() - startTime;

    // Check cache connection  
    const cacheStats = await CacheManager.getStats();
    const cacheHealthy = cacheStats ? true : false;

    // Check session manager
    const monitoringService = MonitoringService.getInstance();
    const systemStats = await monitoringService.getSystemStats();
    const sessionStats = systemStats.sessions;
    
    // Overall health status
    const isHealthy = dbHealthy && prismaHealthy && cacheHealthy;
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
          legacy: { status: dbHealthy ? 'healthy' : 'unhealthy', responseTime: dbResponseTime },
          prisma: { status: prismaHealthy ? 'healthy' : 'unhealthy', responseTime: prismaResponseTime }
        },
        cache: {
          status: cacheHealthy ? 'healthy' : 'unhealthy',
          connected: cacheHealthy,
          stats: cacheStats || {}
        },
        sessions: {
          status: 'healthy',
          activeSessions: sessionStats.totalActiveSessions || 0,
          uniqueUsers: sessionStats.uniqueUsers || 0
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
