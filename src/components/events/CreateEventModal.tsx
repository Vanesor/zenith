"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Tag,
  Image as ImageIcon,
  Globe,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import TokenManager from '@/lib/TokenManager';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

interface Club {
  id: string;
  name: string;
  type: string;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    club_id: '',
    max_attendees: '',
    registration_required: false,
    is_public: true,
    event_type: 'workshop',
    tags: '',
    banner_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClubs();
      checkPermissions();
      // Set default club if user has one
      if (user?.club_id) {
        setFormData(prev => ({ ...prev, club_id: user.club_id || '' }));
      }
    }
  }, [isOpen, user]);

  const fetchClubs = async () => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch('/api/clubs');
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch('/api/events/permissions');
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokenManager = TokenManager.getInstance();
      
      // Combine date and time
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
      
      const eventData = {
        ...formData,
        event_date: eventDateTime.toISOString(),
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await tokenManager.authenticatedFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Event Created',
          message: 'Your event has been created successfully'
        });
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          event_date: '',
          event_time: '',
          location: '',
          club_id: user?.club_id || '',
          max_attendees: '',
          registration_required: false,
          is_public: true,
          event_type: 'workshop',
          tags: '',
          banner_url: ''
        });
        
        onEventCreated?.();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create event'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const canCreateEvent = permissions?.canCreate || user?.role === 'coordinator' || user?.role === 'president';

  if (!canCreateEvent) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 zenith-bg-backdrop backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto zenith-bg-secondary rounded-2xl shadow-2xl border zenith-border-primary"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b zenith-border-primary">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold zenith-text-primary">Create New Event</h2>
                  <p className="text-sm zenith-text-secondary">Add a new event to your club</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl zenith-text-secondary hover:zenith-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium zenith-text-primary">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    Event Title *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary placeholder-zenith-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium zenith-text-primary mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Event Date *
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium zenith-text-primary mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Event Time *
                    </label>
                    <input
                      type="time"
                      name="event_time"
                      value={formData.event_time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    Location *
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Enter event location"
                    icon={<MapPin />}
                  />
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium zenith-text-primary">Event Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium zenith-text-primary mb-2">
                      Club
                    </label>
                    <select
                      value={formData.club_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, club_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg zenith-bg-card zenith-text-primary"
                      required
                    >
                      <option value="">Select Club</option>
                      {clubs.map(club => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium zenith-text-primary mb-2">
                      Event Type
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg zenith-bg-card zenith-text-primary"
                      required
                    >
                      <option value="">Select Event Type</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="competition">Competition</option>
                      <option value="meeting">Meeting</option>
                      <option value="social">Social Event</option>
                      <option value="conference">Conference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Maximum Attendees
                  </label>
                  <input
                    type="number"
                    name="max_attendees"
                    value={formData.max_attendees}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary placeholder-zenith-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    <Tag className="inline w-4 h-4 mr-1" />
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary placeholder-zenith-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Separate tags with commas (e.g., workshop, coding, ai)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium zenith-text-primary mb-2">
                    <ImageIcon className="inline w-4 h-4 mr-1" />
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    name="banner_url"
                    value={formData.banner_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl zenith-bg-primary border zenith-border-primary zenith-text-primary placeholder-zenith-text-secondary focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium zenith-text-primary">Settings</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="registration_required"
                      checked={formData.registration_required}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="zenith-text-primary">Registration Required</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      {formData.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span className="zenith-text-primary">
                        {formData.is_public ? 'Public Event' : 'Private Event'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t zenith-border-primary">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
