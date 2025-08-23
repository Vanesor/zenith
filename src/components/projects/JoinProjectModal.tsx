"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface JoinProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinProjectModal({ isOpen, onClose }: JoinProjectModalProps) {
  const [projectKey, setProjectKey] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey.trim()) {
      setError('Please enter a project key');
      return;
    }
    if (!accessPassword.trim()) {
      setError('Please enter the access password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/projects/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          projectKey: projectKey.trim(),
          accessPassword: accessPassword.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully joined project: ${data.project.name}`);
        setTimeout(() => {
          onClose();
          // Optionally redirect to the project
          window.location.href = `/projects/${data.project.id}`;
        }, 2000);
      } else {
        setError(data.error || 'Failed to join project');
      }
    } catch (error) {
      setError('Failed to join project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            initial={{ opacity: 0, scale: 0.8, y: 50, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50, rotateY: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg"
          >
            {/* <div className="bg-gradient-to-br from-white/95 via-white/90 to-blue-50/90 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-blue-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden"> */}
            <div className="zenith-bg-card backdrop-blur-xl border zenith-border rounded-3xl shadow-2xl overflow-hidden">
              
              {/* Header with gradient */}
              <div className="relative px-8 py-6 zenith-bg-section">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center space-x-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", damping: 15 }}
                      className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 rounded-xl flex items-center justify-center"
                    >
                      <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                        Join Project
                      </h2>
                      <p className="zenith-text-secondary text-sm">
                        Enter the access code to collaborate
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-full zenith-bg-hover hover:zenith-bg-hover transition-colors"
                  >
                    <X className="w-5 h-5 zenith-text-muted" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 zenith-bg-card">
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
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

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </motion.div>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">{success}</span>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Project Key Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <Key className="w-4 h-4 mr-2 text-blue-600" />
                        Project Key
                      </label>
                      
                      <div className="relative group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg"
                        />
                        <div className="relative">
                          <Input
                            value={projectKey}
                            onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                            placeholder="PROJEX123"
                            className="h-14 text-center font-mono text-lg tracking-widest bg-main backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                            disabled={loading}
                            autoFocus
                          />
                          <motion.div
                            animate={{ 
                              opacity: projectKey ? 1 : 0.5,
                              scale: projectKey ? 1.1 : 1 
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2"
                          >
                            <Key className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Access Password Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <Key className="w-4 h-4 mr-2 text-purple-600" />
                        Access Password
                      </label>
                      
                      <div className="relative group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-2xl blur-lg"
                        />
                        <div className="relative">
                          <Input
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value.toUpperCase())}
                            placeholder="PROJUSERXXXX"
                            className="h-14 text-center font-mono text-lg tracking-widest bg-main backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                            disabled={loading}
                          />
                          <motion.div
                            animate={{ 
                              opacity: accessPassword ? 1 : 0.5,
                              scale: accessPassword ? 1.1 : 1 
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2"
                          >
                            <Key className="w-5 h-5 text-purple-400" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-gray-600 dark:text-gray-400 text-center"
                    >
                      Ask your project coordinator for both the project key and access password
                    </motion.p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-end space-x-4 pt-6"
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
                        disabled={loading || !projectKey.trim() || !accessPassword.trim()}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {loading ? (
                          <motion.div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            />
                            Joining Project...
                          </motion.div>
                        ) : (
                          <div className="flex items-center text-primary">
                            <UserPlus className="w-5 h-5 mr-2" />
                            Join Project
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>

                {/* Info Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-xl"
                      >
                        💡
                      </motion.div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          How it works
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          Project coordinators generate unique access codes that team members can use to join projects. 
                          Once you enter the correct code, you'll instantly become part of the team!
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
