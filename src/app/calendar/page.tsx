"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  ExternalLink,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  event_date: string; // Server returns this format
  startTime: string;
  endTime?: string;
  location: string;
  club: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  type: "meeting" | "workshop" | "social" | "competition" | "presentation";
  isAttending: boolean;
}

const eventTypeColors = {
  meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  workshop:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  social:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  competition: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  presentation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
};

export default function CalendarPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [filterType, setFilterType] = useState<"all" | Event["type"]>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("zenith-token");
        const response = await fetch("/api/events", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else {
          console.error("Failed to fetch events");
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const filteredEvents = events.filter((event) => {
    const matchesFilter = filterType === "all" || event.type === filterType;
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.club.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.event_date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const attendingEvents = events.filter((event) => event.isAttending);

  const handleJoinEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update the local event state to show the user is attending
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, isAttending: true, attendees: event.attendees + 1 } 
            : event
        ));
      } else {
        console.error("Failed to join event");
      }
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update the local event state to show the user is no longer attending
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, isAttending: false, attendees: Math.max(0, event.attendees - 1) } 
            : event
        ));
      } else {
        console.error("Failed to leave event");
      }
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(dateString);
    return tomorrow.toDateString() === eventDate.toDateString();
  };

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return "Today";
    if (isTomorrow(dateString)) return "Tomorrow";
    return formatDate(dateString);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Calendar & Events
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with club events and activities
              {attendingEvents.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                  {attendingEvents.length} attending
                </span>
              )}
            </p>
          </div>
          <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} className="mr-2" />
            Create Event
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upcoming
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingEvents.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Attending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attendingEvents.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This Week
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    events.filter((event) => {
                      const eventDate = new Date(event.event_date);
                      const today = new Date();
                      const weekFromNow = new Date(
                        today.getTime() + 7 * 24 * 60 * 60 * 1000
                      );
                      return eventDate >= today && eventDate <= weekFromNow;
                    }).length
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-3 font-medium transition-colors ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-3 font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                Calendar View
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "meeting", label: "Meetings" },
                { key: "workshop", label: "Workshops" },
                { key: "social", label: "Social" },
                { key: "competition", label: "Competitions" },
                { key: "presentation", label: "Presentations" },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() =>
                    setFilterType(filterOption.key as typeof filterType)
                  }
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filterType === filterOption.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Loading events...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we fetch your events.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "No events match your current filter."}
              </p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  isToday(event.event_date) ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              eventTypeColors[event.type]
                            }`}
                          >
                            {event.type.charAt(0).toUpperCase() +
                              event.type.slice(1)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {event.club}
                          </span>
                          {event.isAttending && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                              Attending
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {event.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {getDateLabel(event.event_date)}
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            {formatTime(event.startTime)}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </div>
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 dark:text-gray-500 mb-1">
                        Attendees
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {event.attendees}
                        {event.maxAttendees && (
                          <span className="text-sm text-gray-500 dark:text-gray-500">
                            /{event.maxAttendees}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        Organized by {event.organizer}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ExternalLink size={16} className="mr-2" />
                        View Details
                      </button>
                      {event.isAttending ? (
                        <button 
                          onClick={() => handleLeaveEvent(event.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Leave Event
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinEvent(event.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          disabled={event.maxAttendees ? (event.attendees >= event.maxAttendees) : false}
                        >
                          {event.maxAttendees && event.attendees >= event.maxAttendees 
                            ? 'Event Full' 
                            : 'Join Event'
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
