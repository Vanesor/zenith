"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Users, Target, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    club_id: '',
    project_type: 'innovation',
    priority: 'medium',
    target_end_date: '',
    is_public: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<any>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkPermissions();
      fetchClubs();
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/clubs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onProjectCreated();
        setFormData({
          name: '',
          description: '',
          club_id: '',
          project_type: 'innovation',
          priority: 'medium',
          target_end_date: '',
          is_public: false
        });
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (error) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Enhanced Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-br from-black/50 via-blue-900/30 to-purple-900/40 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modern Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50, rotateX: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="bg-gradient-to-br from-white/95 via-white/90 to-blue-50/90 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-blue-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="relative px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Create New Project
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Set up a new project with team collaboration features
                  </p>
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              {permissionsLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mb-4"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 dark:text-gray-300 text-center"
                  >
                    <p className="text-lg font-medium">Checking permissions...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we verify your access</p>
                  </motion.div>
                </motion.div>
              ) : !permissions?.canCreateProject ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Shield className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Insufficient Permissions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      You need to be a Club Coordinator, Co-coordinator, or Zenith Committee member to create projects.
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 mb-8">
                      Current role: <span className="font-medium ml-1 capitalize">{permissions?.role || 'member'}</span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button 
                      onClick={onClose} 
                      variant="outline"
                      className="px-8 py-3 rounded-xl border-2 hover:scale-105 transition-transform"
                    >
                      Close
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </motion.div>
                      <span className="text-red-600 dark:text-red-400 font-medium">{error}</span>
                    </motion.div>
                  )}

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Project Name */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-blue-600" />
                          Project Name *
                        </label>
                        <div className="relative group">
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter an exciting project name..."
                            className="h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 group-hover:border-gray-300 dark:group-hover:border-gray-500"
                            required
                          />
                          <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        </div>
                      </motion.div>

                      {/* Club Selection */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-purple-600" />
                          Select Club *
                        </label>
                        <div className="relative group">
                          <select
                            name="club_id"
                            value={formData.club_id}
                            onChange={handleChange}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-900 dark:text-white appearance-none cursor-pointer"
                            required
                          >
                            <option value="">Choose your club...</option>
                            {clubs.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                          <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors w-4 h-4 pointer-events-none" />
                          <motion.div
                            animate={{ rotate: formData.club_id ? 180 : 0 }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Project Type */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-indigo-600" />
                          Project Type *
                        </label>
                        <div className="relative group">
                          <select
                            name="project_type"
                            value={formData.project_type}
                            onChange={handleChange}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 text-gray-900 dark:text-white appearance-none cursor-pointer"
                            required
                          >
                            <option value="innovation">🚀 Innovation</option>
                            <option value="research">🔬 Research</option>
                            <option value="event">🎉 Event</option>
                            <option value="community">🤝 Community</option>
                            <option value="education">📚 Education</option>
                            <option value="outreach">🌍 Outreach</option>
                          </select>
                          <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4 pointer-events-none" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Priority & Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="space-y-3"
                        >
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Priority
                          </label>
                          <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 text-gray-900 dark:text-white appearance-none cursor-pointer"
                          >
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🟠 High</option>
                            <option value="critical">🔴 Critical</option>
                          </select>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                          className="space-y-3"
                        >
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-green-600" />
                            Target Date
                          </label>
                          <div className="relative group">
                            <Input
                              name="target_end_date"
                              type="date"
                              value={formData.target_end_date}
                              onChange={handleChange}
                              className="h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300"
                            />
                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors w-4 h-4 pointer-events-none" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Description */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Describe your project goals, objectives, and expected outcomes..."
                          className="w-full h-32 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Public Option */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative"
                      >
                        <input
                          type="checkbox"
                          id="is_public"
                          name="is_public"
                          checked={formData.is_public}
                          onChange={(e) => setFormData(prev => ({...prev, is_public: e.target.checked}))}
                          className="w-6 h-6 text-blue-600 bg-white border-2 border-blue-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-300"
                        />
                        {formData.is_public && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.div>
                      <div>
                        <label htmlFor="is_public" className="text-base font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                          Make this project public
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Public projects are visible to all users and can attract more collaborators
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                      className="px-8 py-3 rounded-xl border-2 hover:scale-105 transition-transform"
                    >
                      Cancel
                    </Button>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        disabled={loading || !formData.name || !formData.description || !formData.club_id}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {loading ? (
                          <motion.div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            />
                            Creating Project...
                          </motion.div>
                        ) : (
                          <div className="flex items-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Create Project
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
