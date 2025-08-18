'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import TokenManager from '@/lib/TokenManager';

// Emoji data - simulating a proper emoji library
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌'],
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
  message_status?: 'sending' | 'sent' | 'delivered' | 'read';
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
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
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${roomId}/messages`);
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load messages'
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
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
  }, [roomId, showToast]);

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
      reply_to_message_id: replyingTo?.id,
      reply_to_message: replyingTo || undefined,
      message_status: 'sending'
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setReplyingTo(null);

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: newMessage.trim(),
          reply_to_message_id: replyingTo?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...data.message, message_status: 'sent' } : msg
        ));
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to send message'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send message'
      });
    }
  };

  // React to message
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
        ));
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
    setShowEmojiPicker(false);
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, is_deleted: true, message: 'This message was deleted' } : msg
        ));
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Message deleted'
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    setShowMessageActions(null);
  };

  // Edit message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ message: newContent })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...data.message, is_edited: true } : msg
        ));
        setEditingMessage(null);
        setEditingContent('');
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Message updated'
        });
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Check if message can be edited/deleted (within 1 hour)
  const canEditOrDelete = (message: ChatMessage) => {
    if (message.user_id !== currentUser.id) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = new Date().getTime();
    const hourInMs = 60 * 60 * 1000;
    return (now - messageTime) < hourInMs;
  };

  // Scroll to replied message
  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      try {
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          // Add message with attachment
          const tempMessage: ChatMessage = {
            id: Date.now().toString(),
            message: `📎 ${file.name}`,
            user_id: currentUser.id,
            sender_name: currentUser.name,
            room_id: roomId,
            created_at: new Date().toISOString(),
            attachments: [data.attachment]
          };
          setMessages(prev => [...prev, tempMessage]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: `Failed to upload ${file.name}`
        });
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zenith-dark">
      {/* Chat Header */}
      <div className="bg-zenith-darker border-b border-zenith-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showMobileBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            
            <div className="w-10 h-10 bg-zenith-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {roomName.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-white">{roomName}</h2>
              <p className="text-sm text-zenith-muted">
                {onlineUsers.length > 0 ? `${onlineUsers.length} online` : 'Click here for room info'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors"
            >
              <Search className="w-5 h-5 text-zenith-muted" />
            </button>
            <button className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors">
              <Phone className="w-5 h-5 text-zenith-muted" />
            </button>
            <button className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors">
              <Video className="w-5 h-5 text-zenith-muted" />
            </button>
            <button
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-zenith-muted" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zenith-muted" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zenith-dark border border-zenith-muted/20 rounded-lg text-white placeholder-zenith-muted focus:outline-none focus:border-zenith-primary transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenith-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-zenith-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-zenith-muted" />
              </div>
              <p className="text-zenith-muted">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages
            .filter(message => 
              searchTerm === '' || 
              message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
              message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((message, index) => {
              const isOwnMessage = message.user_id === currentUser.id;
              const showSender = index === 0 || messages[index - 1].user_id !== message.user_id;
              const canEditDelete = canEditOrDelete(message);

              return (
                <motion.div
                  key={message.id}
                  id={`message-${message.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {/* Sender name */}
                    {!isOwnMessage && showSender && (
                      <p className="text-xs text-zenith-muted mb-1 px-3">
                        {message.sender_name}
                      </p>
                    )}

                    {/* Reply indicator */}
                    {message.reply_to_message && (
                      <div
                        className={`mb-2 p-2 border-l-4 border-zenith-primary bg-zenith-muted/10 rounded cursor-pointer ${
                          isOwnMessage ? 'ml-4' : 'mr-4'
                        }`}
                        onClick={() => scrollToMessage(message.reply_to_message!.id)}
                      >
                        <p className="text-xs text-zenith-primary font-medium">
                          {message.reply_to_message.sender_name}
                        </p>
                        <p className="text-sm text-zenith-muted truncate">
                          {message.reply_to_message.message}
                        </p>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`relative px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-zenith-primary text-white'
                          : 'bg-zenith-muted/20 text-white'
                      } ${message.is_deleted ? 'italic opacity-60' : ''}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!message.is_deleted) {
                          setShowMessageActions(message.id);
                        }
                      }}
                    >
                      {/* Message content */}
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-white/70"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditMessage(message.id, editingContent)}
                              className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessage(null);
                                setEditingContent('');
                              }}
                              className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          
                          {/* Message status */}
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            {message.is_edited && (
                              <span className="text-xs opacity-70">edited</span>
                            )}
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {isOwnMessage && (
                              <div className="text-xs">
                                {message.message_status === 'sending' && (
                                  <Clock className="w-3 h-3 opacity-70" />
                                )}
                                {message.message_status === 'sent' && (
                                  <Check className="w-3 h-3 opacity-70" />
                                )}
                                {message.message_status === 'delivered' && (
                                  <CheckCheck className="w-3 h-3 opacity-70" />
                                )}
                                {message.message_status === 'read' && (
                                  <CheckCheck className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Message actions */}
                      <AnimatePresence>
                        {showMessageActions === message.id && !message.is_deleted && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`absolute top-0 ${
                              isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                            } bg-zenith-darker border border-zenith-muted/20 rounded-lg shadow-lg z-10`}
                          >
                            <div className="flex flex-col">
                              <button
                                onClick={() => {
                                  setReplyingTo(message);
                                  setShowMessageActions(null);
                                  messageInputRef.current?.focus();
                                }}
                                className="p-2 hover:bg-zenith-muted/20 transition-colors flex items-center space-x-2 text-sm text-white"
                              >
                                <Reply className="w-4 h-4" />
                                <span>Reply</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(message.message);
                                  setShowMessageActions(null);
                                  showToast({
                                    type: 'success',
                                    title: 'Copied',
                                    message: 'Message copied to clipboard'
                                  });
                                }}
                                className="p-2 hover:bg-zenith-muted/20 transition-colors flex items-center space-x-2 text-sm text-white"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </button>

                              {canEditDelete && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMessage(message.id);
                                      setEditingContent(message.message);
                                      setShowMessageActions(null);
                                    }}
                                    className="p-2 hover:bg-zenith-muted/20 transition-colors flex items-center space-x-2 text-sm text-white"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="p-2 hover:bg-red-500/20 transition-colors flex items-center space-x-2 text-sm text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(
                          message.reactions.reduce((acc, reaction) => {
                            if (!acc[reaction.emoji]) {
                              acc[reaction.emoji] = [];
                            }
                            acc[reaction.emoji].push(reaction);
                            return acc;
                          }, {} as Record<string, MessageReaction[]>)
                        ).map(([emoji, reactions]) => (
                          <button
                            key={emoji}
                            className="px-2 py-1 bg-zenith-muted/20 rounded-full text-xs flex items-center space-x-1 hover:bg-zenith-muted/30 transition-colors"
                            title={reactions.map(r => r.user_name).join(', ')}
                          >
                            <span>{emoji}</span>
                            <span className="text-zenith-muted">{reactions.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick react button */}
                  <button
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-zenith-muted/20 ${
                      isOwnMessage ? 'order-1 mr-2' : 'order-2 ml-2'
                    }`}
                    onClick={() => handleReactToMessage(message.id, '👍')}
                  >
                    <Smile className="w-4 h-4 text-zenith-muted" />
                  </button>
                </motion.div>
              );
            })
        )}
        
        {/* Typing indicator */}
        {typing.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-zenith-muted rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-zenith-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-zenith-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-zenith-muted">
              {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="p-3 bg-zenith-darker border-t border-zenith-muted/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-zenith-primary font-medium">
                  Replying to {replyingTo.sender_name}
                </p>
                <p className="text-sm text-zenith-muted truncate">
                  {replyingTo.message}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full hover:bg-zenith-muted/20 transition-colors"
              >
                <X className="w-4 h-4 text-zenith-muted" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="bg-zenith-darker border-t border-zenith-muted/20 p-4">
        <div className="flex items-end space-x-3">
          {/* File upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 rounded-full hover:bg-zenith-muted/20 transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5 text-zenith-muted" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-12 bg-zenith-dark border border-zenith-muted/20 rounded-full text-white placeholder-zenith-muted focus:outline-none focus:border-zenith-primary transition-colors resize-none max-h-32"
              rows={1}
            />
            
            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-zenith-muted/20 transition-colors"
            >
              <Smile className="w-5 h-5 text-zenith-muted" />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !replyingTo}
            className="p-2 bg-zenith-primary rounded-full hover:bg-zenith-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full right-4 mb-2 bg-zenith-darker border border-zenith-muted/20 rounded-lg shadow-lg p-4 w-80 z-20"
            >
              {/* Emoji categories */}
              <div className="flex space-x-2 mb-4 border-b border-zenith-muted/20 pb-2">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedEmojiCategory === category
                        ? 'bg-zenith-primary text-white'
                        : 'text-zenith-muted hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl hover:bg-zenith-muted/20 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside handler for message actions */}
      {showMessageActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMessageActions(null)}
        />
      )}
    </div>
  );
};
