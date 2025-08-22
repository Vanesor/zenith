"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  MoreVertical,
  ExternalLink,
  Settings,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  getStatusIcon: (status: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  onProjectUpdate?: () => void;
}

export default function ProjectCard({ project, viewMode, getStatusIcon, getPriorityColor, onProjectUpdate }: ProjectCardProps) {
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    checkPermissions();
  }, [project.id]);

  const checkPermissions = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/projects/${project.id}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                  {project.project_key}
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
                    {project.club_name}
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
              
              <div className="w-20">
                <div className="text-xs text-muted mb-1 text-center">
                  {project.progress_percentage}%
                </div>
                <Progress value={project.progress_percentage} className="h-2" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}`} className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {permissions?.canEditProject && (
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage
                    </DropdownMenuItem>
                  )}
                  {permissions?.canDeleteProject && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={handleDeleteProject}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-primary font-bold">
                {project.project_key}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-primary line-clamp-1">
                  <Link href={`/projects/${project.id}`} className="hover:text-blue-600 transition-colors">
                    {project.name}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs text-muted">
                  {project.club_name}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-custom">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`} className="flex items-center text-primary hover:bg-accent">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-primary hover:bg-accent">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-secondary">Progress</span>
                <span className="font-medium text-primary">
                  {project.progress_percentage}%
                </span>
              </div>
              <Progress value={project.progress_percentage} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-muted" />
                <span className="text-secondary">
                  {project.completed_tasks}/{project.total_tasks} tasks
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
