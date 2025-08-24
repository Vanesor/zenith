"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url?: string;
  club_id: string;
  club_name: string;
  created_at: string;
}

interface FeaturedEvent {
  id: string;
  event_id: string;
  page_type: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  event: Event;
}

export default function LandingFeaturedEventsManagement() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access admin features",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();

  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    featuredEvent: FeaturedEvent | null;
  }>({ show: false, featuredEvent: null });

  // Form state
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isActive, setIsActive] = useState(true);

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
        message: "You don't have permission to manage landing page content"
      });
      router.push('/admin/club-management');
      return;
    }
    
    if (hasAccess) {
      fetchFeaturedEvents();
      fetchAvailableEvents();
    }
  }, [user, isLoading, hasAccess]);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await fetch('/api/admin/featured-events?page_type=landing');
      if (response.ok) {
        const data = await response.json();
        setFeaturedEvents(data.featuredEvents || []);
      } else {
        throw new Error('Failed to fetch featured events');
      }
    } catch (error) {
      console.error('Error fetching featured events:', error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to load featured events"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEvents = async () => {
    try {
      const response = await fetch('/api/admin/events/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableEvents(data.events || []);
      } else {
        throw new Error('Failed to fetch available events');
      }
    } catch (error) {
      console.error('Error fetching available events:', error);
    }
  };

  const resetForm = () => {
    setSelectedEventId("");
    setIsActive(true);
  };

  const handleAddFeaturedEvent = async () => {
    if (!selectedEventId) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select an event to feature"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/featured-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: selectedEventId,
          page_type: 'landing',
          is_active: isActive
        })
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Event added to featured list successfully"
        });
        setShowAddModal(false);
        resetForm();
        fetchFeaturedEvents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add featured event');
      }
    } catch (error) {
      console.error('Error adding featured event:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to add featured event"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (featuredEventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/featured-events/${featuredEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Event status updated successfully"
        });
        fetchFeaturedEvents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update event status"
      });
    }
  };

  const handleDeleteFeaturedEvent = async () => {
    if (!deleteModal.featuredEvent) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/featured-events/${deleteModal.featuredEvent.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: "success",
          title: "Success",
          message: "Featured event removed successfully"
        });
        setDeleteModal({ show: false, featuredEvent: null });
        fetchFeaturedEvents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove featured event');
      }
    } catch (error) {
      console.error('Error removing featured event:', error);
      showToast({
        type: "error",
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to remove featured event"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Filter out already featured events from available events
  const featuredEventIds = featuredEvents.map(fe => fe.event_id);
  const unfeaturedEvents = availableEvents.filter(event => !featuredEventIds.includes(event.id));

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
                <h1 className="text-3xl font-bold text-gray-900">Landing Page Featured Events</h1>
                <p className="text-gray-600 mt-2">Manage which events are featured on the landing page</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Feature Event</span>
            </button>
          </div>
        </div>

        {/* Featured Events List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Featured Events</h2>
            <p className="text-gray-600 mt-1">Events currently featured on the landing page</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-college-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading featured events...</p>
              </div>
            ) : featuredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No featured events</h3>
                <p className="text-gray-600 mb-4">Add events to feature them on the landing page</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="bg-college-primary text-primary px-4 py-2 rounded-lg hover:bg-college-primary/90 transition-colors"
                >
                  Feature First Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {featuredEvents.map((featuredEvent) => (
                  <div
                    key={featuredEvent.id}
                    className={`border rounded-lg p-6 ${
                      featuredEvent.is_active 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Event Image */}
                      <div className="flex-shrink-0">
                        {featuredEvent.event.image_url ? (
                          <img
                            src={featuredEvent.event.image_url}
                            alt={featuredEvent.event.title}
                            className="w-24 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {featuredEvent.event.title}
                            </h3>
                            <p className="text-sm text-blue-600 mt-1">
                              {featuredEvent.event.club_name}
                            </p>
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                              {featuredEvent.event.description}
                            </p>
                            
                            {/* Event Details */}
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(featuredEvent.event.start_date)}</span>
                              </div>
                              {featuredEvent.event.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{featuredEvent.event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {/* Status Toggle */}
                            <button
                              onClick={() => handleToggleStatus(featuredEvent.id, featuredEvent.is_active)}
                              className="p-2 rounded-lg transition-colors"
                            >
                              {featuredEvent.is_active ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>

                            {/* Remove from featured */}
                            <button
                              onClick={() => setDeleteModal({ show: true, featuredEvent })}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <StarOff className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Featured Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Feature Event on Landing Page
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event to Feature *
                </label>
                {unfeaturedEvents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No available events to feature</p>
                    <p className="text-sm text-gray-500 mt-1">
                      All events are either already featured or no events exist
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                    {unfeaturedEvents.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="selectedEvent"
                          value={event.id}
                          checked={selectedEventId === event.id}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          className="text-college-primary focus:ring-college-primary"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-blue-600">{event.club_name}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{formatDate(event.start_date)}</span>
                            {event.location && <span>{event.location}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-college-primary focus:ring-college-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible on landing page)
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeaturedEvent}
                disabled={saving || !selectedEventId || unfeaturedEvents.length === 0}
                className="px-4 py-2 bg-college-primary text-primary rounded-lg hover:bg-college-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Star className="w-4 h-4" />
                )}
                <span>{saving ? 'Adding...' : 'Feature Event'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, featuredEvent: null })}
        onConfirm={handleDeleteFeaturedEvent}
        title="Remove Featured Event"
        message={`Are you sure you want to remove "${deleteModal.featuredEvent?.event?.title}" from featured events? This will no longer display it on the landing page.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
