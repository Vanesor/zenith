"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Users, Hash, Plus, X, MoreVertical, Edit3, Trash2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/contexts/ToastContext";
import { EnhancedChatRoom } from "@/components/chat/EnhancedChatRoom";
import TokenManager from "@/lib/TokenManager";
import { unstable_noStore as noStore } from 'next/cache';

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
}

export default function ChatPage() {
  noStore(); // Prevent static generation
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to access the chat system",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "club" as "public" | "private" | "club",
  });

  // Room management state
  const [showRoomMenu, setShowRoomMenu] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<ChatRoom | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<ChatRoom | null>(null);
  const [renameValue, setRenameValue] = useState("");
  
  // Enhanced chat features
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  
  // Debug state changes
  useEffect(() => {
    console.log('showRenameModal changed:', showRenameModal);
  }, [showRenameModal]);
  
  useEffect(() => {
    console.log('showDeleteModal changed:', showDeleteModal);
  }, [showDeleteModal]);

  const isManager =
    user &&
    [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!user || !isAuthenticated) return;
      if (!user) return;

      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/chat/rooms");

        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms || []);
          // Auto-select first room if available
          if (data.rooms && data.rooms.length > 0) {
            setSelectedRoom(data.rooms[0]);
          }
        } else {
          console.error("Failed to fetch chat rooms");
          showToast({
            type: "error",
            title: "Load Failed",
            message: "Failed to load chat rooms",
          });
        }
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
        showToast({
          type: "error",
          title: "Load Failed",
          message: "Failed to load chat rooms",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [user, isAuthenticated, showToast]);

  // Close room menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if clicking outside the menu
      if (showRoomMenu) {
        // Check if the click target is a descendant of any menu element
        const menuElements = document.querySelectorAll('.room-menu-container');
        let clickedInsideMenu = false;
        
        menuElements.forEach(menu => {
          if (menu.contains(event.target as Node)) {
            clickedInsideMenu = true;
          }
        });
        
        if (!clickedInsideMenu) {
          setShowRoomMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoomMenu]);

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      showToast({
        type: "error",
        title: "Invalid Input",
        message: "Room name is required",
      });
      return;
    }

    // Check for duplicate room names
    const duplicateRoom = rooms.find(
      (room) => room.name.toLowerCase() === newRoom.name.trim().toLowerCase()
    );
    
    if (duplicateRoom) {
      showToast({
        type: "error",
        title: "Duplicate Name",
        message: "A room with this name already exists",
      });
      return;
    }

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch("/api/chat/rooms", {
        method: "POST",
        body: JSON.stringify(newRoom),
      });

      if (response.ok) {
        const data = await response.json();
        setRooms((prev) => [...prev, data.room]);
        setNewRoom({ name: "", description: "", type: "club" });
        setShowCreateRoom(false);
        showToast({
          type: "success",
          title: "Room Created",
          message: "Chat room created successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Create Failed",
          message: errorData.error || "Failed to create room",
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      showToast({
        type: "error",
        title: "Create Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  const handleRenameRoom = async () => {
    console.log('handleRenameRoom called, showRenameModal:', showRenameModal);
    
    if (!showRenameModal || !renameValue.trim()) {
      console.log('Validation failed: showRenameModal or renameValue is empty');
      showToast({
        type: "error",
        title: "Invalid Input",
        message: "Room name is required",
      });
      return;
    }
    
    // Prevent the rename value from being the same as the current name
    if (showRenameModal.name === renameValue.trim()) {
      console.log('Name unchanged, closing modal');
      setShowRenameModal(null);
      setRenameValue("");
      return;
    }

    // Check for duplicate names
    const duplicateRoom = rooms.find(
      (room) => room.id !== showRenameModal.id && 
      room.name.toLowerCase() === renameValue.trim().toLowerCase()
    );
    
    if (duplicateRoom) {
      showToast({
        type: "error",
        title: "Duplicate Name",
        message: "A room with this name already exists",
      });
      return;
    }

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${showRenameModal.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: renameValue.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setRooms((prev) => 
          prev.map((room) => 
            room.id === showRenameModal.id 
              ? { ...room, name: renameValue.trim() }
              : room
          )
        );
        
        // Update selected room if it's the one being renamed
        if (selectedRoom?.id === showRenameModal.id) {
          setSelectedRoom({ ...selectedRoom, name: renameValue.trim() });
        }
        
        setShowRenameModal(null);
        setRenameValue("");
        showToast({
          type: "success",
          title: "Room Renamed",
          message: "Room name updated successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Rename Failed",
          message: errorData.error || "Failed to rename room",
        });
      }
    } catch (error) {
      console.error("Error renaming room:", error);
      showToast({
        type: "error",
        title: "Rename Failed",  
        message: "An unexpected error occurred",
      });
    }
  };

  const handleDeleteRoom = async () => {
    console.log('handleDeleteRoom called, showDeleteModal:', showDeleteModal);
    
    if (!showDeleteModal) {
      console.log('No room to delete, showDeleteModal is null');
      return;
    }

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${showDeleteModal.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRooms((prev) => prev.filter((room) => room.id !== showDeleteModal.id));
        
        // Clear selected room if it's the one being deleted
        if (selectedRoom?.id === showDeleteModal.id) {
          setSelectedRoom(null);
        }
        
        setShowDeleteModal(null);
        showToast({
          type: "success",
          title: "Room Deleted",
          message: "Room deleted successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Delete Failed",
          message: errorData.error || "Failed to delete room",
        });
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "public":
        return <Hash className="w-4 h-4" />;
      case "private":
        return <MessageSquare className="w-4 h-4" />;
      case "club":
        return <Users className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "public":
        return "text-emerald-500 dark:text-emerald-400";
      case "private":
        return "text-zenith-primary dark:text-blue-400";
      case "club":
        return "text-purple-500 dark:text-purple-400";
      default:
        return "text-zenith-secondary";
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // The auth modal will be shown by useAuthGuard
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zenith-primary mb-2">
            Chat Rooms
          </h1>
          <p className="text-zenith-secondary">
            Connect with your peers and club members in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[calc(100vh-8rem)] overflow-hidden">
          {/* Sidebar - Room List */}
          <div className="lg:col-span-1 max-h-full overflow-hidden">
            <div className="bg-zenith-card rounded-xl shadow-lg h-full flex flex-col">
              {/* Search and Header */}
              <div className="p-4 border-b border-zenith-border flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zenith-primary">
                    Rooms
                  </h2>
                  {isManager && (
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="p-2 text-zenith-muted hover:text-zenith-accent transition-colors rounded-lg hover:bg-zenith-hover"
                      title="Create new room"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-zenith-border rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-main text-zenith-primary placeholder-zenith-muted"
                />
              </div>

              {/* Room List */}
              <div 
                className="flex-1 overflow-y-auto max-h-[calc(100vh-15rem)] scrollbar-thin scrollbar-thumb-zenith-border scrollbar-track-transparent scroll-smooth" 
                style={{
                  scrollbarWidth: 'thin',
                  scrollBehavior: 'smooth'
                }}
              >
                {filteredRooms.length === 0 ? (
                  <div className="p-6 text-center text-zenith-secondary">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No chat rooms available</p>
                  </div>
                ) : (
                  <div className="pb-2">
                    {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`relative border-b border-zenith-border hover:bg-zenith-hover transition-colors ${
                        selectedRoom?.id === room.id
                          ? "bg-zenith-brand/10 border-l-4 border-l-zenith-brand"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="w-full p-4 text-left flex items-start space-x-3"
                      >
                        <div className={`mt-1 ${getRoomTypeColor(room.type)}`}>
                          {getRoomIcon(room.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-zenith-primary truncate">
                            {room.name}
                          </h3>
                          <p className="text-sm text-zenith-secondary truncate">
                            {room.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {room.club_name && (
                              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 px-2 py-1 rounded-full">
                                {room.club_name}
                              </span>
                            )}
                            <span className="text-xs text-zenith-secondary">
                              {room.members_count} members
                            </span>
                          </div>
                        </div>
                      </button>
                      
                      {/* Three dots menu for managers */}
                      {isManager && room.created_by === user?.id && (
                        <div className="absolute top-2 right-2 room-menu-container">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Menu button clicked for room:', room.id);
                              setShowRoomMenu(showRoomMenu === room.id ? null : room.id);
                            }}
                            className="p-2 text-zenith-muted hover:text-zenith-secondary dark:hover:text-gray-300 rounded-full hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors room-menu-button"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown menu */}
                          {showRoomMenu === room.id && (
                            <div className="absolute right-0 top-10 bg-zenith-card dark:bg-gray-800 rounded-lg shadow-lg border border-zenith-border py-1 z-10 min-w-[120px] room-menu-dropdown">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Rename clicked for room:', room);
                                  setShowRenameModal(room);
                                  setRenameValue(room.name);
                                  setShowRoomMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 flex items-center space-x-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Delete clicked for room:', room);
                                  setShowDeleteModal(room);
                                  setShowRoomMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-sm border border-zenith-border h-full">
                <EnhancedChatRoom
                  roomId={selectedRoom.id}
                  currentUser={{
                    id: user?.id || '1',
                    name: user?.name || 'Unknown User',
                    email: user?.email || 'unknown@example.com'
                  }}
                  isPrivate={selectedRoom.type === 'private'}
                  onInviteUser={selectedRoom.type === 'private' ? () => setShowInviteModal(true) : undefined}
                />
              </div>
            ) : (
              <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-sm border border-zenith-border h-full flex items-center justify-center">
                <div className="text-center text-zenith-secondary">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    Select a Chat Room
                  </h3>
                  <p>Choose a room from the sidebar to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-zenith-primary">
                Create New Chat Room
              </h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Room name"
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />

              <textarea
                placeholder="Room description (optional)"
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
              />

              <select
                value={newRoom.type}
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    type: e.target.value as "public" | "private" | "club",
                  })
                }
                className="w-full px-3 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="club">Club Room</option>
                <option value="public">Public Room</option>
                <option value="private">Private Room</option>
              </select>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-zenith-secondary rounded-lg hover:bg-gray-400 transition-colors dark:bg-zenith-secondary dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Room Modal */}
      {showRenameModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Only close if clicking the backdrop
            if (e.target === e.currentTarget) {
              console.log('Closing rename modal by backdrop click');
              setShowRenameModal(null);
              setRenameValue("");
            }
          }}
        >
          <div 
            className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-zenith-primary">
                Rename Room
              </h3>
              <button
                onClick={() => {
                  setShowRenameModal(null);
                  setRenameValue("");
                }}
                className="text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="New room name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoFocus
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    console.log('Rename button clicked');
                    handleRenameRoom();
                  }}
                  className="flex-1 px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowRenameModal(null);
                    setRenameValue("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-zenith-secondary rounded-lg hover:bg-gray-400 transition-colors dark:bg-zenith-secondary dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Only close if clicking the backdrop
            if (e.target === e.currentTarget) {
              console.log('Closing delete modal by backdrop click');
              setShowDeleteModal(null);
            }
          }}
        >
          <div 
            className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-zenith-primary">
                Delete Room
              </h3>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-zenith-secondary dark:text-gray-300">
                Are you sure you want to delete the room "{showDeleteModal.name}"? 
                This action cannot be undone and all messages will be lost.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    console.log('Delete button clicked');
                    handleDeleteRoom();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-zenith-secondary rounded-lg hover:bg-gray-400 transition-colors dark:bg-zenith-secondary dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Invite User to {selectedRoom.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Personal Message (Optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteMessage('');
                }}
                className="flex-1 px-4 py-2 border border-zenith-border rounded-lg hover:bg-zenith-section dark:border-gray-600 dark:hover:bg-zenith-secondary/90"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!inviteEmail.trim()) return;
                  
                  try {
                    const tokenManager = TokenManager.getInstance();
                    const response = await tokenManager.authenticatedFetch('/api/chat/invite', {
                      method: 'POST',
                      body: JSON.stringify({
                        roomId: selectedRoom.id,
                        inviteeEmail: inviteEmail,
                        inviterName: user?.name || 'Unknown User',
                        message: inviteMessage
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      showToast({
                        type: 'success',
                        title: 'Invitation Sent',
                        message: 'User has been invited to the chat room'
                      });
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteMessage('');
                    } else {
                      showToast({
                        type: 'error',
                        title: 'Invitation Failed',
                        message: data.error || 'Failed to send invitation'
                      });
                    }
                  } catch (error) {
                    console.error('Error sending invitation:', error);
                    showToast({
                      type: 'error',
                      title: 'Invitation Failed',
                      message: 'An unexpected error occurred'
                    });
                  }
                }}
                disabled={!inviteEmail.trim()}
                className="flex-1 px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Mail size={16} />
                <span>Send Invite</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
