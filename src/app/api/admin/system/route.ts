import { NextRequest, NextResponse } from "next/server";
import { withAuth, MANAGEMENT_ROLES } from "@/lib/auth-unified";
import { MonitoringService, SystemStats } from "@/lib/MonitoringService";
import { CacheManager } from "@/lib/CacheManager";
import { SessionManager } from "@/lib/SessionManager";

export const GET = withAuth(async () => {
  try {
    const monitoring = MonitoringService.getInstance();
    
    const [
      systemStats,
      apiMetrics,
      alerts,
      suggestions,
      sessionStats
    ] = await Promise.all([
      monitoring.getSystemStats(),
      monitoring.getApiMetrics(15),
      monitoring.checkAlerts(),
      monitoring.getOptimizationSuggestions(),
      monitoring.getSystemStats().then(stats => stats.sessions)
    ]);

    // Get additional system info
    const cacheStats = await CacheManager.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          timestamp: new Date().toISOString(),
          status: alerts.length === 0 ? 'healthy' : alerts.some(a => a.includes('🔴')) ? 'critical' : 'warning',
          uptime: process.uptime(),
        },
        stats: systemStats,
        apiMetrics,
        alerts,
        suggestions,
        sessions: {
          ...sessionStats,
          details: await getSessionDetails()
        },
        cache: cacheStats,
        performance: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        }
      }
    });

  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch system statistics" },
      { status: 500 }
    );
  }
}, {
  allowedRoles: MANAGEMENT_ROLES
});

// Get detailed session information
async function getSessionDetails() {
  try {
    // Get recent session activity from cache
    const recentSessions = await CacheManager.get('recent_sessions') || [];
    
    return {
      recent: recentSessions,
      trends: {
        hourly: await getHourlySessionTrends(),
        daily: await getDailySessionTrends()
      }
    };
  } catch (error) {
    console.error("Error getting session details:", error);
    return { recent: [], trends: { hourly: [], daily: [] } };
  }
}

// Get hourly session trends (last 24 hours)
async function getHourlySessionTrends() {
  const trends = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const hourKey = `sessions:hour:${hour.toISOString().slice(0, 13)}`;
    const count = await CacheManager.get<number>(hourKey) || 0;
    
    trends.push({
      hour: hour.getHours(),
      timestamp: hour.toISOString(),
      sessions: count
    });
  }
  
  return trends;
}

// Get daily session trends (last 7 days)
async function getDailySessionTrends() {
  const trends = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dayKey = `sessions:day:${day.toISOString().slice(0, 10)}`;
    const count = await CacheManager.get<number>(dayKey) || 0;
    
    trends.push({
      date: day.toISOString().slice(0, 10),
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: count
    });
  }
  
  return trends;
}

// Export metrics endpoint
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { format } = await request.json();
    
    const monitoring = MonitoringService.getInstance();
    const exportData = await monitoring.exportMetrics();
    
    if (format === 'json') {
      return NextResponse.json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCsv(exportData);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="zenith-metrics-${new Date().toISOString().slice(0, 10)}.csv"`
        }
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported format. Use 'json' or 'csv'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error exporting metrics:", error);
    return NextResponse.json(
      { error: "Failed to export metrics" },
      { status: 500 }
    );
  }
}, {
  allowedRoles: MANAGEMENT_ROLES
});

// Convert metrics to CSV format
function convertToCsv(data: {
  timestamp: string;
  metrics: SystemStats;
  alerts: string[];
  suggestions: string[];
}): string {
  const rows = [
    ['Timestamp', 'Metric', 'Value', 'Unit'],
    [data.timestamp, 'Database Connected', data.metrics.database.connected, 'boolean'],
    [data.timestamp, 'Database Response Time', data.metrics.database.responseTime, 'ms'],
    [data.timestamp, 'Active Sessions', data.metrics.sessions.totalActiveSessions, 'count'],
    [data.timestamp, 'Unique Users', data.metrics.sessions.uniqueUsers, 'count'],
    [data.timestamp, 'Total API Requests', data.metrics.api.totalRequests, 'count'],
    [data.timestamp, 'API Error Rate', data.metrics.api.errorRate, 'percentage'],
    [data.timestamp, 'WebSocket Users', data.metrics.websocket.connectedUsers, 'count'],
  ];

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
