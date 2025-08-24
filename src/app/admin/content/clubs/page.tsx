"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Settings,
  Image as ImageIcon,
  Calendar,
  Star,
  Edit,
  ChevronRight
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

export default function ClubContentManagement() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
  const hasAccess = isZenithCommittee || isSystemAdmin;

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      showToast({
        type: "error",
        title: "Access Denied",
        message: "You don't have permission to manage club content"
      });
      router.push('/admin/club-management');
      return;
    }
    
    if (hasAccess) {
      fetchClubs();
    }
  }, [user, isLoading, hasAccess]);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/admin/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      } else {
        throw new Error('Failed to fetch clubs');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load clubs"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter clubs based on search term
  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <h1 className="text-3xl font-bold text-gray-900">Club Content Management</h1>
                <p className="text-gray-600 mt-2">Manage content for all club pages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-college-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Clubs</h2>
            <p className="text-gray-600 mt-1">Select a club to manage its content</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-college-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading clubs...</p>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No clubs found' : 'No clubs available'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create clubs first to manage their content'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                  <div
                    key={club.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(`/admin/content/club/${club.id}`)}
                  >
                    {/* Club Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{club.type}</p>
                        <div className="flex items-center mt-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
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
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Club Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {club.description}
                    </p>

                    {/* Club Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{club.member_count} members</span>
                      </div>
                      <span>Coordinator: {club.coordinator_name}</span>
                    </div>

                    {/* Content Management Options */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/content/club/${club.id}/carousel`);
                        }}
                        className="flex items-center justify-center space-x-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Carousel</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/content/club/${club.id}/team`);
                        }}
                        className="flex items-center justify-center space-x-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs"
                      >
                        <Users className="w-3 h-3" />
                        <span>Team</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/content/club/${club.id}/events`);
                        }}
                        className="flex items-center justify-center space-x-1 p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Events</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/content/club/${club.id}/settings`);
                        }}
                        className="flex items-center justify-center space-x-1 p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/content/landing/carousel')}
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-blue-900">Landing Carousel</p>
                <p className="text-xs text-blue-600">Manage homepage slides</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/content/landing/team')}
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Users className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-900">Landing Team</p>
                <p className="text-xs text-green-600">Manage team cards</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/content/landing/events')}
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Star className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">Featured Events</p>
                <p className="text-xs text-purple-600">Manage homepage events</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/club-management')}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Club Management</p>
                <p className="text-xs text-gray-600">Back to admin panel</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
