"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Reply, CheckCheck, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Message {
  id: string;
  message: string;
  user_id: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  created_at: string;
  message_type: "text" | "image" | "file";
}

interface WhatsAppChatProps {
  roomId: string;
  roomName: string;
  clubId?: string;
}

export default function WhatsAppChat({
  roomId,
  roomName,
}: Omit<WhatsAppChatProps, "clubId">) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/chat/messages?room_id=${roomId}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        showToast({
          type: "error",
          title: "Load Failed",
          message: "Failed to load messages",
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      showToast({
        type: "error",
        title: "Load Failed",
        message: "Failed to load messages",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast({
        type: "error",
        title: "Authentication Required",
        message: "Please log in to send messages",
      });
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        setReplyTo(null);
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Send Failed",
          message: errorData.error || "Failed to send message",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast({
        type: "error",
        title: "Send Failed",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      coordinator: "bg-purple-500",
      co_coordinator: "bg-zenith-primary",
      secretary: "bg-green-500",
      media: "bg-pink-500",
      president: "bg-red-500",
      vice_president: "bg-orange-500",
      innovation_head: "bg-indigo-500",
      treasurer: "bg-yellow-500",
      outreach: "bg-teal-500",
    };
    return roleColors[role] || "bg-zenith-section0";
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as React.FormEvent);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zenith-section dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-zenith-card dark:bg-gray-800 border-b border-zenith-border dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zenith-primary dark:text-white">
              {roomName}
            </h2>
            <p className="text-sm text-zenith-muted dark:text-zenith-muted">
              {messages.length} messages
            </p>
          </div>
          <button className="text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container with WhatsApp-like styling */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-zenith-muted dark:text-zenith-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.user_id === user?.id;
            const showAvatar =
              index === 0 ||
              messages[index - 1].user_id !== message.user_id;

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex ${
                  isOwn ? "justify-end" : "justify-start"
                } group mb-1`}
              >
                <div
                  className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
                    isOwn ? "flex-row-reverse" : "flex-row"
                  } items-end space-x-2`}
                >
                  {/* Avatar for others' messages */}
                  {!isOwn && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                        showAvatar ? "visible" : "invisible"
                      } ${getRoleBadgeColor(message.author_role)}`}
                    >
                      {message.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Container */}
                  <div className="flex flex-col">
                    {/* Reply Preview - Removed for Supabase compatibility */}

                    {/* Main Message Bubble - WhatsApp style */}
                    <div
                      className={`px-3 py-2 rounded-2xl relative shadow-md ${
                        isOwn
                          ? "bg-green-500 text-white rounded-br-md" // WhatsApp green for own messages
                          : "bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white rounded-bl-md"
                      }`}
                    >
                      {/* Message tail */}
                      {isOwn ? (
                        <div className="absolute -right-2 bottom-0 w-0 h-0 border-l-8 border-l-green-500 border-b-8 border-b-transparent"></div>
                      ) : (
                        <div className="absolute -left-2 bottom-0 w-0 h-0 border-r-8 border-r-white dark:border-r-gray-700 border-b-8 border-b-transparent"></div>
                      )}

                      {/* Author Name (for others' messages) */}
                      {!isOwn && showAvatar && (
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-xs font-semibold text-zenith-primary dark:text-blue-400">
                            {message.author_name}
                          </p>
                          {message.author_role &&
                            message.author_role !== "member" && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {formatRole(message.author_role)}
                              </span>
                            )}
                        </div>
                      )}

                      {/* Message Content */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.message}
                      </p>

                      {/* Timestamp and Status */}
                      <div
                        className={`flex items-center justify-end mt-1`}
                      >
                        <span className="text-xs opacity-70 mr-2">
                          {formatTimestamp(message.created_at)}
                        </span>
                        {message.user_id === user?.id && (
                          <CheckCheck className="w-4 h-4 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply Button */}
                  <button
                    onClick={() => handleReply(message)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 bg-zenith-card dark:bg-gray-700 rounded-full shadow-md"
                    title="Reply to this message"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyTo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700 px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Reply className="w-4 h-4 text-zenith-primary dark:text-blue-400" />
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Replying to {replyTo.author_name}
                </p>
              </div>
              <p className="text-sm text-zenith-primary dark:text-blue-300 truncate pl-6">
                {replyTo.message}
              </p>
            </div>
            <button
              onClick={cancelReply}
              className="p-1 rounded-full hover:bg-zenith-hover dark:hover:bg-zenith-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input - WhatsApp style */}
      <div className="bg-zenith-section dark:bg-gray-800 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 bg-zenith-card dark:bg-gray-700 rounded-3xl border border-zenith-border dark:border-gray-600 px-4 py-2">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none bg-transparent focus:outline-none dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: "24px", maxHeight: "120px" }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newMessage.trim()}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Custom styles for message highlighting */}
      <style jsx>{`
        .highlight-message {
          background-color: rgba(59, 130, 246, 0.2) !important;
          transform: scale(1.02);
          transition: all 0.3s ease;
          border-radius: 12px;
          padding: 4px;
        }
      `}</style>
    </div>
  );
}
