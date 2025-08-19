"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
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
  X,
  Calendar,
  Check,
  Info,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import MainLayout from "@/components/MainLayout";
import { UniversalLoader } from "@/components/UniversalLoader";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Club color palette for consistent styling
const CLUB_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
];

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  event_date: string; // Server returns this format
  startTime: string;
  endTime?: string;
  location?: string;
  createdBy?: string;
  club?: {
    id: string;
    name: string;
    color?: string;
  };
  attendees?: number;
  isRegistered?: boolean;
}

interface Club {
  id: string;
  name: string;
  color?: string;
}

interface EventsByDay {
  [date: string]: Event[];
}

interface CalendarDay {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const EventsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubColors, setClubColors] = useState<{[clubId: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Function to assign consistent colors to clubs
  useEffect(() => {
    if (clubs.length) {
      const colorMap: {[clubId: string]: string} = {};
      
      clubs.forEach((club, index) => {
        if (club.color) {
          colorMap[club.id] = club.color;
        } else {
          colorMap[club.id] = CLUB_COLORS[index % CLUB_COLORS.length];
        }
      });
      
      setClubColors(colorMap);
    }
  }, [clubs]);

  // Function to get event color based on club
  const getEventColor = (event: Event): string => {
    // If the event has a club with a color, use that
    if (event.club?.color) {
      return event.club.color;
    }
    
    // If we have the clubs list and this event is associated with a club
    if (event.club?.id && clubColors[event.club.id]) {
      return clubColors[event.club.id];
    }
    
    // Default color
    return "#3b82f6"; // Blue
  };

  // Function to get all events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get all clubs
  const fetchClubs = async () => {
    try {
      const response = await fetch("/api/clubs");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setClubs(data);
    } catch (err: any) {
      console.error("Error fetching clubs:", err);
    }
  };

  // Load events and clubs on mount
  useEffect(() => {
    fetchEvents();
    fetchClubs();
  }, []);

  // Generate calendar days whenever the month changes
  useEffect(() => {
    generateCalendarDays(currentMonth);
  }, [currentMonth, events]);

  // Handle search input keydown (Enter to switch to list view)
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setViewMode('list');
    }
  };

  // Filter events based on search and club selection
  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesClub = 
      selectedClub === "all" || 
      event.club?.id === selectedClub;
    
    return matchesSearch && matchesClub;
  });

  // Group events by day for list view
  const eventsByDay = filteredEvents.reduce((acc: EventsByDay, event) => {
    // Use event_date if available, otherwise fall back to date
    const eventDate = event.event_date || event.date;
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(event);
    return acc;
  }, {});

  // Sort days in reverse chronological order
  const sortedDays = Object.keys(eventsByDay).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Generate calendar days for the given month
  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Get first day to display (could be from previous month)
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startDayOfWeek);
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Get events for this day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.event_date || event.date);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      });
      
      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === monthIndex,
        isToday: date.getTime() === today.getTime()
      });
    }
    
    setCalendarDays(days);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  // Handle day click in calendar view
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
  };

  // Handle event click
  const handleEventClick = (event: Event, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedEvent(event);
  };

  // Format a date for display
  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Close the day detail modal
  const closeDayDetail = () => {
    setSelectedDate(null);
  };

  // Close the event detail modal
  const closeEventDetail = () => {
    setSelectedEvent(null);
  };

  return (
    <MainLayout>
      <div className="pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white">Events</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-4 py-2 w-full rounded-lg bg-college-medium border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-college-primary"
              />
            </div>
            
            {/* Club Filter */}
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="px-4 py-2 rounded-lg bg-college-medium border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-college-primary"
            >
              <option value="all">All Clubs</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            
            {/* View Toggles */}
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === "calendar" 
                    ? "bg-college-primary text-white" 
                    : "bg-college-medium text-gray-300 hover:bg-gray-700"
                }`}
              >
                <CalendarIcon size={18} />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === "list" 
                    ? "bg-college-primary text-white" 
                    : "bg-college-medium text-gray-300 hover:bg-gray-700"
                }`}
              >
                <List size={18} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <UniversalLoader fullScreen={false} message="Loading events..." />
          </div>
        ) : error ? (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4 text-red-500">
            {error}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "calendar" ? (
                <div className="bg-college-medium rounded-lg border border-gray-700 overflow-hidden shadow-xl">
                  {/* Calendar Header */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={goToPreviousMonth}
                        className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors"
                      >
                        Today
                      </button>
                      <button 
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 text-center border-b border-gray-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <div key={day} className="py-2 text-sm font-medium text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-px bg-gray-700">
                    {calendarDays.map((day, i) => (
                      <div 
                        key={i} 
                        className={`min-h-[100px] p-1 ${
                          day.isCurrentMonth 
                            ? 'bg-college-medium hover:bg-gray-800 cursor-pointer' 
                            : 'bg-gray-800 text-gray-500'
                        } ${
                          day.isToday 
                            ? 'ring-2 ring-inset ring-college-primary' 
                            : ''
                        } transition-colors`}
                        onClick={() => handleDayClick(day)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className={`text-xs font-medium p-1 ${
                            day.events.length > 0 && day.isCurrentMonth
                              ? 'bg-college-primary/20 rounded-full w-6 h-6 flex items-center justify-center'
                              : ''
                          }`}>
                            {day.date.getDate()}
                          </div>
                          {day.events.length > 0 && (
                            <div className="bg-college-primary/30 rounded-full px-1.5 text-xs text-white">
                              {day.events.length}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-1 space-y-1 max-h-[80px] overflow-hidden">
                          {day.events.slice(0, 3).map((event) => (
                            <div 
                              key={event.id} 
                              className="text-xs px-1 py-1 rounded transition-all hover:opacity-80 cursor-pointer"
                              style={{ 
                                backgroundColor: `${getEventColor(event)}30`,
                                borderLeft: `3px solid ${getEventColor(event)}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event, e);
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate text-white font-medium">{event.title}</span>
                              </div>
                            </div>
                          ))}
                          {day.events.length > 3 && (
                            <div className="text-xs text-gray-400 px-1 mt-1">
                              +{day.events.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Club Color Legend */}
                  {clubs.length > 0 && (
                    <div className="p-4 border-t border-gray-700 bg-gray-800">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Clubs:</h3>
                      <div className="flex flex-wrap gap-2">
                        {clubs.map((club) => (
                          <div 
                            key={club.id} 
                            className="flex items-center gap-1.5 bg-gray-700 rounded-full px-3 py-1"
                            onClick={() => setSelectedClub(club.id)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: clubColors[club.id] || "#3b82f6" }}
                            ></div>
                            <span className="text-xs text-white">{club.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // List View
                <div className="space-y-6">
                  {sortedDays.length > 0 ? (
                    sortedDays.map((day) => (
                      <div key={day} className="rounded-lg overflow-hidden bg-college-medium border border-gray-700 shadow-lg">
                        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <Calendar size={18} className="text-college-primary" />
                            {new Date(day).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </h3>
                          <div className="bg-college-primary/20 text-college-primary px-2 py-0.5 rounded-full text-xs font-medium">
                            {eventsByDay[day].length} {eventsByDay[day].length === 1 ? 'event' : 'events'}
                          </div>
                        </div>
                        <div className="divide-y divide-gray-700">
                          {eventsByDay[day].map((event) => (
                            <div 
                              key={event.id} 
                              className="p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                              onClick={() => handleEventClick(event)}
                            >
                              <div className="flex items-start">
                                <div 
                                  className="w-1 h-full self-stretch rounded-full flex-shrink-0 mr-3"
                                  style={{ backgroundColor: getEventColor(event) }}
                                ></div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-medium text-white">{event.title}</h4>
                                  <div className="mt-1 space-y-1">
                                    <div className="flex items-center text-gray-300">
                                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                      <span>
                                        {event.startTime}
                                        {event.endTime ? ` - ${event.endTime}` : ''}
                                      </span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center text-gray-300">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    {event.club?.name && (
                                      <div className="flex items-center text-gray-300">
                                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{event.club.name}</span>
                                      </div>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="mt-2 text-gray-400 line-clamp-2">{event.description}</p>
                                  )}
                                  <div className="mt-3">
                                    <button 
                                      className="inline-flex items-center text-college-primary hover:text-college-accent"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/events/${event.id}`);
                                      }}
                                    >
                                      <span className="mr-1">View Details</span>
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-college-medium p-8 rounded-lg border border-gray-700 text-center">
                      <p className="text-gray-400">No events found matching your criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeDayDetail}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-college-medium rounded-xl max-w-xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                  <Calendar className="text-college-primary" size={20} />
                  {formatDisplayDate(selectedDate)}
                </h3>
                <button 
                  className="p-1.5 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  onClick={closeDayDetail}
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-5 max-h-[calc(80vh-70px)]">
                {calendarDays
                  .find(day => 
                    day.date.getDate() === selectedDate.getDate() &&
                    day.date.getMonth() === selectedDate.getMonth() &&
                    day.date.getFullYear() === selectedDate.getFullYear()
                  )?.events.length ? (
                  <div className="divide-y divide-gray-700">
                    {calendarDays
                      .find(day => 
                        day.date.getDate() === selectedDate.getDate() &&
                        day.date.getMonth() === selectedDate.getMonth() &&
                        day.date.getFullYear() === selectedDate.getFullYear()
                      )
                      ?.events.map((event) => (
                        <div 
                          key={event.id} 
                          className="py-4 first:pt-0 last:pb-0 hover:bg-gray-800/50 rounded-lg p-2 cursor-pointer transition-colors"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-start">
                            <div 
                              className="w-2 self-stretch rounded-full flex-shrink-0 mr-4"
                              style={{ backgroundColor: getEventColor(event) }}
                            ></div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <h4 className="text-lg font-medium text-white">{event.title}</h4>
                                {event.club?.name && (
                                  <span 
                                    className="text-xs py-1 px-2 rounded-full text-white"
                                    style={{ backgroundColor: getEventColor(event) + "50" }}
                                  >
                                    {event.club.name}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center text-gray-300 text-sm">
                                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>
                                    {event.startTime}
                                    {event.endTime ? ` - ${event.endTime}` : ''}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center text-gray-300 text-sm">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                              {event.description && (
                                <p className="mt-3 text-gray-400 text-sm bg-gray-800/50 p-2 rounded-lg border-l-2 border-gray-700">
                                  {event.description}
                                </p>
                              )}
                              <div className="mt-4 flex space-x-3">
                                <button 
                                  className="flex items-center gap-1 text-sm bg-college-primary/10 hover:bg-college-primary/20 text-college-primary px-3 py-1.5 rounded-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/events/${event.id}`);
                                  }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                                {user && (
                                  <button 
                                    className="flex items-center gap-1 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>RSVP</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-10 flex flex-col items-center">
                    <Calendar className="w-12 h-12 text-gray-500 mb-2" />
                    <p className="text-gray-400">No events scheduled for this day.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeEventDetail}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-college-medium rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div 
                  className="h-32 w-full bg-gradient-to-r" 
                  style={{ 
                    backgroundImage: `linear-gradient(to right, ${getEventColor(selectedEvent)}50, ${getEventColor(selectedEvent)}20)`
                  }}
                ></div>
                <button 
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                  onClick={closeEventDetail}
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="px-6 py-5 -mt-6">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-white mb-3">{selectedEvent.title}</h2>
                    {selectedEvent.club?.name && (
                      <span 
                        className="text-xs py-1 px-3 rounded-full text-white font-medium"
                        style={{ backgroundColor: getEventColor(selectedEvent) }}
                      >
                        {selectedEvent.club.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{new Date(selectedEvent.event_date || selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-5 h-5 mr-3 text-gray-400" />
                      <span>
                        {selectedEvent.startTime}
                        {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center text-gray-300 md:col-span-2">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedEvent.description && (
                    <div className="mb-5">
                      <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        About
                      </h3>
                      <p className="text-gray-300 bg-gray-800/50 p-3 rounded-lg border-l-2 border-gray-700">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-college-primary hover:bg-college-primary/80 text-white py-2 px-4 rounded-lg transition-colors"
                      onClick={() => router.push(`/events/${selectedEvent.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    
                    {user && (
                      <>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                          <Check className="w-4 h-4" />
                          <span>RSVP</span>
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-gray-600 hover:bg-gray-800 text-gray-300 py-2 px-4 rounded-lg transition-colors">
                          <Calendar className="w-4 h-4" />
                          <span>Add to Calendar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Add Button for authorized users */}
      {user && (user.role === 'admin' || user.role === 'coordinator' || user.role === 'committee_member') && (
        <button 
          className="fixed bottom-8 right-8 bg-college-primary hover:bg-college-accent text-white p-3 rounded-full shadow-lg transition-colors z-30"
          onClick={() => router.push('/events/create')}
        >
          <Plus size={24} />
        </button>
      )}
      
      {/* Floating Chatbot */}
      <ZenChatbot />
    </MainLayout>
  );
};

export default EventsPage;
