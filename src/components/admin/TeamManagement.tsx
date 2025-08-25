'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  Shield, 
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  role_permissions?: {
    can_create_projects: boolean;
    can_manage_events: boolean;
    can_approve_content: boolean;
    is_privileged: boolean;
  };
  academic_year: string;
  is_current_term: boolean;
  status?: string;
  join_date: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  website_url?: string;
  social_links?: any;
  status: string;
  members: TeamMember[];
}

interface UserPermissions {
  isMember: boolean;
  role?: string;
  academicYear?: string;
  isPrivileged: boolean;
  permissions: {
    canCreateProjects: boolean;
    canManageEvents: boolean;
    canApproveContent: boolean;
    canManageMembers: boolean;
  };
}

interface TeamManagementProps {
  teamType: 'committee' | 'club';
  teamId: string;
  className?: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  teamType,
  teamId,
  className = ''
}) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New member form state
  const [newMember, setNewMember] = useState({
    email: '',
    role: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  });

  // Load team data
  useEffect(() => {
    loadTeamData();
  }, [teamType, teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/manage/${teamType}/${teamId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team data');
      }

      setTeam(data.team);
      setUserPermissions(data.userPermissions);
      setAvailableYears(data.availableYears);
      setSelectedYear(data.availableYears[0] || 'all');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!newMember.email || !newMember.role) return;

    try {
      setActionLoading('adding');
      const response = await fetch(`/api/teams/manage/${teamType}/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      setSuccessMessage('Member added successfully');
      setIsAddingMember(false);
      setNewMember({
        email: '',
        role: '',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      });
      await loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const updateMember = async (member: TeamMember, updates: any) => {
    try {
      setActionLoading(`updating-${member.id}`);
      const response = await fetch(`/api/teams/manage/${teamType}/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: member.email,
          academicYear: member.academic_year,
          ...updates
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      setSuccessMessage('Member updated successfully');
      setEditingMember(null);
      await loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setActionLoading(null);
    }
  };

  const removeMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the team?`)) return;

    try {
      setActionLoading(`removing-${member.id}`);
      const response = await fetch(
        `/api/teams/manage/${teamType}/${teamId}?memberEmail=${member.email}&academicYear=${member.academic_year}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setSuccessMessage('Member removed successfully');
      await loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMembers = team?.members.filter(member => {
    if (selectedYear === 'all') return true;
    return member.academic_year === selectedYear;
  }) || [];

  const getRoleIcon = (role: string, permissions?: any) => {
    const roleStr = role.toLowerCase();
    if (roleStr.includes('coordinator') || roleStr.includes('president')) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    if (permissions?.is_privileged) {
      return <Shield className="w-4 h-4 text-blue-500" />;
    }
    return <UserCheck className="w-4 h-4 text-green-500" />;
  };

  const getRoleColor = (role: string, permissions?: any) => {
    const roleStr = role.toLowerCase();
    if (roleStr.includes('coordinator') || roleStr.includes('president')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (permissions?.is_privileged) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!userPermissions?.permissions.canManageMembers) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-700">You don't have permission to manage team members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <span>Manage {team?.name}</span>
          </h2>
          <p className="text-gray-600 mt-1">
            {teamType === 'club' ? 'Club' : 'Committee'} Member Management
          </p>
        </div>

        <button
          onClick={() => setIsAddingMember(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Year Filter */}
      <div className="flex items-center space-x-4">
        <Calendar className="w-5 h-5 text-gray-500" />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          Showing {filteredMembers.length} members
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <motion.div
            key={`${member.id}-${member.academic_year}`}
            layout
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleColor(member.role, member.role_permissions)}`}>
                      {getRoleIcon(member.role, member.role_permissions)}
                      <span className="ml-1">{member.role}</span>
                    </span>
                    <span className="text-xs text-gray-500">{member.academic_year}</span>
                    {member.is_current_term && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Current
                      </span>
                    )}
                    {teamType === 'committee' && member.status === 'inactive' && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingMember(member)}
                  disabled={actionLoading === `updating-${member.id}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeMember(member)}
                  disabled={actionLoading === `removing-${member.id}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {actionLoading === `removing-${member.id}` ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Member Permissions Display */}
            {member.role_permissions && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {member.role_permissions.can_create_projects && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                      Create Projects
                    </span>
                  )}
                  {member.role_permissions.can_manage_events && (
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                      Manage Events
                    </span>
                  )}
                  {member.role_permissions.can_approve_content && (
                    <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">
                      Approve Content
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="member@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={teamType === 'club' ? 'coordinator, member, etc.' : 'president, secretary, etc.'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={newMember.academicYear}
                    onChange={(e) => setNewMember({ ...newMember, academicYear: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                    <option value={new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)}>
                      {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMember}
                  disabled={actionLoading === 'adding' || !newMember.email || !newMember.role}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {actionLoading === 'adding' ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Add Member</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">Edit {editingMember.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    defaultValue={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {teamType === 'committee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      defaultValue={editingMember.status || 'active'}
                      onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMember(editingMember, { 
                    newRole: editingMember.role,
                    status: editingMember.status 
                  })}
                  disabled={actionLoading === `updating-${editingMember.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {actionLoading === `updating-${editingMember.id}` ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagement;
