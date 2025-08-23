"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, User, Flag, AlertCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: any) => void;
  projectId: string;
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, projectId }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProjectMembers();
    }
  }, [isOpen, projectId]);

  const fetchProjectMembers = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          assignee_id: formData.assignee_id || null,
          due_date: formData.due_date || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onTaskCreated(data);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          assignee_id: '',
          due_date: '',
        });
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (error) {
      setError('Failed to create task');
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
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modern Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50, rotateX: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <div className="bg-white dark:bg-gray-900 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="relative px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Task
                  </h2>
                  <p className="zenith-text-secondary mt-1">
                    Add a new task to track project progress
                  </p>
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full zenith-bg-card hover:bg-red-50 dark:hover:bg-red-900/20 border zenith-border transition-colors"
                >
                  <X className="w-5 h-5 zenith-text-secondary" />
                </motion.button>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500"></div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-h-[calc(90vh-100px)] overflow-y-auto">
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
                    className="flex items-center space-x-3 p-4 zenith-bg-section border border-red-200 dark:border-red-800 rounded-2xl"
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
                <div className="space-y-6">
                  {/* Task Title */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-semibold zenith-text-secondary flex items-center">
                      <Target className="w-4 h-4 mr-2 text-orange-600" />
                      Task Title *
                    </label>
                    <div className="relative group">
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter a clear, actionable task title..."
                        className="h-12 pl-12 pr-4 rounded-xl border-2 zenith-border zenith-bg-card backdrop-blur-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 group-hover:border-gray-300 dark:group-hover:border-gray-500"
                        required
                      />
                      <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 zenith-text-muted group-focus-within:text-orange-500 transition-colors w-4 h-4" />
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-semibold zenith-text-secondary">
                      Task Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the task requirements, objectives, and expected deliverables..."
                      className="w-full h-32 p-4 rounded-xl border-2 zenith-border zenith-bg-card backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 zenith-text-primary placeholder:zenith-text-muted resize-none"
                      required
                    />
                  </motion.div>

                  {/* Task Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Priority */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-semibold zenith-text-secondary flex items-center">
                        <Flag className="w-4 h-4 mr-2 text-red-600" />
                        Priority
                      </label>
                      <div className="relative group">
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full h-12 pl-12 pr-4 rounded-xl border-2 zenith-border zenith-bg-card backdrop-blur-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 zenith-text-primary appearance-none cursor-pointer"
                        >
                          <option value="low">🟢 Low Priority</option>
                          <option value="medium">🟡 Medium Priority</option>
                          <option value="high">🟠 High Priority</option>
                          <option value="critical">🔴 Critical</option>
                        </select>
                        <Flag className="absolute left-4 top-1/2 transform -translate-y-1/2 zenith-text-muted group-focus-within:text-red-500 transition-colors w-4 h-4 pointer-events-none" />
                        <motion.div
                          animate={{ rotate: formData.priority ? 180 : 0 }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Assignee */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        Assignee
                      </label>
                      <div className="relative group">
                        <select
                          name="assignee_id"
                          value={formData.assignee_id}
                          onChange={handleChange}
                          className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-900 dark:text-primary appearance-none cursor-pointer"
                        >
                          <option value="">👤 Unassigned</option>
                          {projectMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              👨‍💻 {member.name}
                            </option>
                          ))}
                        </select>
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-4 h-4 pointer-events-none" />
                      </div>
                    </motion.div>

                    {/* Due Date */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        Due Date
                      </label>
                      <div className="relative group">
                        <Input
                          name="due_date"
                          type="date"
                          value={formData.due_date}
                          onChange={handleChange}
                          className="h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300"
                        />
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors w-4 h-4 pointer-events-none" />
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
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
                      disabled={loading || !formData.title || !formData.description}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 hover:from-orange-700 hover:via-red-700 hover:to-purple-700 text-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? (
                        <motion.div className="flex items-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                          />
                          Creating Task...
                        </motion.div>
                      ) : (
                        <div className="flex items-center">
                          <Plus className="w-5 h-5 mr-2" />
                          Create Task
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
