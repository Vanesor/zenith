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
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
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
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [viewSwitching, setViewSwitching] = useState(false);
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("zenith-token");
      const response = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Events fetched successfully:', data.length, 'events');
        setEvents(data);
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or invalid, redirect to login
        console.error("Authentication failed, redirecting to login");
        localStorage.removeItem("zenith-token");
        router.push("/login");
        return;
      } else {
        console.error("Failed to fetch events", response.status);
        setError("Failed to load events. Please try again.");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Network error. Please check your connection and try again.");
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
        const result = await response.json();
        if (result.success) {
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
          
          // Show success message  
          const action = isAttending ? "left" : "joined";
          // Success message will be reflected in UI state change, no need for alert
        } else {
          throw new Error(result.error || "Unknown error occurred");
        }
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or invalid, redirect to login
        console.error("Authentication failed, redirecting to login");
        localStorage.removeItem("zenith-token");
        router.push("/login");
        return;
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
    .filter((event) => {
      const eventDate = new Date(event.event_date);
      const today = new Date();
      // Set time to start of day for comparison to include all events for today
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

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

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",    });
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      const eventDateString = eventDate.toISOString().split('T')[0];
      return eventDateString === dateString;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleViewSwitch = async (newView: "calendar" | "list") => {
    if (newView === view) return;
    
    setViewSwitching(true);
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    setView(newView);
    setViewSwitching(false);
  };

  const getEventColor = (club: string) => {
    // Create a hash from the club name for consistent colors
    const hash = club.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      {
        bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
        text: 'text-white',
        shadow: 'shadow-purple-200 dark:shadow-purple-800/30',
        border: 'border-purple-300 dark:border-purple-600',
        highlight: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700',
        solid: 'bg-purple-500'
      },
      {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-white',
        shadow: 'shadow-blue-200 dark:shadow-blue-800/30',
        border: 'border-blue-300 dark:border-blue-600',
        highlight: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
        solid: 'bg-blue-500'
      },
      {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        text: 'text-white',
        shadow: 'shadow-green-200 dark:shadow-green-800/30',
        border: 'border-green-300 dark:border-green-600',
        highlight: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
        solid: 'bg-green-500'
      },
      {
        bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
        text: 'text-white',
        shadow: 'shadow-yellow-200 dark:shadow-yellow-800/30',
        border: 'border-yellow-300 dark:border-yellow-600',
        highlight: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
        solid: 'bg-yellow-500'
      },
      {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        text: 'text-white',
        shadow: 'shadow-red-200 dark:shadow-red-800/30',
        border: 'border-red-300 dark:border-red-600',
        highlight: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
        solid: 'bg-red-500'
      },
      {
        bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        text: 'text-white',
        shadow: 'shadow-indigo-200 dark:shadow-indigo-800/30',
        border: 'border-indigo-300 dark:border-indigo-600',
        highlight: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700',
        solid: 'bg-indigo-500'
      },
      {
        bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
        text: 'text-white',
        shadow: 'shadow-pink-200 dark:shadow-pink-800/30',
        border: 'border-pink-300 dark:border-pink-600',
        highlight: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-700',
        solid: 'bg-pink-500'
      },
      {
        bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        text: 'text-white',
        shadow: 'shadow-cyan-200 dark:shadow-cyan-800/30',
        border: 'border-cyan-300 dark:border-cyan-600',
        highlight: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-700',
        solid: 'bg-cyan-500'
      },
      {
        bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
        text: 'text-white',
        shadow: 'shadow-orange-200 dark:shadow-orange-800/30',
        border: 'border-orange-300 dark:border-orange-600',
        highlight: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700',
        solid: 'bg-orange-500'
      },
      {
        bg: 'bg-gradient-to-r from-teal-500 to-teal-600',
        text: 'text-white',
        shadow: 'shadow-teal-200 dark:shadow-teal-800/30',
        border: 'border-teal-300 dark:border-teal-600',
        highlight: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700',
        solid: 'bg-teal-500'
      },
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const today = new Date();
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add day names header
    const dayHeaders = dayNames.map((day, index) => (
      <div key={day} className={`p-3 text-center text-sm font-semibold border-b-2 ${
        index === 0 
          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
          : 'text-zenith-primary dark:text-blue-400 bg-zenith-section/50 dark:bg-gray-800/50 border-zenith-primary/20 dark:border-gray-600'
      }`}>
        {day}
      </div>
    ));

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-3 h-28 border border-zenith-border/50 dark:border-gray-700/50 bg-zenith-section/30 dark:bg-gray-800/30"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = today.toDateString() === date.toDateString();
      const isSunday = date.getDay() === 0;

      days.push(
        <div
          key={day}
          className={`p-3 h-28 border transition-all duration-200 relative overflow-hidden ${
            isSunday 
              ? 'border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/30' 
              : 'border-zenith-border/50 dark:border-gray-700/50 bg-zenith-card dark:bg-gray-800/50 hover:bg-zenith-hover dark:hover:bg-gray-700/50'
          } ${
            isCurrentDay ? 'ring-2 ring-zenith-primary dark:ring-blue-400 bg-zenith-primary/5 dark:bg-blue-900/20' : ''
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${
            isSunday ? 'text-red-600 dark:text-red-400' : isCurrentDay ? 'text-zenith-primary dark:text-blue-400' : 'text-zenith-secondary dark:text-gray-300'
          }`}>
            {day}
            {isCurrentDay && (
              <div className="w-2 h-2 bg-zenith-primary dark:bg-blue-400 rounded-full mt-1"></div>
            )}
            {isSunday && !isCurrentDay && (
              <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mt-1"></div>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => {
              const eventColor = getEventColor(event.club);
              return (
                <div
                  key={event.id}
                  className={`text-xs p-1.5 rounded-md font-medium truncate cursor-pointer hover:scale-105 transform transition-all duration-200 shadow-sm ${eventColor.solid} text-white`}
                  title={`${event.title} - ${formatTime(event.startTime)} at ${event.location} (${event.club})`}
                >
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs font-medium text-zenith-primary dark:text-blue-400 bg-zenith-primary/10 dark:bg-blue-900/30 rounded px-2 py-1 border border-zenith-primary/20 dark:border-blue-700/50">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
        {/* Loading Overlay for Calendar - shows when events array is empty but not in error state */}
        {events.length === 0 && !loading && !error && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mx-auto mb-4"></div>
              <p className="text-sm text-zenith-muted dark:text-gray-400">Loading events...</p>
            </div>
          </div>
        )}
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-zenith-border dark:border-gray-600">
          <h2 className="text-xl font-semibold text-zenith-primary dark:text-white">
            {formatMonthYear(currentDate)}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-zenith-hover dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-zenith-secondary dark:text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-zenith-primary dark:bg-blue-600 text-white rounded-lg hover:bg-zenith-primary/90 dark:hover:bg-blue-700 transition-colors"
            >
              {formatMonth(currentDate)}
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-zenith-hover dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-zenith-secondary dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {dayHeaders}
          {days}
        </div>
      </div>
    );
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
                onClick={() => handleViewSwitch("list")}
                disabled={viewSwitching}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors disabled:opacity-50 ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-zenith-card text-zenith-secondary hover:bg-zenith-hover"
                }`}
              >
                {viewSwitching && view !== "list" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                ) : (
                  <List size={16} />
                )}
                <span>List View</span>
              </button>
              <button
                onClick={() => handleViewSwitch("calendar")}
                disabled={viewSwitching}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors disabled:opacity-50 ${
                  view === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-zenith-card text-zenith-secondary hover:bg-zenith-hover"
                }`}
              >
                {viewSwitching && view !== "calendar" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                ) : (
                  <Grid3X3 size={16} />
                )}
                <span>Calendar View</span>
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

        {/* Main Content */}
        {viewSwitching ? (
          <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
              Switching views...
            </h3>
            <p className="text-zenith-muted dark:text-gray-400">
              Please wait while we prepare the {view === "calendar" ? "list" : "calendar"} view.
            </p>
          </div>
        ) : view === "calendar" ? (
          loading ? (
            <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
                Loading calendar events...
              </h3>
              <p className="text-zenith-muted dark:text-gray-400">
                Please wait while we fetch your events for the calendar view.
              </p>
            </div>
          ) : error ? (
            <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-red-200 dark:border-red-700">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                Error Loading Calendar
              </h3>
              <p className="text-zenith-muted dark:text-gray-400 mb-4">
                {error}
              </p>
              <button 
                onClick={() => fetchEvents()}
                className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            renderCalendarView()
          )
        ) : (
          /* Events List */
          <div className="space-y-6">
            {loading ? (
              <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
                  Loading events...
                </h3>
                <p className="text-zenith-muted dark:text-gray-400">
                  Please wait while we fetch your events.
                </p>
              </div>
            ) : error ? (
              <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-red-200 dark:border-red-700">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  Error Loading Events
                </h3>
                <p className="text-zenith-muted dark:text-gray-400 mb-4">
                  {error}
                </p>
                <button 
                  onClick={() => fetchEvents()}
                  className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : error ? (
              <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-red-200 dark:border-red-700">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  Error Loading Events
                </h3>
                <p className="text-zenith-muted dark:text-gray-400 mb-4">
                  {error}
                </p>
                <button 
                  onClick={() => fetchEvents()}
                  className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-zenith-card dark:bg-gray-800/90 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
                  No events found
                </h3>
                <p className="text-zenith-muted dark:text-gray-400 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms or filters."
                    : "No events match your current filter criteria."}
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white dark:bg-gray-800/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 ${
                    isToday(event.event_date) ? "border-l-4 !border-l-blue-500" : ""
                  }`}
                >
                  {/* Event Header with Color Strip */}
                  <div className={`h-2 ${getEventColor(event.club).solid}`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-full ${getEventColor(event.club).solid} flex items-center justify-center shadow-md`}>
                          <Calendar size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {event.title}
                            </h3>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-700">
                              {event.club}
                            </span>
                            {event.isAttending && (
                              <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full border border-green-200 dark:border-green-700">
                                ✓ Attending
                              </span>
                            )}
                            {isToday(event.event_date) && (
                              <span className="px-3 py-1 bg-orange-50 dark:bg-blue-900/30 text-orange-700 dark:text-blue-300 text-xs font-medium rounded-full border border-orange-200 dark:border-blue-700 animate-pulse">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div className="flex items-center text-zenith-secondary dark:text-gray-300">
                              <Calendar size={16} className="mr-3 text-blue-500" />
                              <span className="font-medium">{getDateLabel(event.event_date)}</span>
                            </div>
                            <div className="flex items-center text-zenith-secondary dark:text-gray-300">
                              <Clock size={16} className="mr-3 text-green-500" />
                              <span className="font-medium">
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                              </span>
                            </div>
                            <div className="flex items-center text-zenith-secondary dark:text-gray-300">
                              <MapPin size={16} className="mr-3 text-orange-500" />
                              <span className="font-medium">{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-center">
                          <div className="text-xs text-zenith-muted dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">
                            Attendees
                          </div>
                          <div className="text-2xl font-bold text-zenith-primary dark:text-white">
                            {event.attendees}
                            {event.maxAttendees && (
                              <span className="text-sm text-zenith-muted dark:text-gray-400 font-normal">
                                /{event.maxAttendees}
                              </span>
                            )}
                          </div>
                          {event.maxAttendees && (
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-3">
                              <div 
                                className={`h-2 rounded-full ${getEventColor(event.club).solid} transition-all duration-300`}
                                style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zenith-border dark:border-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-zenith-muted dark:text-gray-400 font-medium">
                          Organized by <span className="text-zenith-primary dark:text-white font-semibold">{event.organizer}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="flex items-center px-4 py-2 text-zenith-muted dark:text-gray-400 hover:text-zenith-primary dark:hover:text-white transition-colors rounded-lg hover:bg-zenith-section/50 dark:hover:bg-gray-700/50">
                          <ExternalLink size={16} className="mr-2" />
                          View Details
                        </button>
                        {event.isAttending ? (
                          <button 
                            onClick={() => toggleEventAttendance(event.id, true)}
                            className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium border border-red-200 dark:border-red-700"
                          >
                            Leave Event
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleEventAttendance(event.id, false)}
                            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none ${getEventColor(event.club).solid} hover:opacity-90`}
                            disabled={event.maxAttendees ? (event.attendees >= event.maxAttendees) : false}
                          >
                            {event.maxAttendees && event.attendees >= event.maxAttendees 
                              ? '🔒 Event Full' 
                              : '🎫 Join Event'
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
        )}
      </div>

      <ZenChatbot />
    </div>
  );
}
