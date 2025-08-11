'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Reply, Edit, Trash2, Image, File, Paperclip, X, Smile, MoreVertical, User } from 'lucide-react';
import { ZenithChatEncryption, SimpleEncryption } from '@/lib/encryption';
import UserAvatar from '@/components/UserAvatar';
import './chat-styles.css';

// Emoji data
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🎉', '🎊', '🎈', '🎁', '🎂', '🎆', '🎇', '✨', '🎊', '🔥'
];

// Time formatting utility
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Get date separator
const getDateSeparator = (currentDate: string, previousDate?: string) => {
  const current = new Date(currentDate).toDateString();
  const previous = previousDate ? new Date(previousDate).toDateString() : null;
  
  if (current !== previous) {
    const date = new Date(currentDate);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (current === today) return 'Today';
    if (current === yesterday) return 'Yesterday';
    return date.toLocaleDateString();
  }
  return null;
};

// Check if message is within edit/delete window (1 hour)
const isWithinEditWindow = (timestamp: string): boolean => {
  const messageDate = new Date(timestamp).getTime();
  const now = new Date().getTime();
  // 1 hour in milliseconds = 3600000
  return (now - messageDate) <= 3600000;
};

interface ChatMessage {
  id: string;
  message: string;
  content?: string;
  user_id: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string; // Add avatar field
  room_id: string;
  created_at: string;
  timestamp?: string;
  reply_to?: string;
  reply_to_message_id?: string;
  reply_message?: string;
  reply_sender?: string;
  attachments?: {
    id: string;
    filename: string;
    type: 'image' | 'document';
    size: number;
    url: string;
  }[];
  is_encrypted?: boolean;
  is_edited?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface EnhancedChatRoomProps {
  roomId: string;
  currentUser: User;
  isPrivate?: boolean;
  onInviteUser?: () => void;
  isCoordinator?: boolean; // Added coordinator role flag
}

export const EnhancedChatRoom: React.FC<EnhancedChatRoomProps> = ({
  roomId,
  currentUser,
  isPrivate = false,
  onInviteUser,
  isCoordinator = false
}) => {
  // Add state to show scroll to bottom button
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errorModal, setErrorModal] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{show: boolean, messageId: string | null}>({show: false, messageId: null});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Show error modal instead of alert
  const showError = (message: string) => {
    setErrorModal({show: true, message});
  };

  // Simple scroll to bottom function - only when explicitly called
  const scrollToBottom = useCallback((forceScroll = false) => {
    if (messagesEndRef.current && forceScroll) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'auto',
        block: 'end' 
      });
    }
  }, []);
  
  // Determine user role for color coding
  const getUserRole = (userId: string): 'self' | 'management' | 'zenith' | 'student' => {
    // Check if it's the current user
    if (userId === currentUser.id) return 'self';
    
    // This would normally come from user metadata, club data, etc.
    // For demonstration, we're using simple checks
    
    // Management team (club coordinators, etc.)
    const managementIds = ['club_coordinator', 'club_secretary', 'club_media']; 
    if (managementIds.includes(userId)) return 'management';
    
    // Zenith team members
    const zenithIds = ['zenith_admin', 'zenith_core']; 
    if (zenithIds.includes(userId)) return 'zenith';
    
    // Default is regular student
    return 'student';
  };

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-blue-100', 'dark:bg-blue-900');
      setTimeout(() => {
        messageElement.classList.remove('bg-blue-100', 'dark:bg-blue-900');
      }, 2000);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        headers,
      });
      const data = await response.json();
      
      if (data.success) {
        const decryptedMessages = data.messages.map((msg: any) => {
          // Map API response fields to our message interface
          const mappedMessage: ChatMessage = {
            id: msg.id,
            message: msg.message || '',
            content: msg.content || msg.message || '',
            user_id: msg.user_id,
            sender_id: msg.user_id,
            sender_name: msg.author_name || 'Unknown User',
            sender_avatar: msg.author_avatar || '',
            room_id: msg.room_id,
            created_at: msg.created_at,
            timestamp: msg.created_at,
            reply_to: msg.reply_to,
            reply_message: msg.reply_message,
            reply_sender: msg.reply_sender,
            attachments: msg.attachments,
            is_encrypted: msg.is_encrypted || false,
            is_edited: msg.is_edited || false,
          };

          if (mappedMessage.is_encrypted && mappedMessage.content) {
            try {
              // Try to decrypt with ZenithChatEncryption first
              const decrypted = ZenithChatEncryption.decrypt(mappedMessage.content, roomId);
              return { ...mappedMessage, content: decrypted };
            } catch {
              try {
                // Fallback to SimpleEncryption
                const decrypted = SimpleEncryption.decrypt(mappedMessage.content, roomId);
                return { ...mappedMessage, content: decrypted };
              } catch {
                return { ...mappedMessage, content: '[Encrypted message - cannot decrypt]' };
              }
            }
          }
          return mappedMessage;
        });
        
        // Process messages to ensure replies are properly displayed
        const processedMessages = decryptedMessages.map((msg: ChatMessage) => {
          // Ensure we have consistent property names
          return {
            ...msg,
            message: msg.message || msg.content || '',
            content: msg.content || msg.message || '',
            user_id: msg.user_id || msg.sender_id || '',
            sender_id: msg.sender_id || msg.user_id || '',
            reply_to: msg.reply_to || msg.reply_to_message_id || '',
            reply_to_message_id: msg.reply_to_message_id || msg.reply_to || '',
          };
        });
        
        setMessages(processedMessages);
        
        if (messages.length === 0 && processedMessages.length > 0) {
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, messages.length, scrollToBottom]);

  useEffect(() => {
    fetchMessages();
    refreshIntervalRef.current = setInterval(fetchMessages, 2000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchMessages]);
  
  // Don't auto-scroll when messages change - user controls scrolling manually
  useEffect(() => {
    // Only scroll to the bottom on the initial load of messages
    if (messages.length > 0 && messages.length === 1) {
      // Only scroll on first load
      setTimeout(() => scrollToBottom(true), 50);
    }
  }, [messages.length === 1, scrollToBottom]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Upload attachments
  const uploadAttachments = async (files: File[]) => {
    const formData = new FormData();
    
    for (const file of files) {
      formData.append('files', file);
    }
    
    formData.append('roomId', roomId);
    
    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.success ? data.attachments : [];
  };

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  // Handle key press for message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() || attachments.length > 0) {
        sendMessage();
      }
    }
  };

  // Handle click outside of emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button')?.title?.includes('emoji')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    try {
      let messageAttachments = [];
      if (attachments.length > 0) {
        try {
          messageAttachments = await uploadAttachments(attachments);
        } catch (error) {
          console.error('Error uploading attachments:', error);
          showError('Error uploading attachments. Please try again.');
          return;
        }
      }
      
      let content = newMessage.trim();
      let encrypted = false;
      
      if (isEncrypted && content) {
        try {
          const encryptedData = ZenithChatEncryption.encrypt(content, roomId);
          content = encryptedData.encrypted;
          encrypted = true;
        } catch (error) {
          console.error('Error encrypting message:', error);
          showError('Failed to encrypt message. Sending as plain text.');
          encrypted = false;
        }
      }
      
      const messageData: any = {
        room_id: roomId,
        content,
        user_id: currentUser.id,
        sender_name: currentUser.name,
        attachments: messageAttachments,
        is_encrypted: encrypted
      };
      
      if (replyingTo) {
        messageData.reply_to_message_id = replyingTo.id;
        messageData.reply_message = replyingTo.message || replyingTo.content || '';
        messageData.reply_sender = replyingTo.sender_name;
      }
      
      const token = localStorage.getItem('zenith-token');
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        // Get the newly created message from the response if available
        const messageResponse = await response.json();
        
        setNewMessage('');
        setReplyingTo(null);
        setAttachments([]);
        
        // Force refresh to ensure reply bubbles are shown correctly
        await fetchMessages();
        
        // Ensure we scroll to bottom after sending a message, with additional delay to ensure rendering
        setTimeout(() => scrollToBottom(true), 300);
      } else {
        const errorData = await response.json();
        showError('Failed to send message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      let content = newContent;
      
      if (isEncrypted) {
        const encryptedData = ZenithChatEncryption.encrypt(content, roomId);
        content = encryptedData.encrypted;
      }
      
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ messageId, content, is_encrypted: isEncrypted })
      });
      
      if (response.ok) {
        setEditingMessage(null);
        setEditingContent('');
        await fetchMessages();
      } else {
        const errorData = await response.json();
        showError('Failed to edit message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      showError('Error editing message');
    }
  };

  // Delete message
  const confirmDeleteMessage = (messageId: string) => {
    setDeleteConfirmModal({show: true, messageId});
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const headers: any = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat/rooms/${roomId}/messages?messageId=${messageId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        await fetchMessages();
      } else {
        const errorData = await response.json();
        showError('Failed to delete message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Error deleting message');
    } finally {
      setDeleteConfirmModal({show: false, messageId: null});
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle dropdown menu for message
  const toggleDropdown = (messageId: string) => {
    setOpenDropdownId(prev => prev === messageId ? null : messageId);
  };

  // Check if user can edit/delete a message
  const canEditDelete = (message: ChatMessage) => {
    const isOwnMessage = (message.user_id || message.sender_id) === currentUser.id;
    const isRecent = isWithinEditWindow(message.created_at || message.timestamp || '');
    
    // Either it's the user's own recent message OR they are a coordinator
    return (isOwnMessage && isRecent) || isCoordinator;
  };

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900" style={{ paddingBottom: '80px' }}>
      {/* Header with modern styling */}
      <div className="p-3 md:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg md:text-xl font-semibold">Chat Room</h2>
            <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
              Online
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEncrypted(!isEncrypted)}
              className={`p-2 rounded-full transition-colors ${
                isEncrypted 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title={isEncrypted ? 'Encryption ON' : 'Encryption OFF'}
            >
              🔐
            </button>
            
            {isPrivate && onInviteUser && (
              <button
                onClick={onInviteUser}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Invite User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container - Real WhatsApp-like styling with fixed positioning */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 md:px-4 py-3 space-y-2 bg-gray-100 dark:bg-gray-900"
        style={{ 
          backgroundImage: "url('/chat-background.svg')", // Using the WhatsApp-like SVG pattern
          backgroundSize: "contain",
          scrollBehavior: 'auto', // Use auto instead of smooth for more natural scrolling
          overscrollBehavior: 'none', // Prevent scroll chaining
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          paddingBottom: '80px' // Extra padding at bottom to always show input field
        }}
        onScroll={(e) => {
          // Check if we should show the scroll to bottom button
          const container = e.currentTarget;
          const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          setShowScrollButton(!isAtBottom);
        }}
      >
        {messages.map((message, index) => {
          const dateSeparator = getDateSeparator(
            message.created_at || message.timestamp || '',
            index > 0 ? messages[index - 1].created_at || messages[index - 1].timestamp : undefined
          );
          
          const isOwnMessage = (message.user_id || message.sender_id) === currentUser.id;
          const canModify = canEditDelete(message);
          
          // WhatsApp-style message grouping: Check if previous message is from the same user
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const isPrevSameSender = prevMessage && 
            ((prevMessage.user_id || prevMessage.sender_id) === (message.user_id || message.sender_id));
          
          // Get proper user name and role
          const senderName = message.sender_name || 
            (message.user_id === 'system' ? 'System' : 'Unknown User');
          const userInitial = senderName.charAt(0).toUpperCase();
          
          // Determine user role/type for color coding
          const userRole = getUserRole(message.user_id || message.sender_id || '');
          
          // Show avatar only for the first message in a group
          const showAvatar = !isOwnMessage && (!isPrevSameSender || dateSeparator);
          
          return (
            <div key={message.id}>
              {/* Date Separator */}
              {dateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400">
                    {dateSeparator}
                  </div>
                </div>
              )}
              
              {/* Message with avatar for WhatsApp-like styling */}
              <div
                id={`message-${message.id}`}
                className={`flex items-end mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar - only show for received messages and first in group */}
                {!isOwnMessage && (
                  <div className="flex-shrink-0 mr-1">
                    {showAvatar ? (
                      <div className={`avatar-circle bg-${userRole}`} title={senderName}>
                        {userInitial}
                      </div>
                    ) : (
                      <div style={{ width: '35px' }}></div> // Spacer when avatar is hidden
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group shadow-sm ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white ml-auto' // Removed the tail styling
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white mr-auto'
                  }`}
                >
                  {/* Dropdown menu toggle */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleDropdown(message.id)}
                      className="p-1 hover:bg-black hover:bg-opacity-20 rounded"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {/* Dropdown menu */}
                    {openDropdownId === message.id && (
                      <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-10">
                        <button
                          onClick={() => {
                            setReplyingTo(message);
                            toggleDropdown(message.id);
                          }}
                          className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Reply size={14} className="mr-2" /> Reply
                        </button>
                        
                        {canModify && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMessage(message.id);
                                setEditingContent(message.message || message.content || '');
                                toggleDropdown(message.id);
                              }}
                              className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit size={14} className="mr-2" /> Edit
                            </button>
                            
                            <button
                              onClick={() => {
                                confirmDeleteMessage(message.id);
                                toggleDropdown(message.id);
                              }}
                              className="flex items-center w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reply Preview - Improved WhatsApp-like style */}
                  {(message.reply_to || message.reply_to_message_id || message.reply_message) && (
                    <div 
                      className="mb-2 reply-bubble cursor-pointer text-xs"
                      onClick={() => scrollToMessage(message.reply_to || message.reply_to_message_id || '')}
                    >
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {message.reply_sender || 'Reply'}
                      </div>
                      <div className="truncate">{message.reply_message}</div>
                    </div>
                  )}
                  
                  {/* Sender Name - with proper naming and role-based color */}
                  {!isOwnMessage && showAvatar && (
                    <div className={`text-xs font-semibold mb-1 username-${userRole}`}>
                      {senderName}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="break-words">
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white resize-none"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (editingContent.trim()) {
                                editMessage(message.id, editingContent);
                              }
                            }
                            if (e.key === 'Escape') {
                              setEditingMessage(null);
                              setEditingContent('');
                            }
                          }}
                          placeholder="Edit your message..."
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingMessage(null);
                              setEditingContent('');
                            }}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (editingContent.trim()) {
                                editMessage(message.id, editingContent);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={!editingContent.trim()}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {message.message || message.content || ''}
                        {message.is_encrypted && (
                          <span className="ml-2 text-xs opacity-70">🔐</span>
                        )}
                        {message.is_edited && (
                          <span className="ml-2 text-xs opacity-70">(edited)</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id}>
                          {attachment.type === 'image' ? (
                            <div className="max-w-full overflow-hidden">
                              <img
                                src={attachment.url}
                                alt={attachment.filename}
                                className="max-w-full h-auto rounded cursor-pointer object-contain max-h-80"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 p-2 bg-black bg-opacity-20 rounded">
                              <File size={16} />
                              <span className="text-xs">{attachment.filename}</span>
                              <button
                                onClick={() => window.open(attachment.url, '_blank')}
                                className="text-xs underline"
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message Time */}
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs opacity-70">
                      {formatMessageTime(message.created_at || message.timestamp || Date.now().toString())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-24" /> {/* Further increased space to ensure message input is always visible */}
        
        {/* WhatsApp-style scroll to bottom button */}
        {showScrollButton && (
          <div className="fixed bottom-20 right-6 z-30">
            <button
              onClick={() => scrollToBottom(true)}
              className="bg-gray-200 dark:bg-gray-700 rounded-full p-3 shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Scroll to bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Message Input Area - Fixed at bottom, always visible, modern WhatsApp-like styling */}
      <div className="p-3 md:p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 fixed bottom-0 left-0 right-0 z-20 shadow-lg">
        {/* Reply Preview - Modern WhatsApp-like style */}
        {replyingTo && (
          <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm max-h-20 overflow-hidden border-l-4 border-blue-500">
            <div className="flex items-center justify-between p-2">
              <div className="flex-1 min-w-0 pl-2">
                <div className="text-xs font-semibold text-blue-500">
                  Replying to {replyingTo?.sender_name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[90%]">
                  {replyingTo?.message || replyingTo?.content || ''}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* Attachments Preview - Modern card style */}
        {attachments.length > 0 && (
          <div className="mb-2 max-h-24 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm max-w-48 border border-gray-200 dark:border-gray-700">
                  {file.type.startsWith('image/') ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <Image size={10} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-2">
                      <File size={16} className="text-blue-500" />
                    </div>
                  )}
                  <span className="text-xs truncate flex-1 max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-500 hover:text-red-500 flex-shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area - Modern WhatsApp-like styling */}
        <div className="flex items-center space-x-2 relative mt-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1">
          <div className="avatar-circle bg-self hidden md:flex">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex-shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Attach files"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex-shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>
          
          <div className="flex-1 min-w-0">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isEncrypted ? "Type an encrypted message..." : "Type a message..."}
              className="w-full p-2 bg-transparent border-none resize-none focus:outline-none dark:text-white"
              rows={1}
              style={{ 
                minHeight: '40px', 
                maxHeight: '100px',
                overflow: 'auto'
              }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 h-10 w-10 flex items-center justify-center"
          >
            <Send size={18} />
          </button>

          {/* Emoji Picker - Modern floating panel */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full left-0 md:left-10 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20"
              style={{ 
                width: '280px', 
                height: '220px',
                position: 'absolute',
                bottom: '100%'
              }}
            >
              <div className="flex justify-between items-center mb-2 pb-1 border-b dark:border-gray-700">
                <span className="text-sm font-medium">Emoji</span>
                <button 
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 overflow-y-auto h-[180px] custom-scrollbar">
                {EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      addEmoji(emoji);
                      // Don't close the picker after selecting an emoji
                    }}
                    className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Modal - Modern design */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6 pl-11">{errorModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModal({show: false, message: ''})}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Modern design */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Message</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6 pl-11">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({show: false, messageId: null})}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmModal.messageId) {
                    deleteMessage(deleteConfirmModal.messageId);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
