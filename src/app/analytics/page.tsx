'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  totalEvents: number;
  totalClubs: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Placeholder - will be implemented when backend is ready
        setAnalytics({
          totalUsers: 0,
          totalPosts: 0,
          totalEvents: 0,
          totalClubs: 0
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zenith-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-zenith-primary">Total Users</h2>
          <p className="text-sm text-zenith-muted">Registered users</p>
          <div className="text-2xl font-bold mt-2 stat-members">{analytics?.totalUsers || 0}</div>
        </div>

        <div className="bg-zenith-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-zenith-primary">Total Posts</h2>
          <p className="text-sm text-zenith-muted">Community posts</p>
          <div className="text-2xl font-bold mt-2 stat-posts">{analytics?.totalPosts || 0}</div>
        </div>

        <div className="bg-zenith-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-zenith-primary">Total Events</h2>
          <p className="text-sm text-zenith-muted">Scheduled events</p>
          <div className="text-2xl font-bold mt-2 stat-events">{analytics?.totalEvents || 0}</div>
        </div>

        <div className="bg-zenith-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-zenith-primary">Total Clubs</h2>
          <p className="text-sm text-zenith-muted">Active clubs</p>
          <div className="text-2xl font-bold mt-2 stat-clubs">{analytics?.totalClubs || 0}</div>
        </div>
      </div>
    </div>
  );
}