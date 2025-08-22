"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Star,
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Tag,
  User,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import CreateEventModal from '@/components/events/CreateEventModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  club_id: string;
  club_name: string;
  creator_id: string;
  creator_name: string;
  max_attendees?: number;
  attendees_count: number;
  category: string;
  status: 'draft' | 'published' | 'cancelled';
  featured_image?: string;
  tags: string[];
  is_attending?: boolean;
  created_at: string;
  updated_at: string;
}

interface Club {
  id: string;
  name: string;
  type: string;
}

// Calendar View Component
interface CalendarViewProps {
  events: Event[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  setShowDayDetails: (show: boolean) => void;
  clubColors: Record<string, string>;
  clubs: Club[];
}

function CalendarView({ 
  events, 
  currentDate, 
  setCurrentDate, 
  selectedDate, 
  setSelectedDate, 
  setShowDayDetails, 
  clubColors,
  clubs 
}: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const getClubColor = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    const clubType = club?.type?.toLowerCase() || 'default';
    return clubColors[clubType] || clubColors.default;
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    if (dayEvents.length > 0) {
      setSelectedDate(date);
      setShowDayDetails(true);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="zenith-bg-card border zenith-border">
      <CardHeader className="zenith-bg-section border-b zenith-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="zenith-text-primary">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <p className="zenith-text-secondary text-sm mt-1">
              Click on a day with events to see details
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="zenith-bg-card zenith-border hover:zenith-bg-hover"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="zenith-bg-card zenith-border hover:zenith-bg-hover"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center border-b zenith-border zenith-bg-section">
              <span className="text-sm font-medium zenith-text-primary">{day}</span>
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] p-2 border-b border-r zenith-border cursor-pointer transition-colors ${
                  isCurrentMonth ? 'zenith-bg-card hover:zenith-bg-hover' : 'zenith-bg-section'
                } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentMonth 
                      ? isTodayDate 
                        ? 'text-blue-600 font-bold' 
                        : 'zenith-text-primary'
                      : 'zenith-text-muted'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs zenith-text-secondary">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* Event Dots */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`w-2 h-2 rounded-full ${getClubColor(event.club_id)}`}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs zenith-text-muted">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t zenith-border zenith-bg-section">
          <h4 className="text-sm font-medium zenith-text-primary mb-2">Club Colors</h4>
          <div className="flex flex-wrap gap-4">
            {clubs.map(club => (
              <div key={club.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getClubColor(club.id)}`} />
                <span className="text-sm zenith-text-secondary">{club.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Club colors mapping
  const clubColors: Record<string, string> = {
    'innovation': 'bg-blue-500',
    'web-development': 'bg-green-500', 
    'app-development': 'bg-purple-500',
    'cybersecurity': 'bg-red-500',
    'default': 'bg-gray-500'
  };
  
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Fetch events
  useEffect(() => {
    fetchEvents();
    fetchClubs();
    checkPermissions();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const checkPermissions = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/events/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const toggleAttendance = async (eventId: string, isAttending: boolean) => {
    if (!user) {
      showToast({
        title: "Authentication Required",
        message: "Please sign in to register for events.",
        type: "error"
      });
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/attend`, {
        method: isAttending ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                is_attending: !isAttending,
                attendees_count: isAttending ? event.attendees_count - 1 : event.attendees_count + 1
              } 
            : event
        ));
        
        showToast({
          title: isAttending ? "Left Event" : "Joined Event",
          message: isAttending ? "You have left the event." : "You have joined the event!",
          type: "success"
        });
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      showToast({
        title: "Error",
        message: "Failed to update attendance. Please try again.",
        type: "error"
      });
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.club_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesClub = selectedClub === 'all' || event.club_id === selectedClub;
    
    return matchesSearch && matchesCategory && matchesClub;
  });

  // Get unique categories
  const categories = Array.from(new Set(events.map(event => event.category))).filter(Boolean);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Events & Calendar
              </h1>
              <p className="text-lg text-secondary">
                Discover and join exciting events happening in your community
              </p>
            </div>
            
            {permissions?.canCreate && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Total Events</p>
                  <p className="text-2xl font-bold text-primary">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Attending</p>
                  <p className="text-2xl font-bold text-primary">
                    {events.filter(e => e.is_attending).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">This Month</p>
                  <p className="text-2xl font-bold text-primary">
                    {events.filter(e => new Date(e.start_time).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Categories</p>
                  <p className="text-2xl font-bold text-primary">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-card border border-custom">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    icon={<Search />}
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg zenith-bg-card zenith-text-primary"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg zenith-bg-card zenith-text-primary"
                  >
                    <option value="all">All Clubs</option>
                    {clubs.map(club => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex rounded-lg border border-custom">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-3 py-2 rounded-l-lg ${viewMode === 'calendar' ? 'bg-blue-600 text-primary' : 'bg-main text-secondary hover:bg-gray-100'}`}
                    >
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Calendar
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-primary' : 'bg-main text-secondary hover:bg-gray-100'}`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-primary' : 'bg-main text-secondary hover:bg-gray-100'}`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Grid/List/Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === 'calendar' ? (
            <CalendarView 
              events={filteredEvents}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setShowDayDetails={setShowDayDetails}
              clubColors={clubColors}
              clubs={clubs}
            />
          ) : filteredEvents.length === 0 ? (
            <Card className="bg-card border border-custom">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">
                  No events found
                </h3>
                <p className="text-secondary mb-6">
                  {searchTerm || selectedCategory !== 'all' || selectedClub !== 'all'
                    ? "Try adjusting your search criteria"
                    : "No events are currently available. Check back later!"}
                </p>
                {permissions?.canCreate && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Event
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border border-custom hover:shadow-lg transition-all duration-300">
                    {viewMode === 'grid' ? (
                      <>
                        {/* Featured Image */}
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden rounded-t-lg">
                          {event.featured_image ? (
                            <img
                              src={event.featured_image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Calendar className="w-12 h-12 text-primary opacity-50" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${getStatusColor(event.status)} border`}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-primary line-clamp-2">
                              {event.title}
                            </h3>
                          </div>

                          <p className="text-secondary text-sm mb-4 line-clamp-2">
                            {event.description}
                          </p>

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center text-secondary">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{formatDate(event.start_time)}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center text-secondary">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            <div className="flex items-center text-secondary">
                              <Users className="w-4 h-4 mr-2" />
                              <span>
                                {event.attendees_count} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attendees
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-custom">
                            <div className="flex flex-col">
                              <Badge variant="secondary" className="text-xs w-fit mb-1">
                                {event.club_name}
                              </Badge>
                              <span className="text-xs text-secondary">
                                by {event.creator_name}
                              </span>
                            </div>

                            {event.is_attending ? (
                              <Button 
                                onClick={() => toggleAttendance(event.id, true)}
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Leave
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => toggleAttendance(event.id, false)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-primary"
                                disabled={!!(event.max_attendees && event.attendees_count >= event.max_attendees)}
                              >
                                {event.max_attendees && event.attendees_count >= event.max_attendees ? 'Full' : 'Join'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      /* List View */
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-6">
                          <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                            {event.featured_image ? (
                              <img
                                src={event.featured_image}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Calendar className="w-8 h-8 text-primary opacity-50" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-primary truncate mb-1">
                                  {event.title}
                                </h3>
                                <p className="text-secondary text-sm mb-2 line-clamp-1">
                                  {event.description}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-sm text-secondary">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{formatDate(event.start_time)}</span>
                                  </div>
                                  
                                  {event.location && (
                                    <div className="flex items-center">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>{event.attendees_count} attendees</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 ml-4">
                                <Badge className={`${getStatusColor(event.status)} border`}>
                                  {event.status}
                                </Badge>
                                
                                {event.is_attending ? (
                                  <Button 
                                    onClick={() => toggleAttendance(event.id, true)}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    Leave
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => toggleAttendance(event.id, false)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-primary"
                                    disabled={!!(event.max_attendees && event.attendees_count >= event.max_attendees)}
                                  >
                                    {event.max_attendees && event.attendees_count >= event.max_attendees ? 'Full' : 'Join'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={() => {
          setShowCreateModal(false);
          fetchEvents(); // Refresh events list
        }}
      />

      {/* Day Details Modal */}
      {showDayDetails && selectedDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDayDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="zenith-bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border zenith-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b zenith-border zenith-bg-section">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold zenith-text-primary">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </h2>
                  <p className="zenith-text-secondary">
                    {events.filter(event => isSameDay(parseISO(event.start_time), selectedDate)).length} events
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDayDetails(false)}
                  className="rounded-full p-2 h-auto zenith-text-muted hover:zenith-text-primary hover:zenith-bg-hover"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto zenith-bg-card">
              <div className="space-y-4">
                {events
                  .filter(event => isSameDay(parseISO(event.start_time), selectedDate))
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="zenith-bg-section rounded-lg p-4 border zenith-border"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full ${clubColors[clubs.find(c => c.id === event.club_id)?.type?.toLowerCase() || 'default'] || clubColors.default} mt-1`} />
                        <div className="flex-1">
                          <h3 className="font-semibold zenith-text-primary mb-1">
                            {event.title}
                          </h3>
                          <p className="zenith-text-secondary text-sm mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm zenith-text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.attendees_count}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(event.status)} border`}>
                          {event.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
