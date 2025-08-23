"use client";

import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description: string;
  project_key: string;
  club_name: string;
  creator_name: string;
  created_by: string;
  status: string;
  priority: string;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  member_count: number;
  created_at: string;
  target_end_date?: string;
}

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  getStatusIcon: (status: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  onProjectUpdate?: () => void;
  currentUserId?: string;
}

export default function ProjectCard({ project, viewMode, getStatusIcon, getPriorityColor, onProjectUpdate, currentUserId }: ProjectCardProps) {
  const isProjectCreator = currentUserId === project.created_by;

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onProjectUpdate?.();
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isOverdue = project.target_end_date && 
    new Date(project.target_end_date) < new Date() && 
    project.status !== 'completed';

  if (viewMode === 'list') {
    return (
      <Card className="card hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {project.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Link href={`/projects/${project.id}`}>
                    <h3 className="text-lg font-semibold text-primary hover:text-blue-600 transition-colors cursor-pointer truncate">
                      {project.name}
                    </h3>
                  </Link>
                  {isOverdue && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Overdue
                    </Badge>
                  )}
                </div>
                <p className="text-secondary text-sm truncate">
                  {project.description}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-muted">
                    {project.club_name} • Created by {project.creator_name}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(project.status)}
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-muted" />
                  <span className="text-sm text-secondary">
                    {project.member_count} members
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-muted" />
                  <span className="text-sm text-secondary">
                    {project.completed_tasks}/{project.total_tasks} tasks
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{project.completed_tasks}</span>
                </div>
                <div className="text-xs text-gray-400">/</div>
                <div className="flex items-center space-x-1 text-blue-600">
                  <Circle className="h-4 w-4" />
                  <span className="text-sm font-medium">{project.total_tasks}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
                {isProjectCreator && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteProject}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="card hover:shadow-xl transition-all duration-300 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {project.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-primary line-clamp-1">
                  <Link href={`/projects/${project.id}`} className="hover:text-blue-600 transition-colors">
                    {project.name}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs text-muted">
                  {project.club_name} • By {project.creator_name}
                </CardDescription>
              </div>
            </div>
            
            {isProjectCreator && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeleteProject}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-secondary text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(project.status)}
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
          
          {isOverdue && (
            <div className="mb-4">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <Clock className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-secondary">Tasks:</span>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {project.total_tasks} total
                  </div>
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {project.completed_tasks} done
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-muted" />
                <span className="text-secondary">
                  {project.completed_tasks}/{project.total_tasks} completed
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-muted" />
                <span className="text-secondary">
                  {project.member_count} members
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-custom">
              <span>Created {formatDate(project.created_at)}</span>
              {project.target_end_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due {formatDate(project.target_end_date)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
