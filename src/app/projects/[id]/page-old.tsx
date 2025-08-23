"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Plus,
  Settings,
  Mail,
  Key,
  MoreVertical,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  Clock,
  Flag,
  User,
  Edit,
  Eye
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import KanbanBoard from '@/components/projects/KanbanBoard';
import InviteMemberModal from '@/components/projects/InviteMemberModal';

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
}

interface Project {
  id: string;
  name: string;
  description: string;
  project_key: string;
  club_name: string;
  creator_name: string;
  status: string;
  priority: string;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  member_count: number;
  created_at: string;
  target_end_date?: string;
  access_password?: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchTasks();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setUserPermissions(data.permissions);
      } else if (response.status === 404) {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.task_key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Circle className="w-4 h-4 text-gray-500" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'in_review':
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    in_review: filteredTasks.filter(t => t.status === 'in_review'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-primary">Project not found</h1>
            <Link href="/projects">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                    {project.project_key}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-primary">
                      {project.name}
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {project.club_name} • Created by {project.creator_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {userPermissions?.canInviteMembers && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="outline"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              )}
              {project.access_password && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(project.access_password || '')}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Copy Key
                </Button>
              )}
              {userPermissions?.canCreateTasks && (
                <Button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Project Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-primary">{project.progress_percentage}%</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={project.progress_percentage} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-primary">
                    {project.completed_tasks}/{project.total_tasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-primary">{project.member_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-primary">
                    {project.target_end_date 
                      ? new Date(project.target_end_date).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-primary">
                    Task Board
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Manage and track your project tasks
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* To Do Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Circle className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-primary">To Do</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus.todo.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {tasksByStatus.todo.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard 
                      task={task} 
                      getStatusIcon={getStatusIcon}
                      getPriorityColor={getPriorityColor}
                      onTaskUpdate={fetchTasks}
                      userPermissions={userPermissions}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PlayCircle className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-primary">In Progress</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus.in_progress.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {tasksByStatus.in_progress.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard 
                      task={task} 
                      getStatusIcon={getStatusIcon}
                      getPriorityColor={getPriorityColor}
                      onTaskUpdate={fetchTasks}
                      userPermissions={userPermissions}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* In Review Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PauseCircle className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-primary">In Review</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus.in_review.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {tasksByStatus.in_review.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard 
                      task={task} 
                      getStatusIcon={getStatusIcon}
                      getPriorityColor={getPriorityColor}
                      onTaskUpdate={fetchTasks}
                      userPermissions={userPermissions}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Done Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-primary">Done</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus.done.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {tasksByStatus.done.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard 
                      task={task} 
                      getStatusIcon={getStatusIcon}
                      getPriorityColor={getPriorityColor}
                      onTaskUpdate={fetchTasks}
                      userPermissions={userPermissions}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {showCreateTaskModal && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={() => {
            setShowCreateTaskModal(false);
            fetchTasks();
            fetchProjectDetails();
          }}
          projectId={id as string}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onMemberInvited={() => {
            setShowInviteModal(false);
            fetchProjectDetails();
          }}
          projectId={id as string}
        />
      )}
    </div>
  );
}
