"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  task: {
    title: string;
    task_key: string;
    type: 'task' | 'bug';
  } | null;
}

export default function DeleteTaskModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  task 
}: DeleteTaskModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zenith-card rounded-xl border border-zenith-border max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zenith-primary">Delete Task</h3>
                    <p className="text-sm text-zenith-muted">This action cannot be undone</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="text-zenith-muted hover:text-zenith-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Task Info */}
              <div className="bg-zenith-main rounded-lg p-4 border border-zenith-border mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-zenith-primary mb-1">{task.title}</h4>
                    <p className="text-xs text-zenith-muted">{task.task_key}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      task.type === 'bug' 
                        ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {task.type}
                  </Badge>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-400">
                    <p className="font-medium mb-1">Are you sure you want to delete this task?</p>
                    <ul className="text-xs space-y-1 text-red-600 dark:text-red-400">
                      <li>• All task data will be permanently deleted</li>
                      <li>• This action cannot be undone</li>
                      <li>• Task assignee will be notified</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="border-zenith-border hover:bg-zenith-hover"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
