"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  Eye,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    user_id: string;
  };
  project: {
    created_by: string;
  };
  currentUserId?: string;
  userPermissions?: {
    canManageTeam: boolean;
  };
  onManage: (memberId: string) => void;
  onRemove: (memberId: string) => void;
  managingMemberId: string | null;
  onCancelManage: () => void;
  onUpdateRole: (memberId: string, role: string) => void;
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  status: 'to_do' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
}

export default function TeamMemberCard({
  member,
  project,
  currentUserId,
  userPermissions,
  onManage,
  onRemove,
  managingMemberId,
  onCancelManage,
  onUpdateRole,
  projectId
}: TeamMemberCardProps) {
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssignedTasks();
  }, [member.id, projectId]);

  const loadAssignedTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(
        `/api/projects/${projectId}/tasks?assignee_id=${member.user_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignedTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading assigned tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusStats = () => {
    const stats = {
      total: assignedTasks.length,
      completed: assignedTasks.filter(t => t.status === 'completed').length,
      in_progress: assignedTasks.filter(t => t.status === 'in_progress').length,
      overdue: assignedTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length
    };
    return stats;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 text-blue-500" />;
      default:
        return <FileText className="w-3 h-3 text-gray-500" />;
    }
  };

  const stats = getTaskStatusStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="bg-zenith-main border-zenith-border hover:shadow-md transition-all duration-200 hover:border-zenith-brand">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zenith-primary">{member.name}</p>
                  <p className="text-xs text-zenith-secondary">{member.email}</p>
                </div>
              </div>
              
              {/* Member badges */}
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' :
                    member.role === 'member' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {member.role}
                </Badge>
                <Badge 
                  variant="outline"
                  className={`text-xs ${
                    member.status === 'joined' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' :
                    member.status === 'invited' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {member.status}
                </Badge>
                {member.user_id === project.created_by && (
                  <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400">
                    Creator
                  </Badge>
                )}
              </div>

              {/* Task Statistics */}
              <div className="bg-zenith-card rounded-lg p-3 border border-zenith-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zenith-primary">Assigned Tasks</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.total}
                  </Badge>
                </div>
                
                {stats.total > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-zenith-secondary">Completed</span>
                      </div>
                      <span className="font-medium text-zenith-primary">{stats.completed}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-zenith-secondary">In Progress</span>
                      </div>
                      <span className="font-medium text-zenith-primary">{stats.in_progress}</span>
                    </div>
                    
                    {stats.overdue > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-red-600">Overdue</span>
                        </div>
                        <span className="font-medium text-red-600">{stats.overdue}</span>
                      </div>
                    )}

                    {/* Recent Tasks Preview */}
                    <div className="mt-2 pt-2 border-t border-zenith-border">
                      <span className="text-xs font-medium text-zenith-muted mb-1 block">Recent Tasks</span>
                      <div className="space-y-1">
                        {assignedTasks.slice(0, 2).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-xs">
                            {getStatusIcon(task.status)}
                            <span className="flex-1 truncate text-zenith-secondary">
                              {task.title}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === 'critical' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-orange-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <User className="w-6 h-6 mx-auto mb-1 text-zenith-muted opacity-50" />
                    <p className="text-xs text-zenith-muted">No assigned tasks</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Management Actions */}
            <div className="ml-3">
              {managingMemberId === member.id ? (
                <div className="flex flex-col gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="px-2 py-1 border border-zenith-border rounded bg-zenith-main text-zenith-primary text-xs"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {userPermissions?.canManageTeam && <option value="owner">Owner</option>}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelManage}
                    className="border-zenith-border hover:bg-zenith-hover text-xs h-7"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Task Details Button */}
                  {stats.total > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zenith-border hover:bg-zenith-hover text-xs h-7"
                      title="View all assigned tasks"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Tasks
                    </Button>
                  )}
                  
                  {userPermissions?.canManageTeam && member.user_id !== currentUserId && member.user_id !== project.created_by && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onManage(member.id)}
                        className="border-zenith-border hover:bg-zenith-hover text-xs h-7"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 text-xs h-7"
                        onClick={() => onRemove(member.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
