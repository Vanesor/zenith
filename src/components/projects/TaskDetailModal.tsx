"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Clock,
  Edit,
  Trash2,
  Tag,
  MessageSquare,
  Activity,
  CheckCircle2,
  Circle,
  PlayCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  userPermissions?: {
    canDeleteTasks: boolean;
    canEditTasks: boolean;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'to_do' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'bug';
  assignee_name?: string;
  assignee_id?: string;
  created_at: string;
  due_date?: string;
  task_key: string;
  estimated_hours?: number;
  reporter_name?: string;
}

export default function TaskDetailModal({ 
  isOpen, 
  onClose, 
  task, 
  onEdit, 
  onDelete, 
  userPermissions 
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  if (!task) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'to_do':
        return { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'To Do' };
      case 'in_progress':
        return { icon: PlayCircle, color: 'text-blue-500', bg: 'bg-blue-100', label: 'In Progress' };
      case 'review':
        return { icon: Eye, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'In Review' };
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Done' };
      default:
        return { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Low' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' };
      case 'high':
        return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'High' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'task':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Task' };
      case 'bug':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Bug' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);
  const typeConfig = getTypeConfig(task.type);
  const StatusIcon = statusConfig.icon;

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
            className="bg-zenith-card rounded-xl border border-zenith-border max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zenith-border">
              <div className="flex items-center space-x-3">
                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                <div>
                  <h2 className="text-xl font-semibold text-zenith-primary">{task.title}</h2>
                  <p className="text-sm text-zenith-muted">{task.task_key}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {userPermissions?.canEditTasks && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(task)}
                    className="border-zenith-border hover:bg-zenith-hover"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {userPermissions?.canDeleteTasks && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(task)}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-zenith-muted hover:text-zenith-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zenith-border">
              <div className="flex space-x-6 px-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'details'
                      ? 'border-zenith-brand text-zenith-brand'
                      : 'border-transparent text-zenith-secondary hover:text-zenith-primary'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activity'
                      ? 'border-zenith-brand text-zenith-brand'
                      : 'border-transparent text-zenith-secondary hover:text-zenith-primary'
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Main Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-medium text-zenith-primary mb-2">Description</h3>
                        <div className="bg-zenith-main rounded-lg p-4 border border-zenith-border">
                          <p className="text-zenith-secondary whitespace-pre-wrap">
                            {task.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Status */}
                      <div>
                        <h3 className="text-sm font-medium text-zenith-primary mb-2">Status</h3>
                        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Priority */}
                      <div>
                        <h3 className="text-sm font-medium text-zenith-primary mb-2">Priority</h3>
                        <Badge className={`${priorityConfig.bg} ${priorityConfig.color} border-0`}>
                          <Flag className="w-3 h-3 mr-1" />
                          {priorityConfig.label}
                        </Badge>
                      </div>

                      {/* Type */}
                      <div>
                        <h3 className="text-sm font-medium text-zenith-primary mb-2">Type</h3>
                        <Badge className={`${typeConfig.bg} ${typeConfig.color} border-0`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                      </div>

                      {/* Assignee */}
                      {task.assignee_name && (
                        <div>
                          <h3 className="text-sm font-medium text-zenith-primary mb-2">Assignee</h3>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {task.assignee_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-zenith-secondary">{task.assignee_name}</span>
                          </div>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <div>
                          <h3 className="text-sm font-medium text-zenith-primary mb-2">Due Date</h3>
                          <div className={`flex items-center space-x-2 ${isOverdue(task.due_date) ? 'text-red-600' : 'text-zenith-secondary'}`}>
                            {isOverdue(task.due_date) ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                            <span className="text-sm">{formatDate(task.due_date)}</span>
                            {isOverdue(task.due_date) && (
                              <Badge className="bg-red-100 text-red-600 border-0 text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Estimated Hours */}
                      {task.estimated_hours && (
                        <div>
                          <h3 className="text-sm font-medium text-zenith-primary mb-2">Estimated Hours</h3>
                          <div className="flex items-center space-x-2 text-zenith-secondary">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{task.estimated_hours}h</span>
                          </div>
                        </div>
                      )}

                      {/* Created */}
                      <div>
                        <h3 className="text-sm font-medium text-zenith-primary mb-2">Created</h3>
                        <div className="text-sm text-zenith-secondary">
                          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          {task.reporter_name && (
                            <div className="mt-1">by {task.reporter_name}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="text-center py-8 text-zenith-muted">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded yet</p>
                    <p className="text-xs mt-1">Activity tracking will be available soon</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
