"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Settings,
  Image as ImageIcon,
  Calendar,
  Star,
  Edit,
  Save,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";

interface Club {
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  status: "active" | "inactive" | "pending";
  member_count: number;
  coordinator_id: string;
  coordinator_name: string;
  created_at: string;
  updated_at: string;
}

export default function ClubContentPage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced role checking for admin access
  const userRole = user?.role?.toLowerCase() || '';
  const isZenithCommittee = [
    'president',
    'vice_president', 
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ].includes(userRole);
  const isSystemAdmin = userRole === 'admin';
  const isClubCoordinator = [
    'coordinator',
    'co_coordinator',
    'club_coordinator',
    'co-coordinator'
  ].includes(userRole);

  // Access control: Zenith committee can access all clubs, coordinators only their own club
  const hasAccess = isZenithCommittee || isSystemAdmin || 
    (isClubCoordinator && user?.club_id === clubId);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      showToast({
        type: "error",
        title: "Access Denied",
        message: "You don't have permission to manage this club's content"
      });
      router.push('/admin/club-management');
      return;
    }
    
    if (hasAccess && clubId) {
      fetchClub();
    }
  }, [user, isLoading, hasAccess, clubId]);

  const fetchClub = async () => {
    try {
      const response = await fetch(`/api/admin/clubs/${clubId}`);
      if (response.ok) {
        const data = await response.json();
        setClub(data.club);
      } else {
        throw new Error('Failed to fetch club');
      }
    } catch (error) {
      console.error('Error fetching club:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load club information"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-college-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Club not found</h2>
          <p className="text-gray-600 mb-4">The club you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{club.name} Content</h1>
                <p className="text-gray-600 mt-2">Manage content for this club's page</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  club.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : club.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {club.status}
              </span>
            </div>
          </div>
        </div>

        {/* Club Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{club.name}</h2>
              <p className="text-gray-600 mt-1">{club.type}</p>
              <p className="text-gray-700 mt-2">{club.description}</p>
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{club.member_count} members</span>
                </div>
                <span>Coordinator: {club.coordinator_name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm font-medium">
                {new Date(club.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content Management Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: Eye },
                { id: "carousel", label: "Carousel", icon: ImageIcon },
                { id: "team", label: "Team", icon: Users },
                { id: "events", label: "Events", icon: Calendar },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-college-primary text-college-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Content Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Carousel Management */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-4">
                      <ImageIcon className="w-8 h-8 text-blue-600 mr-3" />
                      <h4 className="font-semibold text-blue-900">Carousel</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-4">
                      Manage banner images and slides for the club page
                    </p>
                    <button
                      onClick={() => router.push(`/admin/content/club/${clubId}/carousel`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Manage Carousel
                    </button>
                  </div>

                  {/* Team Management */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center mb-4">
                      <Users className="w-8 h-8 text-green-600 mr-3" />
                      <h4 className="font-semibold text-green-900">Team</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      Manage team member cards and leadership information
                    </p>
                    <button
                      onClick={() => router.push(`/admin/content/club/${clubId}/team`)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Manage Team
                    </button>
                  </div>

                  {/* Events Management */}
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center mb-4">
                      <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                      <h4 className="font-semibold text-purple-900">Events</h4>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Feature events on the club page
                    </p>
                    <button
                      onClick={() => router.push(`/admin/content/club/${clubId}/events`)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Manage Events
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center mb-4">
                      <Settings className="w-8 h-8 text-gray-600 mr-3" />
                      <h4 className="font-semibold text-gray-900">Settings</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      Configure club page settings and preferences
                    </p>
                    <button
                      onClick={() => router.push(`/admin/content/club/${clubId}/settings`)}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Manage Settings
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Club carousel updated</span>
                        </div>
                        <span className="text-xs text-gray-400">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Team member added</span>
                        </div>
                        <span className="text-xs text-gray-400">1 day ago</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Event featured</span>
                        </div>
                        <span className="text-xs text-gray-400">3 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "carousel" && (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Carousel Management</h3>
                <p className="text-gray-600 mb-4">Manage banner images and slides for this club</p>
                <button
                  onClick={() => router.push(`/admin/content/club/${clubId}/carousel`)}
                  className="bg-college-primary text-primary px-6 py-3 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Open Carousel Manager
                </button>
              </div>
            )}

            {activeTab === "team" && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management</h3>
                <p className="text-gray-600 mb-4">Manage team member cards and leadership</p>
                <button
                  onClick={() => router.push(`/admin/content/club/${clubId}/team`)}
                  className="bg-college-primary text-primary px-6 py-3 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Open Team Manager
                </button>
              </div>
            )}

            {activeTab === "events" && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Events Management</h3>
                <p className="text-gray-600 mb-4">Feature events on this club's page</p>
                <button
                  onClick={() => router.push(`/admin/content/club/${clubId}/events`)}
                  className="bg-college-primary text-primary px-6 py-3 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Open Events Manager
                </button>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Club Settings</h3>
                <p className="text-gray-600 mb-4">Configure club page settings and preferences</p>
                <button
                  onClick={() => router.push(`/admin/content/club/${clubId}/settings`)}
                  className="bg-college-primary text-primary px-6 py-3 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Open Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
