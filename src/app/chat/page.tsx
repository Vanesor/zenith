"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Users, Hash, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import WhatsAppChat from "@/components/WhatsAppChat";
import ZenChatbot from "@/components/ZenChatbot";
import TokenManager from "@/lib/TokenManager";

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
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
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
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchChatRooms = async () => {
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
  }, [user, showToast]);

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      showToast({
        type: "error",
        title: "Invalid Input",
        message: "Room name is required",
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
        return "text-green-600 dark:text-green-400";
      case "private":
        return "text-blue-600 dark:text-blue-400";
      case "club":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chat Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with your peers and club members in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar - Room List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
              {/* Search and Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rooms
                  </h2>
                  {isManager && (
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Room List */}
              <div className="flex-1 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No chat rooms available</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                        selectedRoom?.id === room.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 ${getRoomTypeColor(room.type)}`}>
                          {getRoomIcon(room.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {room.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {room.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {room.club_name && (
                              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 px-2 py-1 rounded-full">
                                {room.club_name}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {room.members_count} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                <WhatsAppChat
                  roomId={selectedRoom.id}
                  roomName={selectedRoom.name}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Chat Room
              </h3>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />

              <textarea
                placeholder="Room description (optional)"
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="club">Club Room</option>
                <option value="public">Public Room</option>
                <option value="private">Private Room</option>
              </select>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ZenChatbot />
    </div>
  );
}
