"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, UserPlus, AlertCircle, Search, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited: () => void;
  projectId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_member?: boolean;
}

export default function InviteMemberModal({ isOpen, onClose, onMemberInvited, projectId }: InviteMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [inviteMode, setInviteMode] = useState<'search' | 'link'>('search');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      fetchProjectKey();
    }
  }, [isOpen, projectId]);

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/invitable-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchProjectKey = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectKey(data.project.access_password || '');
      }
    } catch (error) {
      console.error('Error fetching project key:', error);
    }
  };

  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to invite');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds: selectedUsers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onMemberInvited();
        setSelectedUsers([]);
        setSearchTerm('');
      } else {
        setError(data.error || 'Failed to invite users');
      }
    } catch (error) {
      setError('Failed to invite users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const copyProjectKey = () => {
    navigator.clipboard.writeText(projectKey);
    // You could add a toast notification here
  };

  const filteredUsers = availableUsers.filter(user => 
    !user.is_member && (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Enhanced Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: 10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            rotateX: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: 20, 
            rotateX: 10,
            transition: { duration: 0.2 }
          }}
          className="relative z-10 w-full max-w-2xl mx-4"
          style={{ perspective: 1000 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
            
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl" />
            
            {/* Animated border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-50" />
            
            <div className="relative">
              {/* Enhanced Header */}
              <CardHeader className="pb-4 relative">
                {/* Header gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-t-lg" />
                
                <div className="relative flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Invite Team Members
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                      Add people to collaborate on this project
                    </CardDescription>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                {/* Enhanced Invite Mode Tabs */}
                <motion.div 
                  className="flex space-x-2 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Button
                    variant={inviteMode === 'search' ? 'default' : 'outline'}
                    onClick={() => setInviteMode('search')}
                    size="sm"
                    className={`transition-all duration-300 ${
                      inviteMode === 'search' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-primary shadow-lg scale-105' 
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Users
                  </Button>
                  <Button
                    variant={inviteMode === 'link' ? 'default' : 'outline'}
                    onClick={() => setInviteMode('link')}
                    size="sm"
                    className={`transition-all duration-300 ${
                      inviteMode === 'link' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-primary shadow-lg scale-105' 
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Share Link
                  </Button>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </motion.div>
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">{error}</span>
                  </motion.div>
                )}

                {inviteMode === 'search' ? (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Enhanced Search Input */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    {/* Enhanced Selected Users */}
                    {selectedUsers.length > 0 && (
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.3 }}
                            className="w-2 h-2 bg-blue-500 rounded-full mr-2"
                          />
                          Selected ({selectedUsers.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((userId, index) => {
                            const user = availableUsers.find(u => u.id === userId);
                            return user ? (
                              <motion.div
                                key={userId}
                                initial={{ opacity: 0, scale: 0, x: -20 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: 1, 
                                  x: 0,
                                  transition: { delay: index * 0.05 }
                                }}
                                exit={{ opacity: 0, scale: 0, x: -20 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Badge
                                  className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-200 cursor-pointer border border-blue-200 dark:border-blue-700 px-3 py-1.5 text-sm font-medium hover:shadow-md transition-all duration-200"
                                  onClick={() => toggleUserSelection(userId)}
                                >
                                  {user.name} 
                                  <X className="ml-2 h-3 w-3" />
                                </Badge>
                              </motion.div>
                            ) : null;
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Enhanced User List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="w-2 h-2 bg-purple-500 rounded-full mr-2"
                        />
                        Available Users
                      </h4>
                      
                      <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600">
                        {filteredUsers.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                          >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {searchTerm ? 'No users found matching your search' : 'No users available to invite'}
                            </p>
                          </motion.div>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 20, x: -10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0, 
                                x: 0,
                                transition: { delay: index * 0.05 }
                              }}
                              whileHover={{ 
                                scale: 1.02,
                                y: -2,
                                transition: { duration: 0.2 }
                              }}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group ${
                                selectedUsers.includes(user.id)
                                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm'
                              }`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full transition-colors ${
                                      selectedUsers.includes(user.id) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400'
                                    }`} />
                                    <div>
                                      <h5 className="font-semibold text-gray-900 dark:text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {user.name}
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {user.email}
                                      </p>
                                      {user.role && (
                                        <Badge variant="secondary" className="text-xs mt-1.5 bg-gray-100 dark:bg-gray-700">
                                          {user.role}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedUsers.includes(user.id) && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="flex-shrink-0"
                                  >
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <Check className="w-4 h-4 text-primary" />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <motion.div 
                      className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2 h-11 border-2 hover:scale-105 hover:shadow-md transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInviteUsers}
                        disabled={loading || selectedUsers.length === 0}
                        className="px-6 py-2 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 transition-all duration-300"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Mail className="w-5 h-5 mr-2" />
                        )}
                        {loading ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-center">
                      <motion.div 
                        className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-blue-200/50 dark:border-blue-700/50"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Decorative elements */}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500/10 rounded-full" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 bg-purple-500/10 rounded-full" />
                        
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Copy className="w-8 h-8 text-primary" />
                          </div>
                        </motion.div>
                        
                        <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          Project Access Key
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          Share this key with team members to let them join the project instantly
                        </p>
                        
                        <div className="flex items-center space-x-3">
                          <Input
                            value={projectKey}
                            readOnly
                            className="font-mono text-center text-lg font-semibold bg-white/70 dark:bg-gray-700/70 border-2 border-gray-200 dark:border-gray-600 rounded-xl h-12 backdrop-blur-sm"
                          />
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              onClick={copyProjectKey}
                              variant="outline"
                              size="sm"
                              className="h-12 w-12 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all duration-200"
                            >
                              <Copy className="w-5 h-5" />
                            </Button>
                          </motion.div>
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-purple-500 rounded-full mr-2"
                          />
                          Anyone with this key can join the project
                        </p>
                      </motion.div>
                    </div>

                    <motion.div 
                      className="flex justify-center pt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-8 py-2 h-11 border-2 hover:scale-105 hover:shadow-md transition-all duration-200"
                      >
                        Close
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
