"use client";

import { motion } from 'framer-motion';
import { 
  Calendar, 
  User,
  Flag,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_name?: string;
  assignee_id?: string;
  created_at: string;
  due_date?: string;
  task_key: string;
}

interface TaskCardProps {
  task: Task;
  getStatusIcon: (status: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  onTaskUpdate: () => void;
  userPermissions: any;
}

export function TaskCard({ 
  task, 
  getStatusIcon, 
  getPriorityColor, 
  onTaskUpdate, 
  userPermissions 
}: TaskCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'done';

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {task.task_key}
              </span>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            
            <details className="relative">
              <summary className="list-none cursor-pointer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </summary>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {userPermissions?.canEditTasks && (
                  <button
                    className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      // Handle edit action
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </button>
                )}
                {userPermissions?.canAssignTasks && (
                  <button
                    className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      // Handle assign action
                    }}
                  >
                    <UserPlus className="mr-2 h-3 w-3" />
                    Assign
                  </button>
                )}
                {userPermissions?.canDeleteTasks && (
                  <button
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      // Handle delete action
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </details>
          </div>

          <h4 className="font-medium text-gray-900 dark:text-primary mb-2 line-clamp-2">
            {task.title}
          </h4>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <Badge className={getPriorityColor(task.priority)}>
              <Flag className="w-3 h-3 mr-1" />
              {task.priority}
            </Badge>
            
            {userPermissions?.canEditTasks && (
              <select 
                className={`${getStatusBadgeColor(task.status)} cursor-pointer hover:opacity-80 border-0 rounded px-2 py-1 text-xs`}
                value={task.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{task.assignee_name || 'Unassigned'}</span>
            </div>
            
            {task.due_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TaskCard;
