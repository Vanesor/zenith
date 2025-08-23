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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchTasks();
      checkUserPermissions();
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

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${id}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Circle className="w-4 h-4 text-gray-500" />;
      case 'active':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
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

  const handleTaskUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    // Optionally update project stats
    if (project) {
      const completedTasks = updatedTasks.filter(t => t.status === 'completed').length;
      const totalTasks = updatedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      setProject({
        ...project,
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        progress_percentage: progressPercentage
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Project Not Found</h1>
          <p className="text-secondary">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'to_do').length,
    review: tasks.filter(t => t.status === 'review').length,
  };

  return (
    <div className="min-h-screen bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-primary font-bold">
                    {project.project_key}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-primary">{project.name}</h1>
                    <p className="text-secondary">{project.club_name}</p>
                  </div>
                </div>
                <p className="text-secondary">{project.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {userPermissions?.canInviteMembers && (
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Invite</span>
                </Button>
              )}
              
              {userPermissions?.canEditProject && (
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Project Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Total Tasks</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.total}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">To Do</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.todo}</p>
                </div>
                <Circle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">In Progress</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.inProgress}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Review</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.review}</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Completed</p>
                  <p className="text-2xl font-bold text-primary">{taskStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="card">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 ml-auto text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{project.progress_percentage}%</div>
              <Progress value={project.progress_percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="card">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status & Priority</CardTitle>
              <Flag className="h-4 w-4 ml-auto text-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(project.status)}
                <Badge className="capitalize">{project.status.replace('_', ' ')}</Badge>
              </div>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority} priority
              </Badge>
            </CardContent>
          </Card>

          <Card className="card">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team & Timeline</CardTitle>
              <Users className="h-4 w-4 ml-auto text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-secondary space-y-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{project.member_count} members</span>
                </div>
                {project.target_end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due {new Date(project.target_end_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span className="font-mono text-xs">{project.access_password}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl shadow-lg"
        >
          <div className="p-6 border-b border-custom">
            <h2 className="text-2xl font-bold text-primary">Task Board</h2>
            <p className="text-secondary">Drag and drop tasks to update their status</p>
          </div>
          
          <KanbanBoard
            projectId={id as string}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            userPermissions={userPermissions}
          />
        </motion.div>

        {/* Invite Modal */}
        {showInviteModal && (
          <InviteMemberModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onMemberInvited={() => {
              fetchProjectDetails();
              setShowInviteModal(false);
            }}
            projectId={id as string}
          />
        )}
      </div>
    </div>
  );
}
