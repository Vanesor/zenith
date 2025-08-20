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
  X,
  Image,
  FileText,
  ChevronLeft,
  Filter,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/contexts/ToastContext';
import { WhatsAppChatRoom } from '@/components/chat/WhatsAppChatRoom';
import { UniversalLoader } from '@/components/UniversalLoader';
import TokenManager from '@/lib/TokenManager';
import MainLayout from '@/components/MainLayout';

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

export default function ChatPage() {
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "public" | "private" | "club">("all");
  
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

  // Filter rooms based on search and type
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.club_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || room.type === filterType;
    
    return matchesSearch && matchesType;
  });

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
        // Select the new room
        setSelectedRoom(data.room);
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
      setSidebarOpen(false);
    }
  };

  // Get room type icon
  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Hash className="w-full h-full p-3 text-white" />;
      case 'private':
        return <Users className="w-full h-full p-3 text-white" />;
      default:
        return null;
    }
  };

  // Get room avatar background color
  const getRoomAvatarBg = (type: string, index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-700',  // Club
      'bg-gradient-to-br from-green-500 to-green-700', // Public
      'bg-gradient-to-br from-purple-500 to-purple-700' // Private
    ];
    
    if (type === 'public') return colors[1];
    if (type === 'private') return colors[2];
    
    // For club type, alternate colors
    const clubColors = [
      'bg-gradient-to-br from-blue-500 to-blue-700',
      'bg-gradient-to-br from-cyan-500 to-cyan-700',
      'bg-gradient-to-br from-teal-500 to-teal-700',
      'bg-gradient-to-br from-indigo-500 to-indigo-700'
    ];
    
    return clubColors[index % clubColors.length];
  };

  if (isLoading || loading) {
    return (
      <MainLayout>
        <div className="w-full h-[calc(100vh-7rem)] flex items-center justify-center">
          <UniversalLoader 
            message="Loading your conversations..."
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 top-16 bg-zenith-main overflow-hidden">
        <div className="flex h-full">
          {/* Mobile backdrop */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Chat Sidebar */}
          <AnimatePresence>
            {(!isMobile || (isMobile && sidebarOpen)) && (
              <motion.div
                initial={{ x: isMobile ? -400 : 0, opacity: isMobile ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`
                  ${isMobile ? 'fixed w-4/5 max-w-sm' : 'w-80'} 
                  h-full bg-zenith-card border-r border-zenith-border flex flex-col z-30
                  shadow-xl
                `}
              >
                {/* Sidebar Header */}
                <div className="p-4 bg-zenith-card border-b border-zenith-border flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-zenith-primary flex items-center">
                      <MessageSquare className="w-6 h-6 mr-2 text-zenith-primary" />
                      Chats
                    </h1>
                    <div className="flex items-center space-x-2">
                      {isManager && (
                        <button
                          onClick={() => setShowCreateRoom(true)}
                          className="p-2 rounded-full hover:bg-zenith-hover transition-colors"
                          title="Create new room"
                        >
                          <Plus className="w-5 h-5 text-zenith-secondary" />
                        </button>
                      )}
                      <button className="p-2 rounded-full hover:bg-zenith-hover transition-colors">
                        <Bell className="w-5 h-5 text-zenith-secondary" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-zenith-hover transition-colors">
                        <MoreVertical className="w-5 h-5 text-zenith-secondary" />
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
                      className="w-full pl-10 pr-4 py-2.5 bg-zenith-section border border-zenith-border rounded-lg 
                               text-zenith-primary placeholder-zenith-muted 
                               focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent
                               transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-zenith-border bg-zenith-card flex-shrink-0">
                  <button
                    className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                      filterType === 'all' 
                        ? 'text-zenith-primary border-b-2 border-zenith-primary bg-zenith-section' 
                        : 'text-zenith-muted hover:text-zenith-secondary hover:bg-zenith-hover'
                    }`}
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </button>
                  <button
                    className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                      filterType === 'club' 
                        ? 'text-zenith-primary border-b-2 border-zenith-primary bg-zenith-section' 
                        : 'text-zenith-muted hover:text-zenith-secondary hover:bg-zenith-hover'
                    }`}
                    onClick={() => setFilterType('club')}
                  >
                    Club
                  </button>
                  <button
                    className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                      filterType === 'public' 
                        ? 'text-zenith-primary border-b-2 border-zenith-primary bg-zenith-section' 
                        : 'text-zenith-muted hover:text-zenith-secondary hover:bg-zenith-hover'
                    }`}
                    onClick={() => setFilterType('public')}
                  >
                    Public
                  </button>
                </div>

                {/* Rooms List */}
                <div className="flex-1 overflow-y-auto bg-zenith-card scrollbar-thin scrollbar-thumb-zenith-border">
                  {filteredRooms.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-zenith-section rounded-full flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-zenith-muted" />
                      </div>
                      <p className="text-zenith-secondary mb-3">No conversations found</p>
                      <p className="text-zenith-muted text-sm mb-4">
                        {searchTerm ? "Try a different search term" : filterType !== 'all' ? "Try a different filter" : "Start a new conversation"}
                      </p>
                      {isManager && (
                        <button
                          onClick={() => setShowCreateRoom(true)}
                          className="mx-auto px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors inline-flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Room
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filteredRooms.map((room, index) => (
                        <motion.div
                          key={room.id}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 cursor-pointer transition-all border-l-4 ${
                            selectedRoom?.id === room.id
                              ? 'bg-zenith-section border-zenith-primary'
                              : 'hover:bg-zenith-hover border-transparent'
                          }`}
                          onClick={() => handleRoomSelect(room)}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Room Avatar */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getRoomAvatarBg(room.type, index)}`}>
                              {room.type === 'club' ? (
                                <span className="text-white font-semibold text-sm">
                                  {room.name.charAt(0).toUpperCase()}
                                </span>
                              ) : (
                                getRoomTypeIcon(room.type)
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-zenith-primary text-sm truncate">
                                  {room.name}
                                </h3>
                                {room.last_message && (
                                  <span className="text-xs text-zenith-muted flex-shrink-0">
                                    {formatTime(room.last_message.created_at)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-zenith-muted truncate">
                                  {room.last_message 
                                    ? `${room.last_message.sender_name}: ${room.last_message.message}` 
                                    : room.description || 'No messages yet'
                                  }
                                </p>
                                {room.unread_count && room.unread_count > 0 && (
                                  <span className="bg-zenith-primary text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center flex-shrink-0 ml-2">
                                    {room.unread_count > 99 ? '99+' : room.unread_count}
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-1 flex items-center text-xs text-zenith-muted">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{room.members_count} members</span>
                                <span className="mx-2">•</span>
                                <span className="capitalize">{room.type}</span>
                              </div>
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

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-zenith-main relative">
            {selectedRoom ? (
              <WhatsAppChatRoom 
                roomId={selectedRoom.id}
                roomName={selectedRoom.name}
                currentUser={user || { id: '', name: '', email: '' }}
                isPrivate={selectedRoom.type === 'private'}
                onInviteUser={() => {
                  // Handle invite user functionality
                  console.log('Invite user clicked');
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-zenith-section">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-zenith-card rounded-full flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-12 h-12 text-zenith-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-zenith-primary mb-2">
                    Welcome to Zenith Chat
                  </h2>
                  <p className="text-zenith-secondary mb-4 max-w-md">
                    Select a conversation from the sidebar to start chatting with your club members and colleagues.
                  </p>
                  {!isMobile && rooms.length === 0 && isManager && (
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="px-6 py-3 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors inline-flex items-center"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Room
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zenith-card rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zenith-primary">Create New Room</h3>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="p-2 hover:bg-zenith-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zenith-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="Enter room name..."
                    className="w-full px-4 py-2.5 bg-zenith-section border border-zenith-border rounded-lg 
                             text-zenith-primary placeholder-zenith-muted
                             focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent
                             transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="Describe this room..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zenith-section border border-zenith-border rounded-lg 
                             text-zenith-primary placeholder-zenith-muted
                             focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent
                             transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
                    Room Type
                  </label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as "public" | "private" | "club" })}
                    className="w-full px-4 py-2.5 bg-zenith-section border border-zenith-border rounded-lg 
                             text-zenith-primary
                             focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent
                             transition-all"
                  >
                    <option value="club">Club Room</option>
                    <option value="public">Public Room</option>
                    <option value="private">Private Room</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateRoom}
                    className="flex-1 px-4 py-2.5 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 
                             transition-colors font-medium"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 px-4 py-2.5 bg-zenith-section text-zenith-secondary rounded-lg hover:bg-zenith-hover 
                             transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
