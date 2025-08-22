"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, User, Briefcase, Save, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  club_id?: string;
  event_incharge?: string;
  event_coordinator?: string;
  max_attendees?: number;
  created_by?: string;
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

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  event?: Event | null;
  clubs: Club[];
  mode: 'create' | 'edit' | 'view';
}

export default function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  event, 
  clubs, 
  mode 
}: EventModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    date: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    club_id: '',
    event_incharge: '',
    event_coordinator: '',
    max_attendees: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        ...event,
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        title: '',
        description: '',
        date: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        club_id: user?.club_id || '',
        event_incharge: '',
        event_coordinator: '',
        max_attendees: undefined,
      });
    }
  }, [event, isOpen, mode, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Event title is required');
      }
      if (!formData.event_date) {
        throw new Error('Event date is required');
      }
      if (!formData.start_time) {
        throw new Error('Start time is required');
      }

      // Call the onSave prop with the form data
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;

    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setLoading(true);
      try {
        await onDelete(event.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  const canEdit = mode !== 'view' && (
    user?.role === 'admin' || 
    user?.role === 'coordinator' || 
    user?.id === event?.created_by
  );

  const canDelete = mode === 'edit' && (
    user?.role === 'admin' || 
    user?.role === 'coordinator' || 
    user?.id === event?.created_by
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Enhanced Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: 10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            rotateX: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: 20, 
            rotateX: 10,
            transition: { duration: 0.2 }
          }}
          className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto"
          style={{ perspective: 1000 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20" />
            
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-main/80 backdrop-blur-xl" />
            
            {/* Animated border */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 opacity-50" />
            
            <div className="relative">
              {/* Enhanced Header */}
              <CardHeader className="pb-4 relative">
                {/* Header gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10 rounded-t-lg" />
                
                <div className="relative flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                      {mode === 'create' ? 'Create Event' : mode === 'edit' ? 'Edit Event' : 'Event Details'}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                      {mode === 'create' ? 'Create a new event for your club' : 
                       mode === 'edit' ? 'Update event information' : 
                       'View event details'}
                    </CardDescription>
                  </motion.div>
                  
                  <div className="flex items-center space-x-2">
                    {canDelete && onDelete && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          disabled={loading}
                          className="h-10 w-10 p-0 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900/20 dark:hover:text-gray-400 transition-all duration-200"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl backdrop-blur-sm"
                  >
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                      Event Information
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Event Title *
                        </label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Enter event title"
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe your event"
                          rows={3}
                          disabled={mode === 'view'}
                          className="border-custom rounded-xl bg-main focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Date and Time */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" />
                      Schedule
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date *
                        </label>
                        <Input
                          type="date"
                          value={formData.event_date}
                          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Time *
                        </label>
                        <Input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={formData.end_time || ''}
                          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Location and Club */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-pink-600" />
                      Venue & Organization
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <Input
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Event location"
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Club
                        </label>
                        <Select
                          value={formData.club_id || ''}
                          onValueChange={(value) => setFormData({ ...formData, club_id: value })}
                          disabled={mode === 'view'}
                        >
                          <SelectTrigger className="h-12 border-custom rounded-xl bg-main focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20">
                            <SelectValue placeholder="Select club" />
                          </SelectTrigger>
                          <SelectContent>
                            {clubs.map((club) => (
                              <SelectItem key={club.id} value={club.id}>
                                {club.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>

                  {/* Event Staff */}
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-primary flex items-center">
                      <Users className="w-5 h-5 mr-2 text-indigo-600" />
                      Event Management
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <User className="inline w-4 h-4 mr-1" />
                          Event Incharge
                        </label>
                        <Input
                          value={formData.event_incharge || ''}
                          onChange={(e) => setFormData({ ...formData, event_incharge: e.target.value })}
                          placeholder="Person responsible for the event"
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Briefcase className="inline w-4 h-4 mr-1" />
                          Event Coordinator
                        </label>
                        <Input
                          value={formData.event_coordinator || ''}
                          onChange={(e) => setFormData({ ...formData, event_coordinator: e.target.value })}
                          placeholder="Event coordination contact"
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Attendees
                        </label>
                        <Input
                          type="number"
                          value={formData.max_attendees || ''}
                          onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="Maximum number of attendees"
                          disabled={mode === 'view'}
                          className="h-12 border-custom rounded-xl bg-main focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  {mode !== 'view' && (
                    <motion.div 
                      className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2 h-11 border-2 hover:scale-105 hover:shadow-md transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-primary font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Save className="w-5 h-5 mr-2" />
                        )}
                        {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
                      </Button>
                    </motion.div>
                  )}
                </form>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
