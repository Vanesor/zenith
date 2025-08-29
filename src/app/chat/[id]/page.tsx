'use client';

import React, { useState, useEffect } from 'react';
import { WhatsAppChatRoom } from '@/components/chat/WhatsAppChatRoom';
import SafeAvatar from "@/components/SafeAvatar";

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  description?: string;
  created_by: string;
  created_at: string;
  participant_count?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomAndUser = async () => {
      try {
        const token = localStorage.getItem('zenith-token');
        if (!token) {
          setError('Please log in to access chat rooms');
          setLoading(false);
          return;
        }

        // Fetch room details
        const roomResponse = await fetch(`/api/chat/rooms/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room details');
        }

        const roomData = await roomResponse.json();
        setRoom(roomData.room);

        // Fetch current user
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }

        const userData = await userResponse.json();
        setCurrentUser(userData.user);

      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAndUser();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-section dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenith-primary mx-auto"></div>
          <p className="mt-4 text-zenith-secondary dark:text-zenith-muted">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (error || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-zenith-section dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-zenith-secondary dark:text-zenith-muted">{error || 'Room or user not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zenith-section">
      <WhatsAppChatRoom
        roomId={room.id}
        roomName={room.name}
        currentUser={currentUser}
        isPrivate={room.type === 'private'}
      />
    </div>
  );
}
