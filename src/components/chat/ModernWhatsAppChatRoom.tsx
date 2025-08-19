'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessageLoader } from './ChatMessageLoader';
import { 
  Send, 
  Reply, 
  Edit3, 
  Trash2, 
  Image, 
  File, 
  Paperclip, 
  ArrowUp, 
  X, 
  Smile,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Info,
  Star,
  Copy,
  Forward,
  Clock,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  MessageSquare,
  Users,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import TokenManager from '@/lib/TokenManager';

// Emoji data - simulating a proper emoji library
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '��', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌'],
  'Objects': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳']
};

interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  sender_name?: string;
  room_id: string;
  created_at: string;
  updated_at?: string;
  reply_to_message_id?: string;
  reply_to_message?: ChatMessage;
  is_edited?: boolean;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  is_deleted?: boolean;
  message_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

interface MessageAttachment {
  id: string;
  filename: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
  url: string;
  thumbnail_url?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface WhatsAppChatRoomProps {
  roomId: string;
  roomName: string;
  currentUser: User;
  isPrivate?: boolean;
  onInviteUser?: () => void;
  onBack?: () => void;
  showMobileBack?: boolean;
}

export const WhatsAppChatRoom: React.FC<WhatsAppChatRoomProps> = ({
  roomId,
  roomName,
  currentUser,
  isPrivate = false,
  onInviteUser,
  onBack,
  showMobileBack = false
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Faces');
  const [typing, setTyping] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom - only when sending a new message, not when loading
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Track if we're sending a new message vs loading existing ones
  const isNewMessageRef = useRef(false);
  
  useEffect(() => {
    // Only auto-scroll if it's a new message being sent
    if (isNewMessageRef.current) {
      scrollToBottom();
      isNewMessageRef.current = false;
    }
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = messageInputRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        setError(null);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${roomId}/messages`);
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load messages');
          showToast({
            type: 'error',
            title: 'Error',
            message: errorData.error || 'Failed to load messages'
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Network error. Please check your connection.');
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load messages'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, showToast, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return;

    const tempId = Date.now().toString();
    const tempMessage: ChatMessage = {
      id: tempId,
      message: newMessage.trim(),
      user_id: currentUser.id,
      sender_name: currentUser.name,
      room_id: roomId,
      created_at: new Date().toISOString(),
      is_edited: false,
      reply_to_message_id: replyingTo ? replyingTo.id : undefined,
      message_status: 'sending'
    };

    // Set flag to trigger scroll on this new message
    isNewMessageRef.current = true;
    
    // Optimistically update UI
    setMessages(prev => [tempMessage, ...prev]);
    setNewMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: tempMessage.message,
          reply_to_message_id: tempMessage.reply_to_message_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update the temp message with the real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...msg, 
              id: data.id,
              message_status: 'sent',
              created_at: data.created_at || msg.created_at
            } : msg
          )
        );
      } else {
        // Show error and mark message as failed
        const errorData = await response.json();
        showToast({
          type: 'error',
          title: 'Failed to send',
          message: errorData.error || 'Message could not be sent'
        });
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...msg, message_status: 'error' } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Please check your connection'
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, message_status: 'error' } : msg
        )
      );
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message groups
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date
  const messagesByDate = messages.reduce<Record<string, ChatMessage[]>>((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement file upload functionality
    if (e.target.files && e.target.files.length > 0) {
      // File upload logic would go here
      showToast({
        type: 'info',
        title: 'Coming Soon',
        message: 'File attachments will be available soon!'
      });
    }
  };

  // Create message status icon
  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      {/* Chat Header */}
      <div className="flex items-center p-3 bg-college-medium border-b border-gray-700 shadow-md">
        {showMobileBack && (
          <button 
            onClick={onBack}
            className="p-2 mr-2 rounded-full hover:bg-gray-700 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex-1 flex items-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">
              {roomName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 overflow-hidden">
            <h2 className="text-white font-medium truncate">{roomName}</h2>
            {typing.length > 0 ? (
              <p className="text-xs text-green-400">
                {typing.length === 1 
                  ? `${typing[0]} is typing...` 
                  : `${typing.length} people are typing...`}
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                {onlineUsers.length} online
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="text-gray-300 hover:text-white hidden md:block"
            onClick={() => showToast({
              type: 'info',
              title: 'Coming Soon',
              message: 'Video calling will be available soon!'
            })}
          >
            <Video className="w-5 h-5" />
          </button>
          <button 
            className="text-gray-300 hover:text-white hidden md:block"
            onClick={() => showToast({
              type: 'info',
              title: 'Coming Soon',
              message: 'Voice calling will be available soon!'
            })}
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            className="text-gray-300 hover:text-white"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            className="text-gray-300 hover:text-white"
            onClick={() => setShowRoomInfo(!showRoomInfo)}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Search Bar - Appears when search is toggled */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 overflow-hidden bg-gray-800"
          >
            <div className="p-2 flex items-center">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Search in conversation..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-college-primary"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <button 
                onClick={() => setShowSearch(false)}
                className="ml-2 p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-[#0a1622] bg-opacity-95 p-4 scrollbar-thin scrollbar-thumb-gray-600">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <ChatMessageLoader message="Loading messages..." />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Something went wrong</h3>
            <p className="text-gray-400 mb-6 text-center max-w-md">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-college-primary text-white rounded-md hover:bg-college-primary/80 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gray-800 p-6 rounded-lg text-center max-w-md">
              <div className="bg-gradient-to-br from-college-primary to-college-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No messages yet</h3>
              <p className="text-gray-400 mb-4">Be the first to send a message in this room!</p>
              <button 
                onClick={() => messageInputRef.current?.focus()}
                className="px-4 py-2 bg-college-primary text-white rounded-md hover:bg-college-primary/80 transition-colors"
              >
                Start Conversation
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse">
            {/* Space for scrolling */}
            <div className="h-4" ref={messagesEndRef}></div>
            
            {/* Render messages by date */}
            {Object.entries(messagesByDate).map(([date, msgs]) => (
              <div key={date} className="mb-6">
                {/* Date separator */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                    {formatDate(msgs[0].created_at)}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-2">
                  {msgs.map((message, idx) => {
                    const isMe = message.user_id === currentUser.id;
                    const showSender = !isMe && (!msgs[idx - 1] || msgs[idx - 1].user_id !== message.user_id);
                    
                    return (
                      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`relative max-w-[80%] ${isMe ? 'order-1' : 'order-2'}`}
                          onMouseEnter={() => setShowMessageActions(message.id)}
                          onMouseLeave={() => setShowMessageActions(null)}
                        >
                          {/* Sender name for others' messages */}
                          {showSender && !isMe && (
                            <div className="text-xs text-blue-400 ml-2 mb-1">
                              {message.sender_name || 'Unknown User'}
                            </div>
                          )}
                          
                          {/* Reply preview if this is a reply */}
                          {message.reply_to_message_id && (
                            <div 
                              className={`rounded-t-lg px-3 py-1 text-xs cursor-pointer hover:opacity-80 ${
                                isMe 
                                  ? 'bg-college-primary text-blue-100 mr-2' 
                                  : 'bg-gray-700 text-gray-300 ml-2'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the original message element by ID
                                const originalMsgEl = document.getElementById(`msg-${message.reply_to_message_id}`);
                                if (originalMsgEl) {
                                  // Scroll to the original message
                                  originalMsgEl.scrollIntoView({ behavior: 'smooth' });
                                  
                                  // Flash highlight animation
                                  originalMsgEl.classList.add('bg-college-primary', 'bg-opacity-20');
                                  setTimeout(() => {
                                    originalMsgEl.classList.remove('bg-college-primary', 'bg-opacity-20');
                                  }, 2000);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <Reply className="w-3 h-3 mr-1" />
                                <span className="font-medium truncate">
                                  {message.reply_to_message?.sender_name || 'Unknown'}
                                </span>
                              </div>
                              <div className="truncate">
                                {message.reply_to_message?.message || 'Original message not available'}
                              </div>
                            </div>
                          )}
                          
                          {/* Message content */}
                          <div 
                            id={`msg-${message.id}`} 
                            className={`px-4 py-2 rounded-2xl transition-colors duration-500 ${
                              message.reply_to_message_id 
                                ? (isMe ? 'bg-college-primary text-white rounded-tr-none' : 'bg-gray-800 text-white rounded-tl-none') 
                                : (isMe ? 'bg-college-primary text-white' : 'bg-gray-800 text-white')
                            } ${isMe ? 'mr-2' : 'ml-2'}`}>
                            {message.is_deleted ? (
                              <span className="italic text-gray-400">
                                This message was deleted
                              </span>
                            ) : (
                              <>
                                <div className="whitespace-pre-wrap break-words">
                                  {message.message}
                                </div>
                                <div className="flex items-center justify-end space-x-1 mt-1">
                                  <span className="text-xs text-opacity-75 text-white">
                                    {formatTime(message.created_at)}
                                  </span>
                                  {isMe && getMessageStatusIcon(message.message_status)}
                                  {message.is_edited && (
                                    <span className="text-xs text-opacity-60 text-white">
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Message actions */}
                          {showMessageActions === message.id && !message.is_deleted && (
                            <div className={`absolute top-0 ${isMe ? 'left-0 transform -translate-x-full -translate-y-1/2' : 'right-0 transform translate-x-full -translate-y-1/2'}`}>
                              <div className="bg-gray-700 rounded-full p-1 flex space-x-1 shadow-lg">
                                <button className="p-1 hover:bg-gray-600 rounded-full" onClick={() => setReplyingTo(message)}>
                                  <Reply className="w-4 h-4 text-blue-400" />
                                </button>
                                {isMe && (
                                  <>
                                    <button 
                                      className="p-1 hover:bg-gray-600 rounded-full"
                                      onClick={() => {
                                        setEditingMessage(message.id);
                                        setEditingContent(message.message);
                                      }}
                                    >
                                      <Edit3 className="w-4 h-4 text-yellow-400" />
                                    </button>
                                    <button 
                                      className="p-1 hover:bg-gray-600 rounded-full"
                                      onClick={() => {
                                        showToast({
                                          type: 'info',
                                          title: 'Coming Soon',
                                          message: 'Message deletion will be available soon!'
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="p-1 hover:bg-gray-600 rounded-full"
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.message);
                                    showToast({
                                      type: 'success',
                                      title: 'Copied',
                                      message: 'Message copied to clipboard'
                                    });
                                  }}
                                >
                                  <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 border-t border-gray-700 px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-college-primary font-medium flex items-center">
                  <Reply className="w-4 h-4 mr-1" />
                  Replying to {replyingTo.sender_name || 'Unknown'}
                </div>
                <p className="text-gray-300 text-sm truncate">{replyingTo.message}</p>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-300"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-700 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <button 
                className="text-gray-400 hover:text-gray-200"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                className="text-gray-400 hover:text-gray-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                multiple
              />
            </div>
            
            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  ref={emojiPickerRef}
                  className="absolute bottom-24 left-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3 z-10"
                >
                  <div className="flex space-x-2 mb-2">
                    {Object.keys(EMOJI_CATEGORIES).map(category => (
                      <button 
                        key={category} 
                        onClick={() => setSelectedEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                        className={`p-1 rounded-md ${
                          selectedEmojiCategory === category ? 'bg-gray-700' : 'hover:bg-gray-700'
                        }`}
                      >
                        {category === 'Faces' ? '😊' : 
                         category === 'Gestures' ? '👍' : 
                         category === 'Hearts' ? '❤️' : '⚽'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                    {EMOJI_CATEGORIES[selectedEmojiCategory].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-xl hover:bg-gray-700 p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="w-full bg-transparent text-white placeholder:text-gray-400 focus:outline-none mt-2 max-h-32 resize-none"
              rows={1}
            />
          </div>
          <button 
            className={`p-3 rounded-full flex-shrink-0 ${
              newMessage.trim() 
                ? 'bg-college-primary text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Room Info Sidebar */}
      <AnimatePresence>
        {showRoomInfo && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-20 shadow-xl"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Room Info</h3>
                <button
                  onClick={() => setShowRoomInfo(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col items-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full w-24 h-24 flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-4xl">
                    {roomName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-medium text-white">{roomName}</h3>
                <p className="text-gray-400 text-sm text-center mt-1">Created on {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Room Members</h4>
                  <div className="bg-gray-800 rounded-lg p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                    <p className="text-gray-400 text-center py-2">
                      Member list will be available soon
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Room Settings</h4>
                  <div className="space-y-2">
                    <button className="w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left flex items-center justify-between text-white">
                      <span>Mute Notifications</span>
                      <Bell className="w-5 h-5" />
                    </button>
                    <button 
                      className="w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left flex items-center justify-between text-white"
                      onClick={onInviteUser}
                    >
                      <span>Invite Users</span>
                      <Users className="w-5 h-5" />
                    </button>
                    <button className="w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left flex items-center justify-between text-white">
                      <span>Search in Chat</span>
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
