'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define TypeScript interfaces for our data
interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface EventsListProps {
  clubId: string;
}

export default function EventsList({ clubId }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        
        // Fetch events using Supabase client
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            event_date,
            event_time,
            location,
            status
          `)
          .eq('club_id', clubId)
          .order('event_date', { ascending: true });
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    if (clubId) {
      loadEvents();
    }
  }, [clubId]);
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5); // Extract HH:MM from time string
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded">
        Error loading events: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upcoming Events</h2>
      
      {events.length === 0 ? (
        <p className="text-zenith-muted">No upcoming events</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 shadow-sm bg-zenith-card">
              <h3 className="font-medium text-lg">{event.title}</h3>
              
              <div className="mt-2 text-sm text-zenith-muted">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDate(event.event_date)}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatTime(event.event_time)}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>
              
              {event.description && (
                <p className="mt-2 text-sm text-zenith-secondary">{event.description}</p>
              )}
              
              <div className="mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                  event.status === 'completed' ? 'bg-zenith-section text-zenith-primary' :
                  'bg-red-100 text-red-800'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
