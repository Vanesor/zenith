"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MoreVertical, Search, ArrowLeft, Check, CheckCheck, 
  Plus, User, Users, Settings, MessageCircle, Trash2, X, Reply, 
  Edit3, ChevronDown, Smile, Paperclip, Image as ImageIcon, File,
  Clock, Star, Volume2, PhoneCall, VideoIcon, Calendar, Shield,
  AlertCircle, Target
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: Date | string;
  isRead: boolean;
  isDelivered: boolean;
  isEdited?: boolean;
  editedAt?: Date | string;
  type: 'text' | 'image' | 'file';
  canEdit?: boolean;
  canDelete?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'club';
  description?: string;
  profile_picture_url?: string;
  member_count: number;
  created_by?: string;
  last_message?: {
    content: string;
    sender_name: string;
    timestamp: Date | string;
  };
  unread_count?: number;
}

// Edit Message Modal
interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onMessageEdited: () => void;
}

function EditMessageModal({ isOpen, onClose, message, onMessageEdited }: EditMessageModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && message) {
      setContent(message.content);
      setError('');
    }
  }, [isOpen, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !content.trim()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId: message.id,
          content: content.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        onMessageEdited();
        onClose();
      } else {
        setError(data.error || 'Failed to edit message');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-purple-500/20"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative p-6 border-b border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-accent">
                  Edit Message
                </h2>
                <p className="text-muted mt-1">Make changes to your message</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full p-2 h-auto text-muted hover:text-primary hover:bg-hover"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-purple-300 mb-3">
                <Edit3 className="h-4 w-4 inline mr-2" />
                Message
              </label>
                            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-accent focus:ring focus:ring-accent/20 resize-none h-32 transition-all"
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-purple-500/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border-custom text-secondary hover:bg-hover hover:text-primary rounded-xl transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-accent hover:opacity-90 text-white rounded-xl font-semibold transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Delete Message Modal
interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onMessageDeleted: () => void;
}

function DeleteMessageModal({ isOpen, onClose, message, onMessageDeleted }: DeleteMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!message) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/chat/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageId: message.id })
      });

      const data = await response.json();

      if (response.ok) {
        onMessageDeleted();
        onClose();
      } else {
        setError(data.error || 'Failed to delete message');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-500/20"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative p-6 border-b border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-red-500">
                  Delete Message
                </h2>
                <p className="text-muted mt-1">This action cannot be undone</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full p-2 h-auto text-muted hover:text-primary hover:bg-hover"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-6 bg-section border border-custom rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                <p className="text-red-300 font-medium">Warning</p>
              </div>
              <p className="text-secondary">
                Are you sure you want to delete this message? This action cannot be undone and the message will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-red-500/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border-custom text-secondary hover:bg-hover hover:text-primary rounded-xl transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-primary rounded-xl font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Message'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
      </motion.div>
    </AnimatePresence>
  );
}

// Create Room Modal Component
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
}

function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'club',
    club_id: '',
    profile_picture_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchClubs();
      checkPermissions();
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/clubs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setClubsLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/projects/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onRoomCreated();
        onClose();
        setFormData({
          name: '',
          description: '',
          type: 'public',
          club_id: '',
          profile_picture_url: ''
        });
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="zenith-bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border zenith-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b zenith-border zenith-bg-section">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Create Chat Room
                </h2>
                <p className="zenith-text-secondary mt-1">
                  Set up a new chat room with team collaboration features
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full p-2 h-auto zenith-text-muted hover:zenith-text-primary hover:zenith-bg-hover"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] zenith-bg-card">
            {permissionsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                <p className="mt-4 zenith-text-secondary">Checking permissions...</p>
              </div>
            ) : !permissions?.canCreateProject ? (
              <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-400 text-lg">
                        Permission Required
                      </h3>
                      <p className="text-red-300 mt-1">
                        You don't have permission to create chat rooms. Contact an administrator.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Room Name */}
                    <div>
                      <label className="block text-sm font-medium zenith-text-primary mb-3">
                        <MessageCircle className="h-4 w-4 inline mr-2" />
                        Room Name *
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter an exciting room name..."
                          required
                          className="w-full zenith-bg-input border zenith-border zenith-text-primary placeholder:zenith-text-muted focus:border-purple-400 focus:ring-purple-400/20 rounded-xl h-12"
                        />
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Room Type */}
                    <div>
                      <label className="block text-sm font-medium zenith-text-primary mb-3">
                        <Target className="h-4 w-4 inline mr-2" />
                        Room Type *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setFormData(prev => ({ ...prev, type: 'public' }))}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.type === 'public'
                              ? 'border-purple-400 bg-purple-500/10'
                              : 'zenith-border zenith-bg-section hover:border-purple-400/50'
                          }`}
                        >
                          <div className="text-center">
                            <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                            <div className="font-medium zenith-text-primary">Public</div>
                            <div className="text-xs zenith-text-muted mt-1">Open to all members</div>
                          </div>
                        </div>
                        <div
                          onClick={() => setFormData(prev => ({ ...prev, type: 'club' }))}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.type === 'club'
                              ? 'border-purple-400 bg-purple-500/10'
                              : 'zenith-border zenith-bg-section hover:border-purple-400/50'
                          }`}
                        >
                          <div className="text-center">
                            <Shield className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                            <div className="font-medium zenith-text-primary">Club</div>
                            <div className="text-xs zenith-text-muted mt-1">Club members only</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Club Selection */}
                    {formData.type === 'club' && (
                      <div>
                        <label className="block text-sm font-medium zenith-text-primary mb-3">
                          <Users className="h-4 w-4 inline mr-2" />
                          Select Club *
                        </label>
                        {clubsLoading ? (
                          <div className="zenith-bg-section rounded-xl p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto"></div>
                          </div>
                        ) : clubs.length > 0 ? (
                          <select
                            value={formData.club_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, club_id: e.target.value }))}
                            className="w-full zenith-bg-input border zenith-border zenith-text-primary rounded-xl h-12 px-4 focus:border-purple-400 focus:ring-purple-400/20"
                            required
                          >
                            <option value="">Choose your club...</option>
                            {clubs.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="zenith-bg-section rounded-xl p-4 text-center">
                            <p className="zenith-text-muted">No clubs available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium zenith-text-primary mb-3">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your room goals, objectives, and expected outcomes..."
                        className="w-full zenith-bg-input border zenith-border zenith-text-primary placeholder:zenith-text-muted rounded-xl p-4 focus:border-purple-400 focus:ring-purple-400/20 resize-none h-32"
                        required
                      />
                    </div>

                    {/* Profile Picture */}
                    <div>
                      <label className="block text-sm font-medium zenith-text-primary mb-3">
                        Profile Picture URL
                      </label>
                      <Input
                        type="url"
                        value={formData.profile_picture_url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, profile_picture_url: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full zenith-bg-input border zenith-border zenith-text-primary placeholder:zenith-text-muted focus:border-purple-400 focus:ring-purple-400/20 rounded-xl h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-4 pt-8 mt-8 border-t zenith-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="px-8 py-3 border zenith-border zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.name.trim() || !formData.description.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Room...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Room
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 2000);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/chat/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          content: newMessage.trim(),
          messageType: 'text',
          replyToMessageId: replyingTo?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setReplyingTo(null);
        fetchRooms(); // Refresh room list to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date | string) => {
    try {
      const date = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'dd/MM/yyyy');
      }
    } catch (error) {
      return '';
    }
  };

  const formatDateSeparator = (timestamp: Date | string) => {
    try {
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'EEEE, MMMM d, yyyy');
      }
    } catch (error) {
      return '';
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const prevDate = new Date(previousMessage.timestamp);
    
    return !isSameDay(currentDate, prevDate);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setShowEditModal(true);
  };

  const handleDeleteMessage = (message: Message) => {
    setDeletingMessage(message);
    setShowDeleteModal(true);
  };

  const handleMessageEdited = () => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  };

  const handleMessageDeleted = () => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  };

  return (
    <div className="h-screen bg-main flex">
      {/* Sidebar - Room List */}
      <div className="w-80 bg-card border-r border-custom flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-custom">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-primary">Chats</h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full p-2 h-10 w-10 bg-blue-600 hover:bg-blue-700 text-primary"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zenith-secondary" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zenith-input border-zenith-border focus:ring-2 focus:ring-blue-500 text-zenith-primary"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zenith-secondary">Loading chats...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-zenith-secondary">
              {searchTerm ? 'No chats found' : 'No chats available'}
            </div>
          ) : (
            filteredRooms.map((room, index) => {
              // Create diverse color combinations for chat rooms
              const colorCombinations = [
                'from-blue-500 to-purple-600',
                'from-green-500 to-teal-600',
                'from-orange-500 to-red-600',
                'from-purple-500 to-pink-600',
                'from-indigo-500 to-blue-600',
                'from-emerald-500 to-cyan-600',
                'from-yellow-500 to-orange-600',
                'from-rose-500 to-pink-600',
                'from-violet-500 to-purple-600',
                'from-amber-500 to-yellow-600',
                'from-teal-500 to-green-600',
                'from-sky-500 to-blue-600'
              ];
              const colorIndex = room.id ? parseInt(room.id.slice(-1), 16) % colorCombinations.length : index % colorCombinations.length;
              const gradientColors = colorCombinations[colorIndex];
              
              return (
                <motion.div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 border-b border-zenith-border cursor-pointer hover:bg-zenith-hover transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-zenith-section border-r-2 border-blue-500' : ''
                  }`}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-12 h-12 bg-gradient-to-br ${gradientColors} rounded-full flex items-center justify-center shadow-lg`}>
                        {room.profile_picture_url ? (
                          <img
                            src={room.profile_picture_url}
                            alt={room.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {room.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {room.type === 'club' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zenith-card shadow-sm" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-zenith-primary truncate">
                          {room.name}
                        </h3>
                        {room.last_message && (
                          <span className="text-xs text-zenith-secondary">
                            {formatMessageTime(room.last_message.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-zenith-secondary truncate">
                          {room.last_message
                            ? `${room.last_message.sender_name}: ${room.last_message.content}`
                            : room.description || 'No messages yet'
                          }
                        </p>
                        {room.unread_count && room.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-2 shadow-sm">
                            {room.unread_count > 99 ? '99+' : room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {selectedRoom.profile_picture_url ? (
                      <img
                        src={selectedRoom.profile_picture_url}
                        alt={selectedRoom.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold">
                        {selectedRoom.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-primary">
                      {selectedRoom.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRoom.member_count} members • {selectedRoom.type} room
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reply Bar */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-blue-50 border-b border-blue-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Reply className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">
                        Replying to {replyingTo.senderName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {replyingTo.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const previousMessage = index > 0 ? messages[index - 1] : undefined;
                  const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId || showDateSeparator);
                  const showName = !isOwn && showAvatar;

                  return (
                    <div key={message.id}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-200 px-3 py-1 rounded-full">
                            <span className="text-xs font-medium text-primary">
                              {formatDateSeparator(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      <motion.div
                        id={`message-${message.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs md:max-w-md lg:max-w-lg`}>
                          {showAvatar && (
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              {message.senderAvatar ? (
                                <img
                                  src={message.senderAvatar}
                                  alt={message.senderName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary text-sm font-semibold">
                                  {message.senderName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className={`${!showAvatar && !isOwn ? 'ml-10' : ''}`}>
                            {showName && (
                              <p className="text-xs text-primary mb-1 px-3">
                                {message.senderName}
                              </p>
                            )}
                            
                            <div
                              className={`relative px-4 py-2 rounded-2xl break-words ${
                                isOwn
                                  ? 'bg-blue-600 text-primary'
                                  : 'bg-white text-gray-900 text-primary border border-gray-200'
                              }`}
                            >
                              {message.replyTo && (
                                <div
                                  className={`mb-2 pb-2 border-l-4 pl-3 cursor-pointer ${
                                    isOwn ? 'border-blue-300' : 'border-gray-300'
                                  }`}
                                  onClick={() => scrollToMessage(message.replyTo!.id)}
                                >
                                  <p className={`text-xs font-semibold ${isOwn ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {message.replyTo.senderName}
                                  </p>
                                  <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'} truncate`}>
                                    {message.replyTo.content}
                                  </p>
                                </div>
                              )}
                              
                              <p className="text-sm">{message.content}</p>
                              
                              <div className={`flex items-center justify-end space-x-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                {message.isEdited && (
                                  <span className="text-xs opacity-70">edited</span>
                                )}
                                <span className="text-xs">
                                  {formatMessageTime(message.timestamp)}
                                </span>
                                {isOwn && (
                                  <div className="flex">
                                    {message.isDelivered && <Check className="h-3 w-3" />}
                                    {message.isRead && <Check className="h-3 w-3 -ml-1" />}
                                  </div>
                                )}
                              </div>
                              
                              {/* Message Actions */}
                              <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-1 shadow-lg">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyingTo(message)}
                                    className="p-1 h-auto"
                                  >
                                    <Reply className="h-4 w-4" />
                                  </Button>
                                  {message.canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditMessage(message)}
                                      className="p-1 h-auto"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {message.canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteMessage(message)}
                                      className="p-1 h-auto text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-primary max-h-32"
                    rows={1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="rounded-full p-3 bg-blue-600 hover:bg-blue-700 text-primary disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center">
              <MessageCircle className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-primary mb-2">
                Welcome to Zenith Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a chat room to start messaging with your community
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-primary px-6 py-3 rounded-full"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Room
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={fetchRooms}
      />
      
      <EditMessageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        message={editingMessage}
        onMessageEdited={handleMessageEdited}
      />
      
      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        message={deletingMessage}
        onMessageDeleted={handleMessageDeleted}
      />

      <style jsx>{`
        .highlight-message {
          animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.1); }
        }
      `}</style>
    </div>
  );
}
