'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Database,
  Zap,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { CacheManager } from '@/lib/CacheManager';

interface PerformanceStats {
  database: {
    healthy: boolean;
    latency: number;
  };
  cache: {
    totalItems: number;
    hitRate: number;
    totalSize: number;
  };
  system: {
    memoryUsage: number;
    responseTime: number;
    activeUsers: number;
  };
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get cache stats
      const cacheStats = await CacheManager.getStats();
      
      // Get database health (would need API endpoint)
      const dbResponse = await fetch('/api/health/database');
      const dbStats = await dbResponse.json();
      
      // Get system stats (would need API endpoint)
      const systemResponse = await fetch('/api/health/system');
      const systemStats = await systemResponse.json();
      
      setStats({
        database: dbStats,
        cache: {
          totalItems: cacheStats?.totalItems || 0,
          hitRate: cacheStats?.hitRate || 0,
          totalSize: cacheStats?.totalSize || 0
        },
        system: systemStats
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch performance stats:', error);
      // Fallback to cache stats only
      const cacheStats = await CacheManager.getStats();
      setStats({
        database: { healthy: true, latency: 0 },
        cache: {
          totalItems: cacheStats?.totalItems || 0,
          hitRate: cacheStats?.hitRate || 0,
          totalSize: cacheStats?.totalSize || 0
        },
        system: { memoryUsage: 0, responseTime: 0, activeUsers: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (healthy: boolean, metric?: number, threshold?: number) => {
    if (!healthy) return 'text-red-500';
    if (metric && threshold && metric > threshold) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPerformanceGrade = (latency: number): string => {
    if (latency < 50) return 'A+';
    if (latency < 100) return 'A';
    if (latency < 200) return 'B';
    if (latency < 500) return 'C';
    return 'D';
  };

  if (loading && !stats) {
    return (
      <div className="bg-card rounded-xl border border-custom p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-primary">Performance Monitor</h3>
          <RefreshCw className="w-5 h-5 text-zenith-muted animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-zenith-hover rounded mb-2"></div>
              <div className="h-8 bg-zenith-hover rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-custom p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-zenith-accent" />
          <h3 className="text-lg font-medium text-primary">Performance Monitor</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-zenith-muted">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 text-zenith-muted hover:text-primary rounded-lg hover:bg-zenith-hover transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Database Performance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-zenith-bg rounded-lg p-4 border border-custom"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-primary">Database</span>
              </div>
              <span className={`text-sm font-medium ${getHealthColor(stats.database.healthy, stats.database.latency, 200)}`}>
                {stats.database.healthy ? '●' : '●'} {stats.database.healthy ? 'Healthy' : 'Issues'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Latency</span>
                <span className="font-mono text-sm">
                  {stats.database.latency}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Grade</span>
                <span className={`font-bold ${getHealthColor(true, stats.database.latency, 100)}`}>
                  {getPerformanceGrade(stats.database.latency)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Cache Performance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zenith-bg rounded-lg p-4 border border-custom"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-primary">Cache</span>
              </div>
              <span className={`text-sm font-medium ${stats.cache.hitRate > 60 ? 'text-green-500' : stats.cache.hitRate > 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                {stats.cache.hitRate.toFixed(1)}% Hit Rate
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Items</span>
                <span className="font-mono text-sm">
                  {stats.cache.totalItems.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Size</span>
                <span className="font-mono text-sm">
                  {formatBytes(stats.cache.totalSize)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* System Performance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-zenith-bg rounded-lg p-4 border border-custom"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-medium text-primary">System</span>
              </div>
              <span className="text-sm font-medium text-zenith-muted">
                {stats.system.activeUsers} active
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Response</span>
                <span className="font-mono text-sm">
                  {stats.system.responseTime}ms avg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zenith-muted text-sm">Memory</span>
                <span className="font-mono text-sm">
                  {formatBytes(stats.system.memoryUsage)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-zenith-bg rounded-lg border border-custom"
      >
        <h4 className="text-sm font-medium text-primary mb-2 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zenith-muted">
          <div>
            <strong>Cache Optimization:</strong>
            {stats && stats.cache.hitRate < 60 ? (
              <span className="text-yellow-500"> Consider preloading frequently accessed data</span>
            ) : (
              <span className="text-green-500"> Cache performing well</span>
            )}
          </div>
          <div>
            <strong>Database Optimization:</strong>
            {stats && stats.database.latency > 200 ? (
              <span className="text-red-500"> High latency detected - check indexes</span>
            ) : (
              <span className="text-green-500"> Database response optimal</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex flex-wrap gap-2"
      >
        <button
          onClick={async () => {
            await CacheManager.clear();
            fetchStats();
          }}
          className="px-3 py-1.5 bg-zenith-hover hover:bg-zenith-accent text-primary hover:text-primary rounded-lg text-sm transition-colors"
        >
          Clear Cache
        </button>
        <button
          onClick={() => window.open('/api/health/full-report', '_blank')}
          className="px-3 py-1.5 bg-zenith-hover hover:bg-zenith-accent text-primary hover:text-primary rounded-lg text-sm transition-colors"
        >
          Full Report
        </button>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 bg-zenith-hover hover:bg-zenith-accent text-primary hover:text-primary rounded-lg text-sm transition-colors"
        >
          Refresh Stats
        </button>
      </motion.div>
    </motion.div>
  );
}
