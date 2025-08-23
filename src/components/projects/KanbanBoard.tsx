"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Flag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast as notify } from 'react-hot-toast';
import CreateTaskModal from './CreateTaskModal';

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
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface KanbanBoardProps {
  projectId: string;
  tasks?: Task[];
  onTaskUpdate?: (tasks: Task[]) => void;
  userPermissions?: {
    isOwner: boolean;
    canManageTeam: boolean;
    canDeleteTasks: boolean;
    canViewShareKeys: boolean;
    canEditProject: boolean;
  } | null;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'bug';
  assignee_id?: string;
  due_date?: string;
}

const columnConfig = {
  todo: {
    title: 'To Do',
    color: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
    headerColor: 'bg-gray-50 dark:bg-gray-700',
    icon: Circle,
    iconColor: 'text-gray-500'
  },
  in_progress: {
    title: 'In Progress', 
    color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600',
    headerColor: 'bg-blue-50 dark:bg-blue-900/50',
    icon: PlayCircle,
    iconColor: 'text-blue-500'
  },
  in_review: {
    title: 'In Review',
    color: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-600', 
    headerColor: 'bg-yellow-50 dark:bg-yellow-900/50',
    icon: Eye,
    iconColor: 'text-yellow-500'
  },
  done: {
    title: 'Done',
    color: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-600',
    headerColor: 'bg-green-50 dark:bg-green-900/50', 
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  }
};

export default function KanbanBoard({ projectId, tasks = [], onTaskUpdate, userPermissions }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('to_do');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    type: 'task',
    assignee_id: undefined,
    due_date: undefined
  });

  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    } else {
      loadTasks();
    }
    loadMembers();
  }, [projectId]); // Remove tasks dependency to prevent infinite loop

  // Separate effect for tasks prop updates
  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLocalTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    return localTasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 border-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600';
      case 'medium':
        return 'bg-blue-500 border-blue-600';
      case 'low':
        return 'bg-gray-500 border-gray-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'bug' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && dueDate !== new Date().toISOString().split('T')[0];
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/tasks/${draggedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTasks = tasks.map(task => 
          task.id === draggedTask.id 
            ? { ...task, status: newStatus as Task['status'] }
            : task
        );
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks);
        } else {
          // Update local state if callback not provided
          setLocalTasks(updatedTasks);
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }

    setDraggedTask(null);
  };

  const handleCreateTask = (columnStatus: string) => {
    setSelectedColumn(columnStatus);
    setShowCreateModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    // Add the new task to local state
    setLocalTasks(prevTasks => [...prevTasks, newTask]);
    setShowCreateModal(false);
    notify.success('Task created successfully!');
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(columnConfig).map(([status, config]) => {
          const columnTasks = getTasksByStatus(status);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border-2 ${config.color} min-h-[600px] flex flex-col`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className={`${config.headerColor} p-4 rounded-t-lg border-b-2 border-zenith-border`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                    <h3 className="font-semibold text-zenith-primary">{config.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-zenith-main text-zenith-secondary border border-zenith-border">
                    {columnTasks.length}
                  </Badge>
                </div>
                
                {/* Only show create task button in "To Do" column */}
                {status === 'todo' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="w-full text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover border-2 border-dashed border-zenith-border hover:border-zenith-brand"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <AnimatePresence>
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-grab active:cursor-grabbing"
                      draggable="true"
                      onDragStart={(e: any) => handleDragStart(e, task)}
                    >
                                            <Card className={`bg-zenith-card shadow-sm hover:shadow-md transition-shadow duration-200 border ${
                        isOverdue(task.due_date) 
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
                          : 'border-zenith-border'
                      }`}>
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={getTypeColor(task.type)}
                                >
                                  {task.type}
                                </Badge>
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              </div>
                              <h4 className="font-medium text-sm text-zenith-primary line-clamp-2">
                                {task.title}
                              </h4>
                              <p className="text-xs text-zenith-muted mt-1">{task.task_key}</p>
                            </div>
                            
                            {/* Task Actions */}
                            <details className="relative">
                              <summary className="list-none cursor-pointer p-1">
                                <MoreVertical className="w-4 h-4 text-zenith-muted hover:text-zenith-primary" />
                              </summary>
                              <div className="absolute right-0 top-6 w-32 bg-zenith-card border border-zenith-border rounded-md shadow-lg z-50">
                                <button className="flex items-center w-full px-3 py-2 text-xs text-zenith-primary hover:bg-zenith-hover">
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </button>
                                {userPermissions?.canDeleteTasks && (
                                  <button className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </details>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-3 pt-0">
                          {task.description && (
                            <p className="text-xs text-zenith-secondary mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="space-y-2">
                            {task.assignee_name && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    {task.assignee_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-zenith-secondary truncate">
                                  {task.assignee_name}
                                </span>
                              </div>
                            )}
                            
                            {task.due_date && (
                              <div className={`flex items-center space-x-1 ${isOverdue(task.due_date) ? 'text-red-600' : 'text-zenith-secondary'}`}>
                                {isOverdue(task.due_date) ? (
                                  <AlertTriangle className="w-3 h-3" />
                                ) : (
                                  <Calendar className="w-3 h-3" />
                                )}
                                <span className="text-xs">
                                  {formatDate(task.due_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-zenith-muted">
                    <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {config.title.toLowerCase()} tasks</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
