"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Clock,
  ArrowRight,
  Star,
  MessageSquare,
  FileText,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface DashboardStats {
  total_clubs: number;
  upcoming_events: number;
  total_members: number;
  user_clubs: number;
  activity_score: number;
  assignment_completion: number;
}

export default function ModernDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const statsCards = [
    {
      title: 'Active Clubs',
      value: stats?.total_clubs?.toString() || '0',
      change: 'Explore new clubs',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: 'up'
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcoming_events?.toString() || '0',
      change: 'Don\'t miss out!',
      icon: Calendar,
      color: 'from-purple-500 to-pink-500',
      trend: 'up'
    },
    {
      title: 'My Clubs',
      value: stats?.user_clubs?.toString() || '0',
      change: 'Join more clubs',
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      trend: 'up'
    },
    {
      title: 'Activity Score',
      value: `${stats?.activity_score || 0}%`,
      change: 'Keep it up!',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      trend: 'up'
    }
  ];

  const recentActivity = [
    {
      type: 'event',
      title: 'Tech Talk on AI & Machine Learning',
      time: '2 hours ago',
      club: 'Computer Science Club',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      type: 'achievement',
      title: 'Completed Web Development Workshop',
      time: '1 day ago',
      club: 'Coding Club',
      icon: Award,
      color: 'text-green-600'
    },
    {
      type: 'message',
      title: 'New message from club coordinator',
      time: '2 days ago',
      club: 'Robotics Club',
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      type: 'event',
      title: 'Hackathon 2025 Registration Open',
      time: '3 days ago',
      club: 'Innovation Club',
      icon: Zap,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Welcome back, {user?.firstName || 'Student'}! 👋
            </h1>
            <p className="text-secondary text-lg">
              Here's what's happening in your clubs today
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-secondary">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        ) : (
          statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-secondary">{stat.title}</h3>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.change}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Recent Activity</h2>
          <Link 
            href="/activity" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="card p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-section transition-colors"
                >
                  <div className={`w-10 h-10 bg-section rounded-full flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-primary font-medium">{activity.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-secondary">
                      <span>{activity.club}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Featured Clubs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Featured Clubs</h2>
          <Link 
            href="/clubs" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Computer Science Club',
              members: 45,
              description: 'Learn programming, algorithms, and latest tech trends',
              image: 'CS',
              color: 'from-blue-500 to-cyan-500'
            },
            {
              name: 'Robotics Club',
              members: 32,
              description: 'Build robots and explore automation technologies',
              image: 'RC',
              color: 'from-purple-500 to-pink-500'
            },
            {
              name: 'Innovation Club',
              members: 28,
              description: 'Develop innovative solutions for real-world problems',
              image: 'IC',
              color: 'from-green-500 to-emerald-500'
            }
          ].map((club, index) => (
            <motion.div
              key={club.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${club.color} rounded-xl flex items-center justify-center text-primary font-bold`}>
                  {club.image}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">{club.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{club.members} members</span>
                  </div>
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-secondary text-sm mb-4">{club.description}</p>
              <Link href="/clubs">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-primary py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Learn More
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}