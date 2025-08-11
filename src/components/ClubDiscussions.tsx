"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Users, Hash } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import DiscussionList from "@/components/DiscussionList";
import ChatRoom from "@/components/ChatRoom";

interface ChatRoomData {
  id: string;
  name: string;
  description: string;
  type: string;
  club_id: string;
}

interface ClubDiscussionsProps {
  clubId: string;
  clubName: string;
}

export default function ClubDiscussions({
  clubId,
  clubName,
}: ClubDiscussionsProps) {
  const [activeTab, setActiveTab] = useState<"discussions" | "chat">(
    "discussions"
  );
  const [activeChatRoom, setActiveChatRoom] = useState<string>("");
  const [chatRooms, setChatRooms] = useState<ChatRoomData[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const fetchChatRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`/api/chat/rooms?club_id=${clubId}`);
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms || []);
        // Auto-select first room
        if (data.chatRooms && data.chatRooms.length > 0) {
          setActiveChatRoom(data.chatRooms[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  }, [clubId]);

  // Fetch chat rooms when chat tab is selected and component mounts
  useEffect(() => {
    if (activeTab === "chat" && chatRooms.length === 0) {
      fetchChatRooms();
    }
  }, [activeTab, chatRooms.length, fetchChatRooms]);

  return (
    <div className="min-h-screen bg-zenith-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zenith-primary">
            {clubName} Community
          </h1>
          <p className="text-lg text-zenith-muted">
            Connect, discuss, and collaborate with club members
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b mb-8 border-zenith-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("discussions")}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "discussions"
                  ? "border-zenith-primary text-zenith-primary"
                  : "border-transparent text-zenith-muted hover:text-zenith-secondary hover:border-zenith-border"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Discussions
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "chat"
                  ? "border-zenith-primary text-zenith-primary"
                  : "border-transparent text-zenith-muted hover:text-zenith-secondary hover:border-zenith-border"
              }`}
            >
              <Users className="w-4 h-4" />
              Chat Rooms
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "discussions" ? (
          <DiscussionList clubId={clubId} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            {/* Chat Room Sidebar */}
            <div className="lg:col-span-1 p-4 rounded-lg border bg-zenith-card border-zenith-border">
              <h3 className="text-lg font-semibold mb-4 text-zenith-primary">
                Chat Rooms
              </h3>
              <div className="space-y-2">
                {loadingRooms ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm mt-2 text-zenith-muted">
                      Loading rooms...
                    </p>
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-zenith-muted">
                      No chat rooms available
                    </p>
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setActiveChatRoom(room.id)}
                      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        activeChatRoom === room.id
                          ? "bg-zenith-primary text-white"
                          : "hover:bg-zenith-hover text-zenith-secondary"
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p
                          className={`text-xs ${
                            activeChatRoom === room.id
                              ? "text-blue-200"
                              : "text-zenith-muted"
                          }`}
                        >
                          {room.description ||
                            (room.type === "announcement"
                              ? "Announcements only"
                              : "Open chat")}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 rounded-lg border overflow-hidden bg-zenith-card border-zenith-border">
              {activeChatRoom ? (
                <ChatRoom roomId={activeChatRoom} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Hash className="w-12 h-12 mx-auto mb-4 text-zenith-muted" />
                    <h3 className="text-lg font-medium mb-2 text-zenith-primary">
                      Select a chat room
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Choose a room from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
