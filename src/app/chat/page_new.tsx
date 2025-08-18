'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  MoreVertical,
  Plus,
  Settings,
  Users,
  Hash,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Edit,
  Trash2,
  Reply,
  Copy,
  Star,
  Clock,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/contexts/ToastContext';
import { WhatsAppChatRoom } from '@/components/chat/ModernWhatsAppChatRoom';
import TokenManager from '@/lib/TokenManager';
import { PaperpalHeader } from '@/components/PaperpalHeader';

export const dynamic = 'force-dynamic';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  club_id: string;
  club_name: string;
  type: "public" | "private" | "club";
  created_by: string;
  members_count: number;
  created_at: string;
  last_message?: {
    id: string;
    message: string;
    sender_name: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count?: number;
}

interface ChatPageProps {}

export default function ChatPage({}: ChatPageProps) {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access the chat system",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // New room form
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "club" as "public" | "private" | "club",
  });

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isManager = user && [
    "coordinator", "co_coordinator", "secretary", "media", "president",
    "vice_president", "innovation_head", "treasurer", "outreach"
  ].includes(user.role);

  // Fetch chat rooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!user || !isAuthenticated) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/chat/rooms");

        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms || []);
          // Auto-select first room if available and not mobile
          if (data.rooms && data.rooms.length > 0 && !isMobile) {
            setSelectedRoom(data.rooms[0]);
          }
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load chat rooms'
          });
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load chat rooms'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [user, isAuthenticated, showToast, isMobile]);

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.club_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new room
  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Room name is required'
      });
      return;
    }

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom)
      });

      const data = await response.json();

      if (data.success) {
        setRooms([data.room, ...rooms]);
        setShowCreateRoom(false);
        setNewRoom({ name: "", description: "", type: "club" });
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Chat room created successfully!'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to create room'
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create room'
      });
    }
  };

  // Format time for last message
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Room selection handler
  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    if (isMobile) {
      // On mobile, hide the sidebar when selecting a room
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zenith-dark via-zenith-darker to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zenith-primary mx-auto mb-4"></div>
          <p className="text-zenith-muted">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zenith-dark via-zenith-darker to-black">
      <PaperpalHeader 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Chat Sidebar */}
        <AnimatePresence>
          {(!isMobile || !selectedRoom) && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-full md:w-80 bg-zenith-darker border-r border-zenith-muted/20 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-zenith-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2 text-zenith-primary" />
                    Messages
                  </h1>
                  <div className="flex items-center space-x-2">
                    {isManager && (
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors"
                        title="Create new room"
                      >
                        <Plus className="w-5 h-5 text-zenith-muted" />
                      </button>
                    )}
                    <button className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors">
                      <MoreVertical className="w-5 h-5 text-zenith-muted" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zenith-muted" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zenith-dark border border-zenith-muted/20 rounded-lg text-white placeholder-zenith-muted focus:outline-none focus:border-zenith-primary transition-colors"
                  />
                </div>
              </div>

              {/* Rooms List */}
              <div className="flex-1 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-zenith-muted mx-auto mb-4" />
                    <p className="text-zenith-muted mb-2">No conversations yet</p>
                    {isManager && (
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className="text-zenith-primary hover:text-zenith-primary/80 transition-colors"
                      >
                        Create your first room
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredRooms.map((room) => (
                      <motion.div
                        key={room.id}
                        whileHover={{ x: 4 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedRoom?.id === room.id
                            ? 'bg-zenith-primary/20 border-l-4 border-zenith-primary'
                            : 'hover:bg-zenith-muted/10'
                        }`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Room Avatar */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                              room.type === 'public' ? 'bg-green-600' :
                              room.type === 'private' ? 'bg-blue-600' : 'bg-purple-600'
                            }`}>
                              {room.type === 'public' ? (
                                <Hash className="w-6 h-6" />
                              ) : room.type === 'private' ? (
                                <Users className="w-6 h-6" />
                              ) : (
                                room.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            {room.unread_count && room.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-zenith-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {room.unread_count > 9 ? '9+' : room.unread_count}
                              </div>
                            )}
                          </div>

                          {/* Room Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white truncate">
                                {room.name}
                              </h3>
                              {room.last_message && (
                                <span className="text-xs text-zenith-muted">
                                  {formatTime(room.last_message.created_at)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-zenith-muted truncate">
                                {room.last_message ? (
                                  <>
                                    <span className="font-medium">
                                      {room.last_message.sender_name}:
                                    </span>{' '}
                                    {room.last_message.message}
                                  </>
                                ) : (
                                  room.description || 'No messages yet'
                                )}
                              </p>
                              {room.last_message && !room.last_message.is_read && (
                                <div className="w-2 h-2 bg-zenith-primary rounded-full"></div>
                              )}
                            </div>

                            {/* Club info */}
                            {room.club_name && (
                              <div className="text-xs text-zenith-muted/60 truncate">
                                {room.club_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <WhatsAppChatRoom
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              currentUser={user!}
              isPrivate={selectedRoom.type === 'private'}
              onInviteUser={() => {}}
              onBack={() => setSelectedRoom(null)}
              showMobileBack={isMobile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-zenith-dark">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-zenith-primary to-zenith-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Welcome to Zenith Chat
                </h2>
                <p className="text-zenith-muted mb-6">
                  Select a conversation to start messaging or create a new room to begin chatting with your team.
                </p>
                {isManager && rooms.length === 0 && (
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="px-6 py-3 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors flex items-center mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Room
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateRoom(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zenith-darker border border-zenith-muted/20 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Room</h2>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="p-1 rounded-full hover:bg-zenith-muted/20 transition-colors"
                >
                  <X className="w-5 h-5 text-zenith-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zenith-muted mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-4 py-2 bg-zenith-dark border border-zenith-muted/20 rounded-lg text-white placeholder-zenith-muted focus:outline-none focus:border-zenith-primary transition-colors"
                    placeholder="Enter room name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-muted mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="w-full px-4 py-2 bg-zenith-dark border border-zenith-muted/20 rounded-lg text-white placeholder-zenith-muted focus:outline-none focus:border-zenith-primary transition-colors resize-none"
                    placeholder="Room description..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-muted mb-2">
                    Room Type
                  </label>
                  <div className="space-y-2">
                    {(['club', 'public', 'private'] as const).map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="roomType"
                          value={type}
                          checked={newRoom.type === type}
                          onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as any })}
                          className="mr-3 text-zenith-primary focus:ring-zenith-primary"
                        />
                        <span className="text-white capitalize">
                          {type === 'club' ? 'Club Room' : type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-zenith-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoom.name.trim()}
                  className="px-6 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
