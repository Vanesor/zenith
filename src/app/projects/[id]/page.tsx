'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast as notify } from 'react-hot-toast';
import { 
  Users, 
  Settings, 
  Key, 
  Copy, 
  Mail, 
  UserPlus, 
  Calendar,
  CheckCircle,
  Target,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import KanbanBoard from '@/components/projects/KanbanBoard';
import TeamMemberCard from '@/components/projects/TeamMemberCard';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  project_key: string;
  access_password: string;
  created_by: string;
  creator_name: string;
  total_tasks: number;
  completed_tasks: number;
  member_count: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  created_at: string;
  target_end_date?: string;
  invite_key?: string;
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'joined' | 'invited' | 'pending';
  joined_at?: string;
  permissions?: {
    can_delete_tasks: boolean;
    can_manage_team: boolean;
    can_view_share_keys: boolean;
    can_edit_project: boolean;
  };
}

interface ProjectPermissions {
  isOwner: boolean;
  canManageTeam: boolean;
  canDeleteTasks: boolean;
  canViewShareKeys: boolean;
  canEditProject: boolean;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [userPermissions, setUserPermissions] = useState<ProjectPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null);

  const tabButtons = [
    { id: 'board', label: 'Kanban Board' },
    { id: 'team', label: 'Team & Timeline' },
    { id: 'share', label: 'Share Keys' },
    { id: 'settings', label: 'Settings' }
  ];

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId && user) {
      loadProject();
      loadMembers();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (project && user) {
      calculateUserPermissions();
    }
  }, [project, user, members]);

  const calculateUserPermissions = () => {
    if (!project || !user) return;
    
    const isOwner = project.created_by === user.id;
    const currentMember = members.find(m => m.user_id === user.id);
    
    setUserPermissions({
      isOwner,
      canManageTeam: isOwner || currentMember?.role === 'admin',
      canDeleteTasks: isOwner || currentMember?.permissions?.can_delete_tasks || false,
      canViewShareKeys: isOwner || currentMember?.permissions?.can_view_share_keys || false,
      canEditProject: isOwner || currentMember?.role === 'admin'
    });
  };

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const projectData = data.project || data;
        setProject(projectData);
        setEditDescription(projectData.description || '');
        setProjectDueDate(projectData.target_end_date || '');
      } else {
        notify.error('Failed to load project');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      notify.error('Error loading project');
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
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      notify.error('Please enter an email address');
      return;
    }

    if (!userPermissions?.canManageTeam) {
      notify.error('You do not have permission to invite members');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (response.ok) {
        notify.success('Invitation sent successfully');
        setInviteEmail('');
        loadMembers();
      } else {
        const errorData = await response.json();
        notify.error(errorData.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      notify.error('Error sending invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!userPermissions?.canManageTeam) {
      notify.error('You do not have permission to remove members');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        notify.success('Member removed successfully');
        loadMembers();
      } else {
        notify.error('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      notify.error('Error removing member');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!userPermissions?.canManageTeam) {
      notify.error('You do not have permission to change member roles');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        notify.success('Member role updated successfully');
        loadMembers();
        setManagingMemberId(null);
      } else {
        notify.error('Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      notify.error('Error updating member role');
    }
  };

  const handleUpdateProjectDescription = async () => {
    if (!userPermissions?.canEditProject) {
      notify.error('You do not have permission to edit this project');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ description: editDescription })
      });

      if (response.ok) {
        notify.success('Project description updated');
        setProject(prev => prev ? { ...prev, description: editDescription } : null);
        setIsEditingDescription(false);
      } else {
        notify.error('Failed to update description');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      notify.error('Error updating description');
    }
  };

    const handleUpdateProjectDueDate = async () => {
    if (!userPermissions?.canEditProject) {
      notify.error('You do not have permission to edit this project');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ target_end_date: projectDueDate })
      });

      if (response.ok) {
        notify.success('Due date updated successfully');
        setProject(prev => prev ? { ...prev, target_end_date: projectDueDate } : null);
        setIsEditingDueDate(false);
      } else {
        notify.error('Failed to update due date');
      }
    } catch (error) {
      console.error('Error updating due date:', error);
      notify.error('Error updating due date');
    }
  };

  const handleUpdateProjectStatus = async (newStatus: string) => {
    if (!userPermissions?.canEditProject) {
      notify.error('You do not have permission to edit this project');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        notify.success('Project status updated successfully');
        setProject(prev => prev ? { ...prev, status: newStatus as any } : null);
      } else {
        notify.error('Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      notify.error('Error updating project status');
    }
  };

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${label} copied to clipboard`);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      notify.error('Failed to copy to clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zenith-main">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenith-brand mx-auto"></div>
          <p className="mt-4 text-zenith-secondary">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zenith-main">
        <div className="text-center">
          <p className="text-xl font-semibold text-zenith-primary">Project not found</p>
          <p className="text-zenith-secondary">The project you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  // Only show share keys tab if user has permission
  const availableTabs = tabButtons.filter(tab => {
    if (tab.id === 'share') {
      return userPermissions?.canViewShareKeys;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zenith-main">
      <div className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="bg-zenith-card rounded-xl border border-zenith-border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zenith-primary">{project.name}</h1>
              <p className="text-zenith-secondary mt-2">{project.description || 'No description available'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-zenith-secondary">Progress</span>
                </div>
                <p className="text-xl font-bold text-zenith-primary">
                  {project.completed_tasks || 0}/{project.total_tasks || 0}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-zenith-secondary">Members</span>
                </div>
                <p className="text-xl font-bold text-zenith-primary">{members.length}</p>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-zenith-border">
            <nav className="-mb-px flex space-x-8">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-zenith-brand text-zenith-brand'
                      : 'border-transparent text-zenith-secondary hover:text-zenith-primary hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'board' && (
            <KanbanBoard 
              projectId={projectId} 
              userPermissions={userPermissions}
              projectDueDate={project?.target_end_date}
            />
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Invite Members - Only show if user can manage team */}
              {userPermissions?.canManageTeam && (
                <Card className="bg-zenith-card border-zenith-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zenith-primary">
                      <UserPlus className="h-5 w-5" />
                      Invite Team Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address to invite..."
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleInviteUser()}
                        className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20"
                      />
                      <Button 
                        onClick={handleInviteUser}
                        className="bg-zenith-brand hover:bg-blue-700 text-white"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Members */}
              <Card className="bg-zenith-card border-zenith-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-zenith-primary">
                    <Users className="h-5 w-5" />
                    Team Members ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {members.map((member) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        project={project}
                        currentUserId={user?.id}
                        userPermissions={{
                          canManageTeam: userPermissions?.canManageTeam || false
                        }}
                        onManage={setManagingMemberId}
                        onRemove={handleRemoveMember}
                        managingMemberId={managingMemberId}
                        onCancelManage={() => setManagingMemberId(null)}
                        onUpdateRole={handleUpdateMemberRole}
                        projectId={projectId}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'share' && userPermissions?.canViewShareKeys && (
            <div className="space-y-6">
              <Card className="bg-zenith-card border-zenith-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-zenith-primary">
                    <Key className="h-5 w-5" />
                    Project Access Credentials
                  </CardTitle>
                  <p className="text-sm text-zenith-secondary mt-2">
                    Share these credentials with team members to give them access to the project
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="bg-zenith-main border-zenith-border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Project Key
                            </label>
                            <div className="flex gap-2">
                              <Input 
                                value={project.project_key} 
                                readOnly 
                                className="font-mono bg-zenith-card border-zenith-border text-zenith-primary" 
                              />
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(project.project_key, 'Project key')}
                                  className="border-zenith-border hover:bg-zenith-hover"
                                >
                                  <motion.div
                                    initial={false}
                                    animate={{ 
                                      rotate: copiedItem === 'Project key' ? 360 : 0,
                                      scale: copiedItem === 'Project key' ? 1.2 : 1
                                    }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <Copy className={`h-4 w-4 ${copiedItem === 'Project key' ? 'text-green-600' : ''}`} />
                                  </motion.div>
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="bg-zenith-main border-zenith-border">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-zenith-primary flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Access Password
                            </label>
                            <div className="flex gap-2">
                              <Input 
                                value={project.access_password} 
                                readOnly 
                                className="font-mono bg-zenith-card border-zenith-border text-zenith-primary" 
                              />
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(project.access_password, 'Access password')}
                                  className="border-zenith-border hover:bg-zenith-hover"
                                >
                                  <motion.div
                                    initial={false}
                                    animate={{ 
                                      rotate: copiedItem === 'Access password' ? 360 : 0,
                                      scale: copiedItem === 'Access password' ? 1.2 : 1
                                    }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <Copy className={`h-4 w-4 ${copiedItem === 'Access password' ? 'text-green-600' : ''}`} />
                                  </motion.div>
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Important:</strong> Keep these credentials secure. Anyone with access to both the project key and password can join your project.
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Project Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-zenith-card border-zenith-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zenith-primary">
                      <Target className="h-5 w-5" />
                      Project Status
                    </CardTitle>
                    <p className="text-sm text-zenith-secondary">Update the current status of your project</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'planning', label: 'Planning', icon: '📋', color: 'bg-blue-500' },
                        { value: 'active', label: 'In Progress', icon: '⚡', color: 'bg-green-500' },
                        { value: 'on_hold', label: 'On Hold', icon: '⏸️', color: 'bg-yellow-500' },
                        { value: 'completed', label: 'Finished', icon: '✅', color: 'bg-purple-500' }
                      ].map((status) => (
                        <motion.div
                          key={status.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={() => handleUpdateProjectStatus(status.value)}
                            disabled={!userPermissions?.canEditProject}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                              project.status === status.value
                                ? `${status.color} text-white border-transparent shadow-lg`
                                : 'bg-zenith-main border-zenith-border hover:border-zenith-brand text-zenith-primary hover:bg-zenith-hover'
                            } ${!userPermissions?.canEditProject ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="text-2xl mb-2">{status.icon}</div>
                            <div className="font-medium text-sm">{status.label}</div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-zenith-card border-zenith-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zenith-primary">
                      <Edit className="h-5 w-5" />
                      Project Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditingDescription ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Enter project description..."
                          className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20 min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUpdateProjectDescription}
                            className="bg-zenith-brand hover:bg-blue-700 text-white"
                            disabled={!userPermissions?.canEditProject}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingDescription(false);
                              setEditDescription(project.description || '');
                            }}
                            className="border-zenith-border hover:bg-zenith-hover"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 bg-zenith-main border border-zenith-border rounded-lg">
                          <p className="text-zenith-primary">
                            {project.description || 'No description available'}
                          </p>
                        </div>
                        {userPermissions?.canEditProject && (
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingDescription(true)}
                            className="border-zenith-border hover:bg-zenith-hover"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Description
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project Due Date */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-zenith-card border-zenith-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zenith-primary">
                      <Calendar className="h-5 w-5" />
                      Project Due Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditingDueDate ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <Input
                          type="date"
                          value={projectDueDate}
                          onChange={(e) => setProjectDueDate(e.target.value)}
                          className="bg-zenith-main border-zenith-border focus:border-zenith-brand focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUpdateProjectDueDate}
                            className="bg-zenith-brand hover:bg-blue-700 text-white"
                            disabled={!userPermissions?.canEditProject}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Save Date
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingDueDate(false);
                              setProjectDueDate(project.target_end_date || '');
                            }}
                            className="border-zenith-border hover:bg-zenith-hover"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-zenith-main border border-zenith-border rounded-lg">
                          {project.target_end_date ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-zenith-primary">
                                  {new Date(project.target_end_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-sm text-orange-600">
                                  Tentative due date from project creation
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-zenith-primary">No due date set</p>
                                <p className="text-sm text-zenith-secondary">
                                  Set a deadline to track project progress
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {userPermissions?.canEditProject && (
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingDueDate(true)}
                            className="border-zenith-border hover:bg-zenith-hover"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            {project.target_end_date ? 'Set New Due Date' : 'Set Due Date'}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-zenith-card border-zenith-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zenith-primary">
                      <Settings className="h-5 w-5" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zenith-primary">Project Name</label>
                        <div className="p-3 bg-zenith-main border border-zenith-border rounded-lg">
                          <p className="font-medium text-zenith-primary">{project.name}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zenith-primary">Created By</label>
                        <div className="p-3 bg-zenith-main border border-zenith-border rounded-lg">
                          <p className="text-zenith-primary">{project.creator_name}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zenith-primary">Created Date</label>
                        <div className="p-3 bg-zenith-main border border-zenith-border rounded-lg">
                          <p className="text-zenith-primary">
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-zenith-primary">Current Status</label>
                        <div className="p-3 bg-zenith-main border border-zenith-border rounded-lg">
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
