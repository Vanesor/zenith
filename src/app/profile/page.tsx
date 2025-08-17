"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Camera, 
  Save, 
  X,
  Shield,
  Award,
  Clock,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Activity,
  Target,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ModernProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    bio: (user as any)?.bio || '',
    location: (user as any)?.location || ''
  });

  const handleSave = async () => {
    try {
      // TODO: API call to update profile
      console.log('Saving profile data:', editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
      bio: (user as any)?.bio || '',
      location: (user as any)?.location || ''
    });
    setIsEditing(false);
  };

  const stats = [
    {
      title: 'Clubs Joined',
      value: '3',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: 'Active member'
    },
    {
      title: 'Events Attended',
      value: '12',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
      description: 'This semester'
    },
    {
      title: 'Achievements',
      value: '8',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      description: 'Earned badges'
    },
    {
      title: 'Activity Score',
      value: '92%',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      description: 'Above average'
    }
  ];

  const recentActivity = [
    {
      type: 'achievement',
      title: 'Completed Web Development Workshop',
      time: '2 days ago',
      club: 'CS Club',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      type: 'event',
      title: 'Attended AI/ML Seminar',
      time: '1 week ago',
      club: 'Tech Club',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      type: 'message',
      title: 'Posted in Robotics Discussion',
      time: '2 weeks ago',
      club: 'Robotics Club',
      icon: MessageSquare,
      color: 'text-green-600'
    },
    {
      type: 'achievement',
      title: 'Got "Active Contributor" Badge',
      time: '3 weeks ago',
      club: 'Innovation Club',
      icon: Star,
      color: 'text-purple-600'
    }
  ];

  const clubs = [
    {
      name: 'Computer Science Club',
      role: 'Member',
      joinDate: 'Aug 2024',
      image: 'CS',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Robotics Club',
      role: 'Member',
      joinDate: 'Sep 2024',
      image: 'RC',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Innovation Club',
      role: 'Member',
      joinDate: 'Oct 2024',
      image: 'IC',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-section rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Not Logged In</h2>
          <p className="text-secondary">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-primary">My Profile</h1>
        <p className="text-secondary text-lg">
          Manage your account information and track your activities
        </p>
      </motion.div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8"
      >
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-primary mb-2">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-secondary text-lg capitalize mb-3">
                {user.role?.replace('_', ' ')}
              </p>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">Verified Member</span>
                </div>
                <div className="flex items-center space-x-2 text-secondary">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Member since {new Date((user as any)?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary mb-6 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>
            
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                  <User className="w-5 h-5 text-muted" />
                  <span className="text-primary font-medium">{user.firstName}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                  <User className="w-5 h-5 text-muted" />
                  <span className="text-primary font-medium">{user.lastName}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Email Address</label>
              <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                <Mail className="w-5 h-5 text-muted" />
                <span className="text-primary font-medium">{user.email}</span>
                <div className="ml-auto">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                  <Phone className="w-5 h-5 text-muted" />
                  <span className="text-primary font-medium">{(user as any)?.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Additional Details</span>
            </h3>
            
            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Role</label>
              <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                <Award className="w-5 h-5 text-muted" />
                <span className="text-primary font-medium capitalize">{user.role?.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter location"
                />
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                  <MapPin className="w-5 h-5 text-muted" />
                  <span className="text-primary font-medium">{(user as any)?.location || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Last Active */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Last Active</label>
              <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                <Clock className="w-5 h-5 text-muted" />
                <span className="text-primary font-medium">
                  {new Date((user as any)?.last_login || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Member Since</label>
              <div className="flex items-center space-x-3 p-4 bg-section rounded-lg">
                <Calendar className="w-5 h-5 text-muted" />
                <span className="text-primary font-medium">
                  {new Date((user as any)?.created_at || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-8 pt-8 border-t border-custom">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Bio</span>
          </h3>
          {isEditing ? (
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="Tell us about yourself, your interests, and goals..."
            />
          ) : (
            <div className="p-4 bg-section rounded-lg">
              <p className="text-primary leading-relaxed">
                {(user as any)?.bio || 'No bio provided yet. Click edit to add information about yourself, your interests, and goals!'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="card p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-sm text-secondary">{stat.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Clubs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-xl font-semibold text-primary mb-6 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>My Clubs</span>
          </h3>
          <div className="space-y-4">
            {clubs.map((club, index) => (
              <motion.div
                key={club.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-section rounded-lg hover:bg-hover transition-colors"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${club.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                  {club.image}
                </div>
                <div className="flex-1">
                  <h4 className="text-primary font-semibold">{club.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-secondary">
                    <span>{club.role}</span>
                    <span>•</span>
                    <span>Joined {club.joinDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <span className="text-xs text-secondary">Active</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-xl font-semibold text-primary mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-section rounded-lg hover:bg-hover transition-colors"
                >
                  <div className="w-10 h-10 bg-hover rounded-full flex items-center justify-center">
                    <IconComponent className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-primary font-medium text-sm">{activity.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-secondary mt-1">
                      <span>{activity.club}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}