import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Reply, Edit, Trash2, Image, File, Paperclip, ArrowUp, X } from 'lucide-react';
import { ZenithChatEncryption, SimpleEncryption } from '@/lib/encryption';

interface ChatMessage {
  id: string;
  message: string; // Using existing 'message' field from schema
  content?: string; // Optional for backward compatibility
  user_id: string; // Using existing field name
  sender_id?: string; // Optional alias
  sender_name?: string;
  room_id: string;
  created_at: string; // Using existing field name
  timestamp?: string; // Optional alias
  reply_to?: string;
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
}

interface EnhancedChatRoomProps {
  roomId: string;
  currentUser: User;
  isPrivate?: boolean;
  onInviteUser?: () => void;
}

export const EnhancedChatRoom: React.FC<EnhancedChatRoomProps> = ({
  roomId,
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false); // Disabled by default
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual scroll to bottom (only when user clicks)
  const scrollToBottom = useCallback((forceScroll = false) => {
    if (autoScroll || forceScroll) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth'
      });
    }
  }, [autoScroll]);

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('bg-blue-100', 'dark:bg-blue-900');
      setTimeout(() => {
        messageElement.classList.remove('bg-blue-100', 'dark:bg-blue-900');
      }, 2000);
    }
  }, []);

  // Fetch messages with encryption handling
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
        const decryptedMessages = data.messages.map((msg: ChatMessage) => {
          if (msg.is_encrypted && msg.content) {
            try {
              // Try to decrypt with ZenithChatEncryption first
              const decrypted = ZenithChatEncryption.decrypt(msg.content, roomId);
              return { ...msg, content: decrypted };
            } catch {
              try {
                // Fallback to SimpleEncryption
                const decrypted = SimpleEncryption.decrypt(msg.content, roomId);
                return { ...msg, content: decrypted };
              } catch {
                return { ...msg, content: '[Encrypted message - cannot decrypt]' };
              }
            }
          }
          return msg;
        });
        
        setMessages(decryptedMessages);
        
        // Only scroll if auto-scroll is enabled and there are new messages
        if (autoScroll && decryptedMessages.length > messages.length) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, messages.length, scrollToBottom]);

  // Auto-refresh messages every 2 seconds for instant updates
  useEffect(() => {
    fetchMessages();
    
    refreshIntervalRef.current = setInterval(fetchMessages, 2000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchMessages]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Compress image files
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(file);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            try {
              const compressedFile = new (window as any).File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } catch {
              // Fallback for browsers that don't support File constructor
              resolve(file);
            }
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.7);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload attachments
  const uploadAttachments = async (files: File[]) => {
    const formData = new FormData();
    
    for (const file of files) {
      let fileToUpload = file;
      
      // Compress images
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }
      
      formData.append('files', fileToUpload);
    }
    
    formData.append('roomId', roomId);
    
    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data.success ? data.attachments : [];
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    try {
      let uploadedAttachments = [];
      
      // Upload attachments if any
      if (attachments.length > 0) {
        uploadedAttachments = await uploadAttachments(attachments);
      }
      
      let messageContent = newMessage.trim();
      let encrypted = false;
      
      // Encrypt message if encryption is enabled
      if (isEncrypted && messageContent) {
        const encryptedData = ZenithChatEncryption.encrypt(messageContent, roomId);
        messageContent = encryptedData.encrypted;
        encrypted = true;
      }
      
      const messageData = {
        content: messageContent,
        room_id: roomId,
        reply_to: replyingTo?.id || null,
        attachments: uploadedAttachments,
        is_encrypted: encrypted
      };
      
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
        setNewMessage('');
        setReplyingTo(null);
        setAttachments([]);
        await fetchMessages();
        // Always scroll to bottom after sending a message
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        const errorData = await response.json();
        console.error('Send message error:', errorData.error);
        alert('Failed to send message: ' + errorData.error);
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
        console.error('Edit error:', errorData.error);
        alert('Failed to edit message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
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
        console.error('Delete error:', errorData.error);
        alert('Failed to delete message: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">
            {isPrivate ? '🔒 Private Room' : '💬 Chat Room'}
          </h2>
          <span className="text-sm text-gray-500">#{roomId.substring(0, 8)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Encryption Toggle */}
          <button
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={`p-2 rounded-lg transition-colors ${
              isEncrypted 
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
            title={isEncrypted ? 'Encryption ON' : 'Encryption OFF'}
          >
            🔐
          </button>
          
          {/* Invite Button for Private Rooms */}
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

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`flex ${
              (message.user_id || message.sender_id) === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                (message.user_id || message.sender_id) === currentUser.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {/* Reply Preview */}
              {message.reply_to && (
                <div 
                  className="mb-2 p-2 rounded bg-black bg-opacity-20 cursor-pointer text-xs"
                  onClick={() => scrollToMessage(message.reply_to!)}
                >
                  <div className="font-semibold">{message.reply_sender}</div>
                  <div className="truncate">{message.reply_message}</div>
                </div>
              )}
              
              {/* Sender Name (for other users) */}
              {(message.user_id || message.sender_id) !== currentUser.id && (
                <div className="text-xs font-semibold mb-1">
                  {message.sender_name || 'Unknown User'}
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
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-w-full h-auto rounded cursor-pointer"
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
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
              
              {/* Message Actions */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {new Date(message.created_at || message.timestamp || Date.now()).toLocaleTimeString()}
                </span>
                
                {(message.user_id || message.sender_id) === currentUser.id && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="p-1 rounded hover:bg-black hover:bg-opacity-20"
                      title="Reply"
                    >
                      <Reply size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessage(message.id);
                        setEditingContent(message.message || message.content || '');
                      }}
                      className="p-1 rounded hover:bg-black hover:bg-opacity-20"
                      title="Edit"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="p-1 rounded hover:bg-black hover:bg-opacity-20"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Controls */}
      <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span>Auto-scroll to new messages</span>
            </label>
          </div>
          <button
            onClick={() => scrollToBottom(true)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            <ArrowUp size={14} className="rotate-180" />
            <span>Scroll to Bottom</span>
          </button>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t dark:border-gray-700">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Replying to {replyingTo.sender_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {replyingTo.message || replyingTo.content || ''}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {file.type.startsWith('image/') ? (
                  <Image size={16} className="text-blue-600" />
                ) : (
                  <File size={16} className="text-gray-600" />
                )}
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input Area */}
        <div className="flex items-end space-x-2">
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
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Attach files"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isEncrypted ? "Type an encrypted message..." : "Type a message..."}
              className="w-full p-3 border rounded-lg resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
