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
  const [success, setSuccess] = useState(false);
  const [projectResult, setProjectResult] = useState<{
    project_key: string;
    access_password: string;
    name: string;
  } | null>(null);
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
    setSuccess(false);
    setProjectResult(null);

    // Validate project name length
    if (formData.name.length < 5) {
      setError('Project name must be at least 5 characters long');
      setLoading(false);
      return;
    }

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
        setSuccess(true);
        setProjectResult({
          project_key: data.project.project_key,
          access_password: data.project.access_password,
          name: data.project.name
        });
        
        // Reset form for next use
        setFormData({
          name: '',
          description: '',
          club_id: '',
          project_type: 'innovation',
          priority: 'medium',
          target_end_date: '',
          is_public: false
        });
        
        // Don't close modal immediately - show success message first
      } else {
        if (data.error?.includes('unique constraint') || data.error?.includes('already exists')) {
          setError('A project with this name already exists. Please choose a different name.');
        } else {
          setError(data.error || 'Failed to create project');
        }
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
          className="absolute inset-0 modal-backdrop-gradient backdrop-blur-md"
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
          <div className="modal-bg-gradient backdrop-blur-xl border border-custom rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="relative px-8 py-6 border-b border-custom modal-border-gradient bg-section">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold gradient-text-primary">
                    Create New Project
                  </h2>
                  <p className="text-secondary mt-1">
                    Set up a new project with team collaboration features
                  </p>
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-hover hover:bg-hover border border-custom transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </motion.button>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 modal-header-gradient"></div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-h-[calc(90vh-100px)] overflow-y-auto modal-bg-gradient">
              {permissionsLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-custom border-t-accent rounded-full mb-4"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-secondary text-center"
                  >
                    <p className="text-lg font-medium">Checking permissions...</p>
                    <p className="text-sm text-muted mt-2">Please wait while we verify your access</p>
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
                    className="w-24 h-24 bg-section rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Shield className="w-12 h-12 text-muted" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-2xl font-bold text-primary mb-3">
                      Insufficient Permissions
                    </h3>
                    <p className="text-secondary mb-2">
                      You need to be a Club Coordinator, Co-coordinator, or Zenith Committee member to create projects.
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-section text-sm text-secondary mb-8">
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
                      className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl"
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

                  {success && projectResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5 }}
                          className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                            Project Created Successfully!
                          </h3>
                          <p className="text-green-600 dark:text-green-400 text-sm">
                            {projectResult.name} has been created
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Key
                          </label>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                              {projectResult.project_key}
                            </code>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(projectResult.project_key)}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Access Password
                          </label>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                              {projectResult.access_password}
                            </code>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(projectResult.access_password)}
                              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Important:</strong> Save these credentials! Team members will need both the Project Key and Access Password to join this project.
                        </p>
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            onProjectCreated();
                            setSuccess(false);
                            setProjectResult(null);
                          }}
                          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          Got it, Close
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Form Grid - only show when not in success state */}
                  {!success && (
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
                        <label className="text-sm font-semibold text-secondary flex items-center">
                          <Target className="w-4 h-4 mr-2 text-accent" />
                          Project Name *
                        </label>
                        <div className="relative group">
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter an exciting project name..."
                            className="h-12 pl-12 pr-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 group-hover:border-hover"
                            required
                          />
                          <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors w-4 h-4" />
                        </div>
                      </motion.div>

                      {/* Club Selection */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-secondary flex items-center">
                          <Users className="w-4 h-4 mr-2 text-accent" />
                          Select Club *
                        </label>
                        <div className="relative group">
                          <select
                            name="club_id"
                            value={formData.club_id}
                            onChange={handleChange}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 text-primary appearance-none cursor-pointer"
                            required
                          >
                            <option value="">Choose your club...</option>
                            {clubs.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                          <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors w-4 h-4 pointer-events-none" />
                          <motion.div
                            animate={{ rotate: formData.club_id ? 180 : 0 }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                          >
                            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <label className="text-sm font-semibold text-secondary flex items-center">
                          <Target className="w-4 h-4 mr-2 text-accent" />
                          Project Type *
                        </label>
                        <div className="relative group">
                          <select
                            name="project_type"
                            value={formData.project_type}
                            onChange={handleChange}
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 text-primary appearance-none cursor-pointer"
                            required
                          >
                            <option value="innovation">🚀 Innovation</option>
                            <option value="research">🔬 Research</option>
                            <option value="event">🎉 Event</option>
                            <option value="community">🤝 Community</option>
                            <option value="education">📚 Education</option>
                            <option value="outreach">🌍 Outreach</option>
                          </select>
                          <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors w-4 h-4 pointer-events-none" />
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
                          <label className="text-sm font-semibold text-secondary">
                            Priority
                          </label>
                          <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full h-12 px-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 text-primary appearance-none cursor-pointer"
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
                          <label className="text-sm font-semibold text-secondary flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-accent" />
                            Due Date
                          </label>
                          <div className="relative group">
                            <Input
                              name="target_end_date"
                              type="date"
                              value={formData.target_end_date}
                              onChange={handleChange}
                              min={new Date().toISOString().split('T')[0]}
                              className="h-12 pl-12 pr-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300"
                            />
                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors w-4 h-4 pointer-events-none" />
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
                        <label className="text-sm font-semibold text-secondary">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Describe your project goals, objectives, and expected outcomes..."
                          className="w-full h-32 p-4 rounded-xl border-2 border-custom bg-card backdrop-blur-sm focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-300 text-primary placeholder:text-muted resize-none"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>
                  )}

                  {/* Public Option - only show when not in success state */}
                  {!success && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="p-6 bg-section rounded-2xl border border-custom"
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
                          className="w-6 h-6 text-accent bg-card border-2 border-custom rounded-lg focus:ring-accent focus:ring-2 transition-all duration-300"
                        />
                        {formData.is_public && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.div>
                      <div>
                        <label htmlFor="is_public" className="text-base font-semibold text-primary cursor-pointer">
                          Make this project public
                        </label>
                        <p className="text-sm text-secondary mt-1">
                          Public projects are visible to all users and can attract more collaborators
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  )}

                  {/* Action Buttons - only show when not in success state */}
                  {!success && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex justify-end space-x-4 pt-6 border-t border-custom"
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
                        className="px-8 py-3 rounded-xl bg-accent hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
                  )}
                </motion.form>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
