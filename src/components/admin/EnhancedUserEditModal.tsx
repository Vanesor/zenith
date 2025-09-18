import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Edit2, Save, X, Calendar, Users, Building } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CommitteeMembership {
  id: string;
  committee_id: string;
  committee_name: string;
  role_id: string;
  role_name: string;
  academic_year: string;
  status: string;
  is_current_term: boolean;
  hierarchy: number;
  joined_at: string;
  term_start?: string;
  term_end?: string;
}

interface ClubMembership {
  id: string;
  club_id: string;
  club_name: string;
  role: string;
  academic_year: string;
  is_leader: boolean;
  is_current_term: boolean;
  hierarchy: number;
  display_order: number;
  bio?: string;
  achievements: string[]; // text[] in database
  joined_at: string;
}

interface Committee {
  id: string;
  name: string;
  description: string;
  roles: Array<{
    id: string;
    name: string;
    hierarchy: number;
    description: string;
  }>;
}

interface Club {
  id: string; // character varying in database
  name: string;
  type: string;
  description: string;
}

interface EnhancedUserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userUpdates: Partial<User>) => Promise<void>;
  onRefresh: () => void;
}

const EnhancedUserEditModal: React.FC<EnhancedUserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  onRefresh
}) => {
  // Early return if user is null/undefined
  if (!user) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<'basic' | 'committees' | 'clubs'>('basic');
  const [loading, setLoading] = useState(false);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  
  // Basic info form
  const [basicForm, setBasicForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role
  });
  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});

  // Membership data
  const [committeeMemberships, setCommitteeMemberships] = useState<CommitteeMembership[]>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembership[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  // New membership forms
  const [showNewCommittee, setShowNewCommittee] = useState(false);
  const [showNewClub, setShowNewClub] = useState(false);
  const [newCommitteeForm, setNewCommitteeForm] = useState({
    committee_id: '',
    role_id: '',
    academic_year: '2025-2026',
    status: 'active',
    is_current_term: true,
    term_start: '',
    term_end: ''
  });
  const [newClubForm, setNewClubForm] = useState({
    club_id: '',
    role: 'member',
    academic_year: '2025-2026',
    is_leader: false,
    is_current_term: true,
    hierarchy: 5,
    display_order: 0,
    bio: '',
    achievements: [] as string[]
  });

  // Load membership data when modal opens
  useEffect(() => {
    if (isOpen && user.id) {
      loadMembershipData();
      loadCommitteeAndClubData();
    }
  }, [isOpen, user.id]);

  const loadMembershipData = async () => {
    setMembershipsLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`/api/admin/users/${user.id}/memberships`, { headers });
      if (response.ok) {
        const data = await response.json();
        setCommitteeMemberships(data.memberships.committees);
        setClubMemberships(data.memberships.clubs);
      } else {
        console.error('Membership fetch failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error loading memberships:', error);
    }
    setMembershipsLoading(false);
  };

  const loadCommitteeAndClubData = async () => {
    try {
      console.log('Loading committee and club data...');
      const token = localStorage.getItem('zenith-token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [committeesRes, clubsRes] = await Promise.all([
        fetch(`/api/admin/users/${user.id}/committee-memberships`, { headers }),
        fetch(`/api/admin/users/${user.id}/club-memberships`, { headers })
      ]);

      if (committeesRes.ok) {
        const committeesData = await committeesRes.json();
        console.log('Committees response:', committeesData);
        if (committeesData.success) {
          setCommittees(committeesData.committees || []);
        }
      } else {
        console.error('Committee fetch failed:', committeesRes.status, await committeesRes.text());
      }

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        console.log('Clubs response:', clubsData);
        if (clubsData.success) {
          setClubs(clubsData.clubs || []);
        }
      } else {
        console.error('Club fetch failed:', clubsRes.status, await clubsRes.text());
      }
    } catch (error) {
      console.error('Error loading committees and clubs:', error);
    }
  };

  const validateBasicForm = () => {
    const errors: Record<string, string> = {};
    
    if (!basicForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (basicForm.name.trim().split(' ').length < 2) {
      errors.name = 'Please enter at least first and last name';
    }
    
    if (!basicForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!basicForm.role) {
      errors.role = 'Role is required';
    }
    
    setBasicErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBasicInfo = async () => {
    if (!validateBasicForm()) return;
    
    setLoading(true);
    try {
      await onSave(basicForm);
      // Tab will stay on basic after save
    } catch (error) {
      console.error('Error saving basic info:', error);
    }
    setLoading(false);
  };

  const addCommitteeMembership = async () => {
    if (!newCommitteeForm.committee_id || !newCommitteeForm.role_id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/admin/users/${user.id}/committee-memberships`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCommitteeForm)
      });

      if (response.ok) {
        setShowNewCommittee(false);
        setNewCommitteeForm({
          committee_id: '',
          role_id: '',
          academic_year: '2025-2026',
          status: 'active',
          is_current_term: true,
          term_start: '',
          term_end: ''
        });
        await loadMembershipData();
      }
    } catch (error) {
      console.error('Error adding committee membership:', error);
    }
    setLoading(false);
  };

  const addClubMembership = async () => {
    if (!newClubForm.club_id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/admin/users/${user.id}/club-memberships`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClubForm)
      });

      if (response.ok) {
        setShowNewClub(false);
        setNewClubForm({
          club_id: '',
          role: 'member',
          academic_year: '2025-2026',
          is_leader: false,
          is_current_term: true,
          hierarchy: 5,
          display_order: 0,
          bio: '',
          achievements: []
        });
        await loadMembershipData();
      }
    } catch (error) {
      console.error('Error adding club membership:', error);
    }
    setLoading(false);
  };

  const removeMembership = async (type: 'committee' | 'club', membershipId: string) => {
    const endpoint = type === 'committee' 
      ? `/api/admin/users/${user.id}/committee-memberships/${membershipId}`
      : `/api/admin/users/${user.id}/club-memberships/${membershipId}`;
    
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(endpoint, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        await loadMembershipData();
      }
    } catch (error) {
      console.error('Error removing membership:', error);
    }
  };

  const handleClose = () => {
    setActiveTab('basic');
    setShowNewCommittee(false);
    setShowNewClub(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Edit User: {user.name}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveTab('committees')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'committees'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Building className="h-4 w-4 inline mr-2" />
                  Committees ({committeeMemberships.length})
                </button>
                <button
                  onClick={() => setActiveTab('clubs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'clubs'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Clubs ({clubMemberships.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 px-6 pb-6 max-h-96 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={basicForm.name}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                      basicErrors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter full name"
                  />
                  {basicErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{basicErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={basicForm.email}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                      basicErrors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter email address"
                  />
                  {basicErrors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{basicErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role *
                  </label>
                  <select
                    value={basicForm.role}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, role: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                      basicErrors.role ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select a role</option>
                    <option value="student">Student</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="co_coordinator">Co-Coordinator</option>
                    <option value="president">President</option>
                    <option value="vice_president">Vice President</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="innovation_head">Innovation Head</option>
                    <option value="media_coordinator">Media Coordinator</option>
                    <option value="outreach_coordinator">Outreach Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                  {basicErrors.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{basicErrors.role}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'committees' && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Committee Memberships</h4>
                  <button
                    onClick={() => setShowNewCommittee(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Committee
                  </button>
                </div>

                {membershipsLoading ? (
                  <div className="text-center py-4">Loading memberships...</div>
                ) : (
                  <div className="space-y-3">
                    {committeeMemberships.map((membership) => (
                      <div key={membership.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{membership.committee_name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{membership.role_name}</p>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {membership.academic_year}
                              </div>
                              <div>Status: {membership.status}</div>
                              {membership.is_current_term && (
                                <div className="text-green-600 dark:text-green-400">Current Term</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMembership('committee', membership.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {showNewCommittee && (
                      <div className="border border-blue-200 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3">Add Committee Membership</h6>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Committee</label>
                            <select
                              value={newCommitteeForm.committee_id}
                              onChange={(e) => setNewCommitteeForm(prev => ({ ...prev, committee_id: e.target.value, role_id: '' }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select committee</option>
                              {committees.map((committee) => (
                                <option key={committee.id} value={committee.id}>{committee.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select
                              value={newCommitteeForm.role_id}
                              onChange={(e) => setNewCommitteeForm(prev => ({ ...prev, role_id: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                              disabled={!newCommitteeForm.committee_id}
                            >
                              <option value="">Select role</option>
                              {committees.find(c => c.id === newCommitteeForm.committee_id)?.roles.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
                            <select
                              value={newCommitteeForm.academic_year}
                              onChange={(e) => setNewCommitteeForm(prev => ({ ...prev, academic_year: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="2025-2026">2025-2026</option>
                              <option value="2024-2025">2024-2025</option>
                              <option value="2023-2024">2023-2024</option>
                              <option value="2022-2023">2022-2023</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                              value={newCommitteeForm.status}
                              onChange={(e) => setNewCommitteeForm(prev => ({ ...prev, status: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newCommitteeForm.is_current_term}
                              onChange={(e) => setNewCommitteeForm(prev => ({ ...prev, is_current_term: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Current Term</span>
                          </label>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={addCommitteeMembership}
                            disabled={loading || !newCommitteeForm.committee_id || !newCommitteeForm.role_id}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3 inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={() => setShowNewCommittee(false)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clubs' && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Club Memberships</h4>
                  <button
                    onClick={() => setShowNewClub(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Club
                  </button>
                </div>

                {membershipsLoading ? (
                  <div className="text-center py-4">Loading memberships...</div>
                ) : (
                  <div className="space-y-3">
                    {clubMemberships.map((membership) => (
                      <div key={membership.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{membership.club_name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{membership.role}</p>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {membership.academic_year}
                              </div>
                              {membership.is_leader && (
                                <div className="text-blue-600 dark:text-blue-400">Leadership Role</div>
                              )}
                              {membership.is_current_term && (
                                <div className="text-green-600 dark:text-green-400">Current Term</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMembership('club', membership.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {showNewClub && (
                      <div className="border border-blue-200 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h6 className="font-medium text-gray-900 dark:text-white mb-3">Add Club Membership</h6>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Club</label>
                            <select
                              value={newClubForm.club_id}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, club_id: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select club</option>
                              {clubs.map((club) => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <input
                              type="text"
                              value={newClubForm.role}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, role: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                              placeholder="e.g., member, coordinator"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
                            <select
                              value={newClubForm.academic_year}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, academic_year: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="2025-2026">2025-2026</option>
                              <option value="2024-2025">2024-2025</option>
                              <option value="2023-2024">2023-2024</option>
                              <option value="2022-2023">2022-2023</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Hierarchy</label>
                            <input
                              type="number"
                              value={newClubForm.hierarchy}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, hierarchy: parseInt(e.target.value) || 5 }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Display Order</label>
                            <input
                              type="number"
                              value={newClubForm.display_order}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 text-sm dark:bg-gray-700 dark:text-white"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newClubForm.is_leader}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, is_leader: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Leadership Role</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newClubForm.is_current_term}
                              onChange={(e) => setNewClubForm(prev => ({ ...prev, is_current_term: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Current Term</span>
                          </label>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={addClubMembership}
                            disabled={loading || !newClubForm.club_id}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3 inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={() => setShowNewClub(false)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
            >
              Close
            </button>
            
            {activeTab === 'basic' && (
              <button
                onClick={handleSaveBasicInfo}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Basic Info'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserEditModal;