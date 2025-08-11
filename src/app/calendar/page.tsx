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
  type?: string; // Make type optional as it's no longer in the database
  clubName?: string;
  clubColor?: string;
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
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

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
  
  // Join or leave an event
  const toggleEventAttendance = async (eventId: string, isAttending: boolean) => {
    try {
      const token = localStorage.getItem("zenith-token");
      const url = `/api/events/${eventId}/attend`;
      const method = isAttending ? "DELETE" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        // Update local state to reflect the change
        setEvents(events.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                isAttending: !isAttending,
                // If joining, increment attendees, if leaving, decrement
                attendees: isAttending ? event.attendees - 1 : event.attendees + 1
              } 
            : event
        ));
      } else {
        const error = await response.json();
        console.error("Failed to update event attendance:", error);
        alert(error.error || "Failed to update event attendance");
      }
    } catch (error) {
      console.error("Error updating event attendance:", error);
      alert("An error occurred while trying to update event attendance");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const filteredEvents = events.filter((event) => {
    // Just show all events for now as we no longer have a type field
    const matchesFilter = filterType === "all"; // Remove filtering by type
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
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zenith-primary mb-2">
              Calendar & Events
            </h1>
            <p className="text-zenith-secondary">
              Stay updated with club events and activities
              {attendingEvents.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {attendingEvents.length} attending
                </span>
              )}
            </p>
          </div>
          {/* Only show create button for managers */}
          {user && ["coordinator", "co_coordinator", "secretary", "president", "vice_president"].includes(user.role) && (
            <button 
              onClick={() => router.push('/calendar/create')}
              className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Create Event
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {events.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Upcoming
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {upcomingEvents.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Attending
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {attendingEvents.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  This Week
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
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
        <div className="bg-zenith-card rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-zenith-muted" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-zenith-border overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-3 font-medium transition-colors ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-zenith-card text-zenith-secondary hover:bg-zenith-hover"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-3 font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-zenith-card text-zenith-secondary hover:bg-zenith-hover"
                }`}
              >
                Calendar View
              </button>
            </div>

            {/* Filter Buttons - Only showing All Events for now */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Events" },
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
            <div className="bg-zenith-card rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                Loading events...
              </h3>
              <p className="text-zenith-muted">
                Please wait while we fetch your events.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-zenith-card rounded-xl shadow-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                No events found
              </h3>
              <p className="text-zenith-muted">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "No events match your current filter."}
              </p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-zenith-card rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  isToday(event.event_date) ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-zenith-primary">
                            {event.title}
                          </h3>
                          {/* Display club information instead of event type */}
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            {event.club}
                          </span>
                          {event.isAttending && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                              Attending
                            </span>
                          )}
                        </div>
                        <p className="text-zenith-muted mb-4">
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
                      <div className="text-lg font-semibold text-zenith-primary">
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
                      <button className="flex items-center px-4 py-2 text-zenith-muted hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ExternalLink size={16} className="mr-2" />
                        View Details
                      </button>
                      {event.isAttending ? (
                        <button 
                          onClick={() => toggleEventAttendance(event.id, true)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Leave Event
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleEventAttendance(event.id, false)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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
