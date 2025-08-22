"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Smile, Paperclip, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import UserBadge from "./UserBadge";

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  message: string;
  message_type: string;
  file_url?: string;
  created_at: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  club_id: string;
  type: string;
  created_by: string;
  members: string[];
  moderators: string[];
  settings: Record<string, unknown>;
  created_at: string;
}

interface ChatRoomProps {
  roomId: string;
}

export default function ChatRoom({ roomId }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === "dark";

  const currentUserId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/chat/messages?room_id=${roomId}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUserId) return;

    setSending(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          user_id: currentUserId,
          content: newMessage.trim(),
          message_type: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      } else {
        const error = await response.json();
        console.error("Error sending message:", error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-zenith-section"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-zenith-muted" : "text-zenith-secondary"}>
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  let lastMessageDate = "";

  return (
    <div
      className={`flex flex-col h-full ${
        isDarkMode ? "bg-gray-900" : "bg-zenith-section"
      }`}
    >
      {/* Chat Header */}
      <div
        className={`p-4 border-b ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-card border-custom"
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isDarkMode ? "text-primary" : "text-primary"
          }`}
        >
          Chat Room
        </h2>
        <p
          className={`text-sm ${
            isDarkMode ? "text-zenith-muted" : "text-zenith-secondary"
          }`}
        >
          {messages.length} messages
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const messageDate = formatDate(message.created_at);
          const showDateSeparator = messageDate !== lastMessageDate;
          lastMessageDate = messageDate;

          return (
            <div key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-zenith-section text-zenith-secondary"
                    }`}
                  >
                    {messageDate}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="flex gap-3 group">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-gray-700" : "bg-zenith-section"
                  }`}
                >
                  {message.author_avatar ? (
                    <Image
                      src={message.author_avatar}
                      alt={message.author_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author Info */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-medium text-sm ${
                        isDarkMode ? "text-primary" : "text-primary"
                      }`}
                    >
                      {message.author_name}
                    </span>
                    <UserBadge
                      userId={message.user_id}
                      role={message.author_role}
                      className="text-xs"
                    />
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-zenith-muted" : "text-zenith-muted"
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </span>
                  </div>

                  {/* Reply Context - Removed for Supabase compatibility */}

                  {/* Message Content */}
                  <div
                    className={`p-3 rounded-lg ${
                      message.user_id === currentUserId
                        ? "bg-zenith-primary text-primary ml-auto max-w-sm"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-100"
                        : "bg-card text-primary border border-custom"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>

                  {/* Message Actions - Removed for Supabase compatibility */}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDarkMode ? "bg-gray-800" : "bg-zenith-section"
              }`}
            >
              <Send className="w-8 h-8 text-zenith-muted" />
            </div>
            <p
              className={`text-lg font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-zenith-secondary"
              }`}
            >
              No messages yet
            </p>
            <p className={isDarkMode ? "text-zenith-muted" : "text-zenith-muted"}>
              Be the first to send a message!
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview - Removed for Supabase compatibility */}

      {/* Message Input */}
      <div
        className={`p-4 border-t ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-card border-custom"
        }`}
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={`w-full px-4 py-2 pr-12 border rounded-lg resize-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-primary placeholder-gray-400"
                  : "bg-card border-custom text-primary placeholder-gray-500"
              }`}
              style={{ maxHeight: "120px" }}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                className={`p-1 rounded hover:bg-opacity-20 hover:bg-zenith-section0 ${
                  isDarkMode
                    ? "text-zenith-muted hover:text-gray-300"
                    : "text-zenith-secondary hover:text-zenith-secondary"
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                className={`p-1 rounded hover:bg-opacity-20 hover:bg-zenith-section0 ${
                  isDarkMode
                    ? "text-zenith-muted hover:text-gray-300"
                    : "text-zenith-secondary hover:text-zenith-secondary"
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-zenith-primary hover:bg-zenith-primary/90 disabled:bg-blue-400 text-primary rounded-lg font-medium transition-colors"
          >
            {sending ? "..." : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
