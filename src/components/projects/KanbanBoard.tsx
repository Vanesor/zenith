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
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast as notify } from 'react-hot-toast';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';

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
  projectDueDate?: string; // Add project due date prop
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
    color: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 dark:from-slate-800 dark:to-slate-900 dark:border-slate-600',
    headerColor: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800',
    icon: Circle,
    iconColor: 'text-slate-500'
  },
  in_progress: {
    title: 'In Progress', 
    color: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-600',
    headerColor: 'bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50',
    icon: PlayCircle,
    iconColor: 'text-blue-500'
  },
  in_review: {
    title: 'In Review',
    color: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-600', 
    headerColor: 'bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-900/50 dark:to-yellow-900/50',
    icon: Eye,
    iconColor: 'text-amber-500'
  },
  done: {
    title: 'Done',
    color: 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300 dark:from-emerald-900/30 dark:to-green-900/30 dark:border-emerald-600',
    headerColor: 'bg-gradient-to-r from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-900/50', 
    icon: CheckCircle2,
    iconColor: 'text-emerald-500'
  }
};

export default function KanbanBoard({ projectId, tasks = [], onTaskUpdate, userPermissions, projectDueDate }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('to_do');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);
  
  // New modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      setIsDragOver(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    setIsDragOver(null);
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistically update UI first
    const updatedTasks = localTasks.map(task => 
      task.id === draggedTask.id 
        ? { ...task, status: newStatus as Task['status'] }
        : task
    );
    setLocalTasks(updatedTasks);

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
        // If callback provided, also update parent state
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks);
        }
        notify.success('Task status updated successfully!');
      } else {
        // Revert optimistic update on failure
        setLocalTasks(localTasks);
        notify.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on failure
      setLocalTasks(localTasks);
      notify.error('Error updating task status');
    }

    setDraggedTask(null);
  };

  const handleCreateTask = (columnStatus: string) => {
    setSelectedColumn(columnStatus);
    setShowCreateModal(true);
  };

  const handleTaskCreated = (taskData: any) => {
    // Extract the task from the response data
    const newTask = taskData.task || taskData;
    
    // Add the new task to local state immediately (optimistic update)
    setLocalTasks(prevTasks => [...prevTasks, newTask]);
    
    // Also update parent state if callback provided
    if (onTaskUpdate) {
      onTaskUpdate([...localTasks, newTask]);
    }
    
    setShowCreateModal(false);
    notify.success('Task created successfully!');
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!userPermissions?.canDeleteTasks) {
      notify.error('You do not have permission to delete tasks');
      return;
    }

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state immediately
        const updatedTasks = localTasks.filter(task => task.id !== taskId);
        setLocalTasks(updatedTasks);
        
        // Also update parent state if callback provided
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks);
        }
        
        notify.success('Task deleted successfully!');
      } else {
        notify.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notify.error('Error deleting task');
    }
  };

  // New modal handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = localTasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setLocalTasks(updatedTasks);
    
    if (onTaskUpdate) {
      onTaskUpdate(updatedTasks);
    }
    
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await handleDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-16rem)] max-h-[calc(100vh-16rem)] overflow-hidden">
        {Object.entries(columnConfig).map(([status, config]) => {
          const columnTasks = getTasksByStatus(status);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border-2 ${config.color} flex flex-col transition-all duration-200 h-full max-h-full ${
                isDragOver === status ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header - Fixed Height */}
              <div className={`${config.headerColor} p-4 rounded-t-lg border-b-2 border-zenith-border flex-shrink-0`}>
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

              {/* Tasks - Scrollable Container */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full max-h-full p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zenith-border scrollbar-track-transparent hover:scrollbar-thumb-zenith-muted">
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
                      <Card 
                        className={`bg-zenith-card shadow-lg hover:shadow-xl transition-all duration-300 border-2 group transform hover:scale-105 ${
                          isOverdue(task.due_date) 
                            ? 'border-red-400 bg-red-50/80 dark:bg-red-950/40 shadow-red-200 dark:shadow-red-900/50' 
                            : 'border-zenith-border hover:border-blue-400 shadow-blue-100 dark:shadow-blue-900/20'
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`${getTypeColor(task.type)} font-medium px-2 py-1 text-xs`}
                                  >
                                    {task.type}
                                  </Badge>
                                  <div className={`w-3 h-3 rounded-full shadow-sm ${getPriorityColor(task.priority)}`} />
                                </div>
                                <span className="text-xs text-zenith-muted font-mono bg-zenith-accent px-2 py-1 rounded">
                                  {task.task_key}
                                </span>
                              </div>
                              <h4 className="font-semibold text-sm text-zenith-primary line-clamp-2 mb-2 leading-relaxed">
                                {task.title}
                              </h4>
                            </div>
                            
                            {/* Task Actions Dropdown */}
                            <div className="relative">
                              <details className="group/dropdown">
                                <summary 
                                  className="list-none cursor-pointer p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg hover:bg-zenith-accent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4 text-zenith-muted hover:text-zenith-primary" />
                                </summary>
                                <div className="absolute right-0 top-8 w-44 bg-zenith-card border border-zenith-border rounded-xl shadow-xl z-50 overflow-hidden">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskClick(task);
                                    }}
                                    className="flex items-center w-full px-4 py-3 text-sm text-zenith-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  >
                                    <FileText className="w-4 h-4 mr-3 text-blue-500" />
                                    View Details
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="flex items-center w-full px-4 py-3 text-sm text-zenith-primary hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  >
                                    <Edit className="w-4 h-4 mr-3 text-green-500" />
                                    Edit Task
                                  </button>
                                  {userPermissions?.canDeleteTasks && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(task);
                                      }}
                                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-zenith-border"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" />
                                      Delete Task
                                    </button>
                                  )}
                                </div>
                              </details>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0">
                          {/* Compact description - only show if short */}
                          {task.description && task.description.length <= 80 && (
                            <p className="text-xs text-zenith-secondary mb-4 line-clamp-2 bg-zenith-accent/50 p-2 rounded-lg italic">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="space-y-3">
                            {/* Assignee */}
                            {task.assignee_name && (
                              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                <Avatar className="w-6 h-6 border-2 border-blue-200 dark:border-blue-700">
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                    {task.assignee_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">
                                  {task.assignee_name}
                                </span>
                              </div>
                            )}
                            
                            {/* Due Date */}
                            {task.due_date && (
                              <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                                isOverdue(task.due_date) 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              }`}>
                                {isOverdue(task.due_date) ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Calendar className="w-4 h-4" />
                                )}
                                <span className="text-xs font-medium">
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
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowCreateModal(false)}
          projectDueDate={projectDueDate}
        />
      )}

      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
        userPermissions={{
          canDeleteTasks: userPermissions?.canDeleteTasks || false,
          canEditTasks: true // Assuming all users can edit tasks
        }}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectId={projectId}
        onTaskUpdated={handleTaskUpdated}
      />

      <DeleteTaskModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        task={taskToDelete ? {
          title: taskToDelete.title,
          task_key: taskToDelete.task_key,
          type: taskToDelete.type
        } : null}
      />
    </div>
  );
}
