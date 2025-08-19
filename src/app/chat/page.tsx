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
import { WhatsAppChatRoom } from '@/components/chat/ModernWhatsAppChatRoom';
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
      'bg-gradient-to-br from-college-primary to-college-accent'
    ];
    
    return clubColors[index % clubColors.length];
  };

  if (isLoading || loading) {
    return (
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
          <UniversalLoader 
            message="Loading your conversations..."
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-college-dark">
        {/* Chat Sidebar */}
        <AnimatePresence>
          {(!isMobile || (isMobile && sidebarOpen)) && (
            <motion.div
              initial={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full md:w-96 bg-college-medium border-r border-gray-700 flex flex-col z-10"
            >
              {/* Sidebar Header */}
              <div className="p-4 bg-college-medium border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2 text-college-primary" />
                    Chats
                  </h1>
                  <div className="flex items-center space-x-2">
                    {isManager && (
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                        title="Create new room"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                      <Bell className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                      <MoreVertical className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-college-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-college-primary transition-colors"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-gray-700 bg-college-medium">
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'text-college-primary border-b-2 border-college-primary' 
                      : 'text-gray-300 hover:bg-gray-700/30'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                    filterType === 'club' 
                      ? 'text-college-primary border-b-2 border-college-primary' 
                      : 'text-gray-300 hover:bg-gray-700/30'
                  }`}
                  onClick={() => setFilterType('club')}
                >
                  Club
                </button>
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                    filterType === 'public' 
                      ? 'text-college-primary border-b-2 border-college-primary' 
                      : 'text-gray-300 hover:bg-gray-700/30'
                  }`}
                  onClick={() => setFilterType('public')}
                >
                  Public
                </button>

              </div>

              {/* Rooms List */}
              <div className="flex-1 overflow-y-auto bg-college-medium">
                {filteredRooms.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-college-dark rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-300 mb-3">No conversations found</p>
                    <p className="text-gray-400 text-sm mb-4">
                      {searchTerm ? "Try a different search term" : filterType !== 'all' ? "Try a different filter" : "Start a new conversation"}
                    </p>
                    {isManager && (
                      <button
                        onClick={() => setShowCreateRoom(true)}
                        className="mx-auto px-4 py-2 bg-college-primary text-white rounded-lg hover:bg-college-primary/90 transition-colors inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Room
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredRooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedRoom?.id === room.id
                            ? 'bg-college-dark border-l-4 border-college-primary'
                            : 'hover:bg-gray-800 border-l-4 border-transparent'
                        }`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Room Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold ${
                              getRoomAvatarBg(room.type, index)
                            }`}>
                              {room.type === 'public' || room.type === 'private' ? (
                                getRoomTypeIcon(room.type)
                              ) : (
                                <span className="text-xl">{room.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            {room.unread_count && room.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-college-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {room.unread_count > 9 ? '9+' : room.unread_count}
                              </div>
                            )}
                          </div>

                          {/* Room Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-white truncate">
                                {room.name}
                              </h3>
                              {room.last_message && (
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {formatTime(room.last_message.created_at)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-sm text-gray-300 truncate flex items-center">
                                {room.last_message ? (
                                  <>
                                    {room.last_message.sender_name === user?.name ? (
                                      <span className="flex items-center text-gray-400">
                                        <CheckCheck className="w-3 h-3 mr-1" />
                                        You:
                                      </span>
                                    ) : (
                                      <span className="font-medium mr-1">
                                        {room.last_message.sender_name.split(' ')[0]}:
                                      </span>
                                    )}{' '}
                                    <span className="truncate">{room.last_message.message}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    {room.description || 'No messages yet'}
                                  </span>
                                )}
                              </p>
                              {room.last_message && !room.last_message.is_read && room.last_message.sender_name !== user?.name && (
                                <div className="w-2.5 h-2.5 bg-college-primary rounded-full"></div>
                              )}
                            </div>

                            {/* Club info */}
                            {room.club_name && (
                              <div className="text-xs text-gray-400 truncate mt-0.5">
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
        <div className="flex-1 flex flex-col relative">
          {isMobile && selectedRoom && !sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="absolute top-4 left-4 z-20 p-2 bg-college-medium rounded-full shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          
          {selectedRoom ? (
            <WhatsAppChatRoom
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              currentUser={user!}
              isPrivate={selectedRoom.type === 'private'}
              onInviteUser={() => {}}
              onBack={() => {
                if (isMobile) {
                  setSidebarOpen(true);
                }
                setSelectedRoom(null);
              }}
              showMobileBack={isMobile && !sidebarOpen}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-college-dark">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-college-primary to-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <MessageSquare className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Welcome to College Chat
                </h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Connect with your classmates, participate in club discussions, and collaborate on projects in real-time.
                </p>
                {isManager && (
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="px-6 py-3 bg-college-primary text-white rounded-lg hover:bg-college-accent transition-colors flex items-center mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Room
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateRoom(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-college-medium border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Room</h2>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-4 py-3 bg-college-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-college-primary transition-colors"
                    placeholder="Enter room name..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="w-full px-4 py-3 bg-college-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-college-primary transition-colors resize-none"
                    placeholder="Room description..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Room Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['club', 'public'] as const).map((type) => (
                      <div
                        key={type}
                        onClick={() => setNewRoom({ ...newRoom, type })}
                        className={`flex flex-col items-center py-3 px-2 rounded-lg cursor-pointer transition-all ${
                          newRoom.type === type
                            ? 'bg-college-primary/20 border-2 border-college-primary'
                            : 'bg-college-dark border-2 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          newRoom.type === type ? 'bg-college-primary' : 'bg-gray-700'
                        }`}>
                          {type === 'club' ? (
                            <Users className="w-5 h-5 text-white" />
                          ) : type === 'public' ? (
                            <Hash className="w-5 h-5 text-white" />
                          ) : (
                            <Lock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <span className={`text-sm font-medium capitalize ${
                          newRoom.type === type ? 'text-college-primary' : 'text-gray-300'
                        }`}>
                          {type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoom.name.trim()}
                  className="px-6 py-2.5 bg-college-primary text-white rounded-lg hover:bg-college-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

// Missing Lock icon component
function Lock({ className = "w-6 h-6", ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
