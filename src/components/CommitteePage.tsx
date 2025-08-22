'use client';

import React, { useState, useEffect } from 'react';
import { Users, Crown, ShieldCheck, Award, Calendar, Mail } from 'lucide-react';
import SafeAvatar from '@/components/SafeAvatar';

interface CommitteeMember {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  term_start: string | null;
  term_end: string | null;
  achievements: any;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

interface CommitteeRole {
  id: string;
  name: string;
  description: string;
  hierarchy: number;
  permissions: string[];
  members: CommitteeMember[];
}

interface CommitteeData {
  id: string;
  name: string;
  description: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: CommitteeRole[];
  totalMembers: number;
}

export default function CommitteePage() {
  const [committee, setCommittee] = useState<CommitteeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommitteeData();
  }, []);

  const fetchCommitteeData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/committee');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch committee data');
      }

      const data = await response.json();
      setCommittee(data.committee);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'president': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'vice president': return <ShieldCheck className="h-5 w-5 text-blue-500" />;
      case 'secretary': return <Award className="h-5 w-5 text-green-500" />;
      default: return <Users className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'president': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'vice president': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'innovation head': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'secretary': return 'bg-green-100 text-green-800 border border-green-300';
      case 'outreach coordinator': return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'media coordinator': return 'bg-pink-100 text-pink-800 border border-pink-300';
      case 'treasurer': return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-lg p-6 border border-red-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Committee</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchCommitteeData}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primary mb-2">Committee Not Found</h3>
            <p className="text-zenith-muted">The committee structure has not been initialized yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">{committee.name}</h1>
            <p className="text-zenith-muted">{committee.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-zenith-muted">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{committee.totalMembers} Active Members</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Established {new Date(committee.created_at).getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Committee Roles Grid */}
      <div className="grid gap-6">
        {committee.roles
          .sort((a, b) => a.hierarchy - b.hierarchy)
          .map((role) => (
            <div key={role.id} className="bg-card rounded-xl shadow-lg overflow-hidden border border-custom dark:border-gray-600">
              <div className="p-6 pb-3 border-b border-custom dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(role.name)}
                    <div>
                      <h3 className="text-xl font-semibold text-primary">{role.name}</h3>
                      <p className="text-zenith-muted">{role.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role.name)}`}>
                    {role.members.length} {role.members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {role.members.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {role.members.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-zenith-section dark:bg-gray-700 rounded-lg hover:bg-zenith-border dark:hover:bg-gray-600 transition-colors"
                      >
                        <SafeAvatar
                          src={member.user.avatar}
                          alt={member.user.name}
                          size="md"
                          className="ring-2 ring-white dark:ring-gray-600"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-primary truncate">
                            {member.user.name}
                          </h4>
                          <div className="flex items-center gap-1 text-sm text-zenith-muted">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.user.email}</span>
                          </div>
                          {member.term_start && (
                            <div className="flex items-center gap-1 text-xs text-zenith-muted mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Since {new Date(member.term_start).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zenith-muted">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No members assigned to this role yet</p>
                  </div>
                )}

                {/* Permissions */}
                {role.permissions && role.permissions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-custom dark:border-gray-600">
                    <h5 className="text-sm font-medium text-primary mb-2">Permissions</h5>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission: string, index: number) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-zenith-section dark:bg-gray-700 text-zenith-muted rounded text-xs"
                        >
                          {permission.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Contact Information */}
      <div className="mt-8 bg-card rounded-xl shadow-lg p-6 border border-custom dark:border-gray-600">
        <h3 className="text-lg font-semibold text-primary mb-2">Contact Information</h3>
        <p className="text-zenith-muted">
          For committee-related inquiries, please reach out to any of the committee members above.
        </p>
      </div>
    </div>
  );
}
