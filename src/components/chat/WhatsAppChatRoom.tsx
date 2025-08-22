'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Reply, 
  Edit, 
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
  Search
} from 'lucide-react';

// Emoji data - in a real app, you'd import from a proper emoji library
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏',
  '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌'
];

interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  sender_name?: string;
  room_id: string;
  created_at: string;
  reply_to_message_id?: string;
  is_edited?: boolean;
  attachments?: {
    id: string;
    filename: string;
    type: 'image' | 'document';
    size: number;
    url: string;
  }[];
  message_type?: 'text' | 'image' | 'file';
  file_url?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs
  read_by?: string[]; // array of user IDs who have read this message
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface WhatsAppChatRoomProps {
  roomId: string;
  roomName: string;
  currentUser: User;
  isPrivate?: boolean;
  onInviteUser?: () => void;
}

export const WhatsAppChatRoom: React.FC<WhatsAppChatRoomProps> = ({
  roomId,
  roomName,
  currentUser,
  isPrivate = false,
  onInviteUser
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // Only scroll to bottom on initial load, not on updates
        if (messages.length === 0) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, scrollToBottom]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() && !replyingTo) return;

    try {
      const token = localStorage.getItem('zenith-token');
      const messageData = {
        message: newMessage.trim(),
        message_type: 'text',
        reply_to_message_id: replyingTo?.id || null,
      };

      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage('');
        setReplyingTo(null);
        fetchMessages();
        // Only scroll to bottom after sending a message
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, replyingTo, roomId, fetchMessages, scrollToBottom]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_type', file.type.startsWith('image/') ? 'image' : 'file');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message_type', file.type.startsWith('image/') ? 'image' : 'file');

      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/chat/rooms/${roomId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        fetchMessages();
        // Only scroll to bottom after file upload
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [roomId, fetchMessages, scrollToBottom]);

  // Handle emoji click
  const handleEmojiClick = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  }, []);

  // Handle message reaction
  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });
      
      fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [fetchMessages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    const token = localStorage.getItem('zenith-token');
    fetch(`/api/chat/rooms/${roomId}/typing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).catch(console.error);

    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
      fetch(`/api/chat/rooms/${roomId}/typing`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(console.error);
    }, 3000);
  }, [roomId]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [fetchMessages]);

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get message status icon
  const getMessageStatus = (message: ChatMessage) => {
    if (message.user_id !== currentUser.id) return null;
    
    const isRead = message.read_by && message.read_by.length > 1; // More than just sender
    
    if (isRead) {
      return <CheckCheck className="w-4 h-4 text-primary" />;
    } else {
      return <Check className="w-4 h-4 text-zenith-muted" />;
    }
  };

  // Effects
  useEffect(() => {
    fetchMessages();
    
    // Set up periodic updates (less frequent to avoid constant scrolling)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Filter messages based on search
  const filteredMessages = searchTerm 
    ? messages.filter(msg => 
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zenith-section dark:bg-gray-900">
      {/* Header */}
      <div className="bg-green-600 dark:bg-green-700 text-primary p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-primary font-bold text-sm">
            {roomName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{roomName}</h3>
            <p className="text-xs text-green-100">
              {onlineUsers.length > 0 ? `${onlineUsers.length} online` : 'Click to see info'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-green-500 rounded-full transition-colors"
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>
          <button 
            className="p-2 hover:bg-green-500 rounded-full transition-colors"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            className="p-2 hover:bg-green-500 rounded-full transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button 
            className="p-2 hover:bg-green-500 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 bg-card border-b shadow-sm">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-custom dark:border-gray-600 rounded-lg bg-card dark:bg-gray-700 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#f0f2f5'
        }}
      >
        {filteredMessages.map((message, index) => {
          const isOwnMessage = message.user_id === currentUser.id;
          const showAvatar = !isOwnMessage && (
            index === 0 || 
            filteredMessages[index - 1].user_id !== message.user_id
          );
          
          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}
            >
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {/* Avatar for other users */}
                {showAvatar && !isOwnMessage && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold mb-1 text-zenith-secondary">
                    {message.sender_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* Reply Reference */}
                {message.reply_to_message_id && (
                  <div className="text-xs text-zenith-muted mb-1 pl-2 border-l-2 border-custom bg-zenith-section rounded p-1">
                    Replying to previous message
                  </div>
                )}
                
                {/* Message Bubble */}
                <div 
                  className={`relative px-3 py-2 rounded-lg shadow-sm max-w-full ${
                    isOwnMessage 
                      ? 'bg-green-500 text-primary rounded-br-sm' 
                      : 'bg-card dark:bg-gray-700 text-primary rounded-bl-sm'
                  }`}
                >
                  {/* Sender Name */}
                  {!isOwnMessage && showAvatar && (
                    <div className="text-xs font-semibold text-green-600 mb-1">
                      {message.sender_name || 'Unknown User'}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  {message.message_type === 'image' && message.file_url ? (
                    <div>
                      <img 
                        src={message.file_url} 
                        alt="Shared image" 
                        className="max-w-full h-auto rounded mb-1 max-h-60 object-cover"
                      />
                      {message.message && (
                        <p className="text-sm">{message.message}</p>
                      )}
                    </div>
                  ) : message.message_type === 'file' && message.file_url ? (
                    <div className="flex items-center space-x-2 bg-zenith-section dark:bg-zenith-secondary rounded p-2">
                      <File className="w-4 h-4" />
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:no-underline text-sm truncate"
                      >
                        {message.message || 'Download file'}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                  )}
                  
                  {/* Message Footer */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
                      {/* Reactions */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="flex space-x-1">
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className="text-xs bg-zenith-section dark:bg-zenith-secondary rounded-full px-2 py-1 hover:bg-zenith-section dark:hover:bg-zenith-section0"
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs ${isOwnMessage ? 'text-green-100' : 'text-zenith-muted'}`}>
                        {formatTime(message.created_at)}
                      </span>
                      {getMessageStatus(message)}
                      {message.is_edited && (
                        <span className={`text-xs ${isOwnMessage ? 'text-green-200' : 'text-zenith-muted'}`}>
                          edited
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Message Actions */}
                  {isOwnMessage && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="p-1 hover:bg-green-400 rounded"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="p-1 hover:bg-green-400 rounded ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {typing.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-300 dark:bg-zenith-secondary rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zenith-section0 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zenith-section0 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-zenith-section0 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Replying to {replyingTo.sender_name || 'Unknown User'}
            </p>
            <p className="text-sm text-green-600 dark:text-green-300 truncate">
              {replyingTo.message}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 bg-card border border-custom dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-xs">
          <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto">
            {EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-card border-t border-custom dark:border-gray-600 p-3">
        <div className="flex items-end space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200 rounded-full hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zenith-muted hover:text-zenith-secondary dark:text-zenith-muted dark:hover:text-gray-200 rounded-full hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-custom dark:border-gray-600 rounded-lg px-3 py-2 bg-card dark:bg-gray-700 text-primary focus:outline-none focus:ring-2 focus:ring-green-500 max-h-20 min-h-[40px]"
            rows={1}
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-primary rounded-full transition-colors flex-shrink-0"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};
