"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Globe,
  Github,
  Linkedin,
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Activity,
  FileText,
  CheckCircle,
  Clock,
  Trophy,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  joinedDate: string;
  clubs: string[];
  role: string;
}

interface AssignmentActivity {
  id: string;
  title: string;
  club: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'completed' | 'pending' | 'graded';
  submittedAt: string;
  attempts: number;
  timeSpent: number;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    avatar: "",
    phone: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    joinedDate: "2025-01-15",
    clubs: [],
    role: "MEMBER",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email,
        bio: "",
        avatar: user.avatar || "",
        phone: "",
        location: "",
        website: "",
        github: "",
        linkedin: "",
        twitter: "",
        joinedDate: "2025-01-15",
        clubs: user.clubs || [],
        role: user.role,
      });
      // Fetch assignment history when profile loads
      fetchAssignmentHistory();
    }
  }, [user, isLoading, router]);

  const fetchAssignmentHistory = async () => {
    if (!user) return;
    
    try {
      setLoadingActivities(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/user/assignment-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignmentHistory(data.assignments || []);
      } else {
        console.error('Failed to fetch assignment history');
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSave = async () => {
    try {
      // In a real app, this would make an API call to update the profile
      console.log("Saving profile:", profile);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error("Error saving profile:", error);
      // Show error message
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    try {
      // In a real app, this would make an API call to change password
      console.log("Changing password");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
      // Show success message
    } catch (error) {
      console.error("Error changing password:", error);
      // Show error message
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      width={128}
                      height={128}
                    />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Camera size={20} className="text-white" />
                  </button>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-xl opacity-90 mb-2">@{profile.username}</p>
                <p className="text-lg opacity-80 mb-4">
                  {profile.bio || "No bio available"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <span className="flex items-center">
                    <Mail size={16} className="mr-2" />
                    {profile.email}
                  </span>
                  <span className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Joined {new Date(profile.joinedDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Shield size={16} className="mr-2" />
                    {profile.role}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all flex items-center"
                  >
                    <Edit size={20} className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center"
                    >
                      <Save size={20} className="mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all flex items-center"
                    >
                      <X size={20} className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "profile", label: "Profile Info", icon: User },
                { id: "activities", label: "Activities", icon: Activity },
                { id: "settings", label: "Settings", icon: Settings },
                { id: "security", label: "Security", icon: Lock },
                { id: "notifications", label: "Notifications", icon: Bell },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({ ...profile, username: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled={true} // Email usually shouldn't be editable
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    disabled={!isEditing}
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Social Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Github size={16} className="inline mr-2" />
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={profile.github}
                        onChange={(e) =>
                          setProfile({ ...profile, github: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        placeholder="GitHub profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Linkedin size={16} className="inline mr-2" />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={profile.linkedin}
                        onChange={(e) =>
                          setProfile({ ...profile, linkedin: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe size={16} className="inline mr-2" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) =>
                          setProfile({ ...profile, website: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        placeholder="Personal website URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assignment History
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track your assignment submissions and scores
                    </p>
                  </div>
                  <button
                    onClick={fetchAssignmentHistory}
                    disabled={loadingActivities}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {loadingActivities ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {loadingActivities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activities...</span>
                  </div>
                ) : assignmentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Assignments Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your assignment submissions will appear here once you start taking assignments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Assignment Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total Assignments</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {assignmentHistory.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {assignmentHistory.filter(a => a.status === 'completed' || a.status === 'graded').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Average Score</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                              {assignmentHistory.length > 0 
                                ? Math.round(assignmentHistory.reduce((acc, a) => acc + a.percentage, 0) / assignmentHistory.length)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                          <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Total Time</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {Math.round(assignmentHistory.reduce((acc, a) => acc + a.timeSpent, 0) / 60)}h
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment List */}
                    {assignmentHistory.map((assignment) => (
                      <div key={assignment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {assignment.title}
                              </h4>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                {assignment.club}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                assignment.status === 'completed' 
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                  : assignment.status === 'graded'
                                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                              }`}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-medium">Score:</span> {assignment.score}/{assignment.maxScore}
                              </div>
                              <div>
                                <span className="font-medium">Percentage:</span> {assignment.percentage.toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium">Attempts:</span> {assignment.attempts}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {Math.round(assignment.timeSpent / 60)}min
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className={`text-2xl font-bold ${
                              assignment.percentage >= 80 
                                ? 'text-green-600 dark:text-green-400'
                                : assignment.percentage >= 60 
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {assignment.percentage.toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              {new Date(assignment.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              assignment.percentage >= 80 
                                ? 'bg-green-500'
                                : assignment.percentage >= 60 
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${assignment.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Change Password
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showPasswordChange ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {showPasswordChange && (
                  <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Profile Visibility
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Control who can see your profile
                        </p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Public</option>
                        <option>Club Members Only</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Activity Status
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Show when you&apos;re online
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Email Notifications",
                        description:
                          "Receive email updates for important activities",
                      },
                      {
                        title: "Push Notifications",
                        description: "Get notified on your device",
                      },
                      {
                        title: "Club Announcements",
                        description: "Notifications for club announcements",
                      },
                      {
                        title: "Event Reminders",
                        description: "Reminders for upcoming events",
                      },
                      {
                        title: "Assignment Deadlines",
                        description: "Notifications for assignment due dates",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
