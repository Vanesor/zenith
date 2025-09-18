import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Mail, 
  Github, 
  Linkedin, 
  Globe, 
  Twitter, 
  FileText,
  X,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  FileBarChart,
  UserCog,
  UserMinus,
  Star
} from 'lucide-react';
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import TokenManager from "@/lib/TokenManager";
import { format } from 'date-fns';

interface ProfileModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  bio: string | null;
  joined_at: string;
  updated_at: string;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  club_name: string;
  club_id: string;
  stats?: {
    totalSubmissions: number;
    gradedSubmissions: number;
    averageGrade: number | null;
  };
}

interface Submission {
  id: string;
  submittedAt: string;
  updatedAt: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    dueDate: string;
    totalPoints: number;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function timeAgo(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string in timeAgo:', dateString);
    return 'Invalid Date';
  }
  
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;
  
  if (secondsPast < 60) {
    return 'Just now';
  }
  if (secondsPast < 3600) {
    return `${Math.floor(secondsPast / 60)} minutes ago`;
  }
  if (secondsPast < 86400) {
    return `${Math.floor(secondsPast / 3600)} hours ago`;
  }
  if (secondsPast < 604800) {
    return `${Math.floor(secondsPast / 86400)} days ago`;
  }
  
  return formatDate(dateString);
}

export default function ProfileModal({ userId, open, onClose }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [canManageUser, setCanManageUser] = useState(false);
  const [userClubId, setUserClubId] = useState<string | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [managementAction, setManagementAction] = useState<'changeRole' | 'changeTag' | 'remove' | null>(null);
  const [newRole, setNewRole] = useState<string>('member');
  const [newTag, setNewTag] = useState<string>('student');
  const { showToast } = useToast();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId && open) {
      // Check if this is the current user's profile
      setIsCurrentUser(user?.id === userId);
      
      if (isAuthenticated) {
        fetchUserProfile(userId);
        fetchUserSubmissions(userId);
      } else {
        setError("You must be logged in to view user profiles");
        showToast({
          type: "error",
          title: "Authentication Error",
          message: "You must be logged in to view user profiles"
        });
      }
    } else {
      // Reset state when modal is closed
      setProfile(null);
      setSubmissions([]);
      setPagination({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      });
      setActiveTab('profile');
      setError(null);
      setSubmissionsError(null);
    }
  }, [userId, open, isAuthenticated, user]);

  const fetchUserProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to view user profiles");
      }
      
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/users/${id}/profile`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }
      
      const data = await response.json();
      console.log('Profile API response:', data);
      
      const profileData = data.profile || data;
      setProfile(profileData);
      
      // Check if current user can manage this profile
      await checkManagementPermissions(id, profileData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the profile');
      console.error('Error fetching user profile:', err);
      showToast({ 
        type: "error", 
        title: "Profile Error", 
        message: err.message || 'Failed to load profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async (id: string, offset = 0, limit = 10) => {
    setSubmissionsError(null);
    
    try {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to view user submissions");
      }
      
      console.log('Fetching submissions for user:', id);
      console.log('Current user context:', { 
        isAuthenticated, 
        currentUserId: user?.id,
        currentUserRole: user?.role,
        targetUserId: id
      });
      
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(
        `/api/users/${id}/submissions?offset=${offset}&limit=${limit}`
      );
      
      console.log('Submissions API response status:', response.status);
      
      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            console.error('403 Permission denied details:', errorData);
            throw new Error(`You don't have permission to view these submissions. ${errorData.debug ? JSON.stringify(errorData.debug) : ''}`);
          } catch (jsonError) {
            throw new Error("You don't have permission to view these submissions.");
          }
        } else if (response.status === 404) {
          throw new Error("User submissions not found.");
        } else if (response.status === 500) {
          throw new Error("Server error occurred. Please try again later.");
        }
        
        // Try to parse the error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user submissions');
        } catch (jsonError) {
          // If we can't parse the JSON, use the status text
          throw new Error(`Failed to fetch user submissions: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('Submissions API response data:', data);
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (err: any) {
      setSubmissionsError(err.message || 'An error occurred while fetching submissions');
      console.error('Error fetching user submissions:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = newPage * pagination.limit;
    setPagination(prev => ({ ...prev, offset: newOffset }));
    if (userId) {
      fetchUserSubmissions(userId, newOffset, pagination.limit);
    }
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, offset: 0 }));
    if (userId) {
      fetchUserSubmissions(userId, 0, newLimit);
    }
  };

  // Check if current user can manage the profile user
  const checkManagementPermissions = async (targetUserId: string, profileData: any) => {
    try {
      if (!user || !isAuthenticated) {
        setCanManageUser(false);
        return;
      }

      // Reset management state
      setCanManageUser(false);
      setUserClubId(null);

      // Don't allow self-management
      if (user.id === targetUserId) {
        return;
      }

      // Check permissions using the backend API
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch('/api/user/roles');
      
      if (!response.ok) {
        console.error('Failed to get user roles');
        return;
      }

      const userRoles = await response.json();
      
      // Super admin and admin can manage anyone
      if (userRoles.baseRole === 'super_admin' || userRoles.baseRole === 'admin') {
        setCanManageUser(true);
        setUserClubId(profileData.club_id);
        return;
      }

      // Zenith committee members with privileged roles can manage anyone
      const hasZenithAccess = userRoles.committeeRoles?.some(
        (role: any) => role.isCurrentTerm && role.isPrivileged
      );

      if (hasZenithAccess) {
        setCanManageUser(true);
        setUserClubId(profileData.club_id);
        return;
      }

      // Club coordinators can manage members of their club
      const currentUserClubRoles = userRoles.clubRoles?.filter(
        (role: any) => role.isCurrentTerm && 
                     (role.role === 'coordinator' || role.role === 'co_coordinator')
      );

      if (currentUserClubRoles && currentUserClubRoles.length > 0) {
        // Check if target user is in any of the clubs the current user manages
        for (const clubRole of currentUserClubRoles) {
          if (profileData.club_id === clubRole.clubId) {
            setCanManageUser(true);
            setUserClubId(clubRole.clubId);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking management permissions:', error);
      setCanManageUser(false);
    }
  };

  // Handle member role or tag change
  const handleRoleChange = async () => {
    if (!userClubId || !userId) return;

    // If neither newRole nor newTag is set, exit early
    if (managementAction === 'changeRole' && !newRole) return;
    if (managementAction === 'changeTag' && !newTag) return;

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(
        `/api/clubs/${userClubId}/members`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            ...(managementAction === 'changeRole' ? { newRole } : {}),
            ...(managementAction === 'changeTag' ? { newTag } : {})
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member');
      }

      const result = await response.json();
      
      const isTagUpdate = managementAction === 'changeTag';
      
      showToast({
        type: "success",
        title: isTagUpdate ? "Tag Updated" : "Role Updated",
        message: result.message || (isTagUpdate ? 'Member tag updated successfully' : 'Member role updated successfully')
      });

      // Refresh profile to show updated role
      if (userId) {
        fetchUserProfile(userId);
      }

      setShowManagementModal(false);
      setManagementAction(null);
    } catch (error: any) {
      console.error('Error updating member role:', error);
      showToast({
        type: "error",
        title: "Update Failed",
        message: error.message || 'Failed to update member role'
      });
    }
  };

  // Handle member removal
  const handleRemoveMember = async () => {
    if (!userClubId || !userId) return;

    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(
        `/api/clubs/${userClubId}/members?userId=${userId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      const result = await response.json();
      
      showToast({
        type: "success",
        title: "Member Removed",
        message: result.message || 'Member removed successfully'
      });

      setShowManagementModal(false);
      setManagementAction(null);
      onClose(); // Close the profile modal since user is no longer a member
    } catch (error: any) {
      console.error('Error removing member:', error);
      showToast({
        type: "error",
        title: "Removal Failed",
        message: error.message || 'Failed to remove member'
      });
    }
  };
  
  // Handle avatar upload
  const handleAvatarClick = () => {
    if (isCurrentUser && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        type: "error",
        title: "Invalid File",
        message: "Please select an image file."
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast({
        type: "error",
        title: "File Too Large",
        message: "Please select an image smaller than 5MB."
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      const result = await response.json();
      
      // Update the profile with new avatar URL
      if (profile) {
        setProfile({
          ...profile,
          avatar: result.avatarUrl
        });
      }

      // Update the user context to reflect the new avatar
      if (isCurrentUser && updateUser) {
        updateUser({ 
          profile_image_url: result.avatarUrl 
        });
      }

      showToast({
        type: "success",
        title: "Avatar Updated",
        message: "Your profile picture has been updated successfully!"
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      showToast({
        type: "error",
        title: "Upload Failed",
        message: error instanceof Error ? error.message : 'Failed to upload avatar'
      });
    } finally {
      setIsUploading(false);
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Generate a comprehensive report for the user
  const generateUserReport = () => {
    if (!profile || !submissions) {
      showToast({
        type: "error",
        title: "Report Generation Failed",
        message: "Unable to generate report. Missing profile or submission data."
      });
      return;
    }
    
    try {
      // Create report content
      const currentDate = format(new Date(), 'MMMM dd, yyyy HH:mm');
      
      let reportContent = `# User Profile Report
Generated on: ${currentDate}

## User Information
- **Name**: ${profile.name}
- **Email**: ${profile.email}
- **Role**: ${formatRole(profile.role)}
- **Club**: ${profile.club_name || 'N/A'}
- **Joined**: ${formatDate(profile.joined_at)}
${profile.bio ? `- **Bio**: ${profile.bio}` : ''}

## Contact Information
${profile.email ? `- **Email**: ${profile.email}` : ''}
${profile.github_url ? `- **GitHub**: ${profile.github_url}` : ''}
${profile.linkedin_url ? `- **LinkedIn**: ${profile.linkedin_url}` : ''}
${profile.twitter_url ? `- **Twitter**: ${profile.twitter_url}` : ''}
${profile.website_url ? `- **Website**: ${profile.website_url}` : ''}

## Assignment Statistics
- **Total Submissions**: ${profile?.stats?.totalSubmissions || 0}
- **Graded Submissions**: ${profile?.stats?.gradedSubmissions || 0}
- **Average Grade**: ${profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined ? `${profile.stats.averageGrade}%` : 'N/A'}

## Recent Submissions
`;

      // Add submission details
      if (submissions.length > 0) {
        submissions.forEach((submission, index) => {
          reportContent += `
### Submission ${index + 1}
- **Assignment**: ${submission.assignment.title}
- **Submitted**: ${formatDate(submission.submittedAt)}
- **Status**: ${submission.status}
- **Grade**: ${submission.grade !== null ? `${submission.grade}/${submission.assignment.totalPoints}` : 'Not graded'}
${submission.feedback ? `- **Feedback**: ${submission.feedback}` : ''}
`;
        });
      } else {
        reportContent += "\nNo submissions found.\n";
      }
      
      reportContent += `
## Performance Summary
${(profile?.stats?.totalSubmissions || 0) > 0 
  ? `The user has completed ${profile?.stats?.totalSubmissions || 0} assignments with an average grade of ${profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined ? `${profile.stats.averageGrade}%` : 'N/A'}.`
  : 'The user has not submitted any assignments yet.'}

## Activity Overview
- **Submission Rate**: ${(profile?.stats?.totalSubmissions || 0) > 0 
  ? `${Math.round(((profile?.stats?.gradedSubmissions || 0) / (profile?.stats?.totalSubmissions || 1)) * 100)}% of submissions have been graded.` 
  : 'No submissions yet.'}
${profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined && profile.stats.averageGrade >= 70 
  ? '- **Performance Note**: User is performing well above the expected threshold.' 
  : profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined && profile.stats.averageGrade < 70 
    ? '- **Performance Note**: User may need additional support or resources.' 
    : ''}

Report generated by Zenith Platform.
`;

      // Create a blob and download the report
      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.name.replace(/\s+/g, '_')}_profile_report_${format(new Date(), 'yyyy-MM-dd')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast({
        type: "success",
        title: "Report Generated",
        message: "User report has been successfully generated and downloaded."
      });
    } catch (error) {
      console.error("Error generating report:", error);
      showToast({
        type: "error",
        title: "Report Generation Failed",
        message: "An error occurred while generating the report."
      });
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      case 'resubmit':
        return 'bg-amber-100 text-amber-700';
      case 'draft':
        return 'bg-zenith-section text-zenith-secondary';
      default:
        return 'bg-zenith-section text-zenith-secondary';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-card rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto border border-custom">
        {/* Modal Header with Close Button */}
        <div className="flex justify-between items-center border-b border-custom p-4">
          <h2 className="text-xl font-bold">
            {profile?.name ? `${profile.name}'s Profile` : 'User Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zenith-hover transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center p-12 min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4 flex items-center">
              <AlertCircle className="mr-2 w-5 h-5" />
              {error}
            </div>
          </div>
        ) : profile ? (
          <div>
            {/* Tab Navigation */}
            <div className="border-b border-custom">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-zenith-primary text-primary'
                      : 'text-zenith-secondary hover:text-primary'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'submissions'
                      ? 'border-b-2 border-zenith-primary text-primary'
                      : 'text-zenith-secondary hover:text-primary'
                  }`}
                >
                  Submissions ({profile?.stats?.totalSubmissions || 0})
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'report'
                      ? 'border-b-2 border-zenith-primary text-primary'
                      : 'text-zenith-secondary hover:text-primary'
                  }`}
                >
                  Report
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Avatar and Contact */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4">
                      <div 
                        className={`relative w-32 h-32 rounded-full ${
                          isCurrentUser ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''
                        }`}
                        onClick={handleAvatarClick}
                        title={isCurrentUser ? 'Click to change profile picture' : ''}
                      >
                        {profile.avatar ? (
                          <Image
                            src={profile.avatar}
                            alt={profile.name}
                            width={128}
                            height={128}
                            className="rounded-full object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-zenith-section dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-zenith-muted">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Upload overlay for current user */}
                        {isCurrentUser && (
                          <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                            <div className="text-white opacity-0 hover:opacity-100 transition-opacity">
                              {isUploading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{profile.name}</h3>
                    
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 mb-3">
                      {formatRole(profile.role)}
                    </span>
                    
                    <div className="text-sm text-zenith-muted dark:text-zenith-muted mb-1">
                      Member of {profile.club_name}
                    </div>
                    
                    <div className="text-sm text-zenith-muted dark:text-zenith-muted mb-4 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" /> Joined {formatDate(profile.joined_at)}
                    </div>
                    
                    <div className="w-full space-y-2">
                      {profile.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-zenith-muted" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm hover:text-primary transition-colors"
                        >
                          <Github className="w-4 h-4 mr-2 text-zenith-muted" />
                          <span>GitHub</span>
                        </a>
                      )}
                      
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm hover:text-primary transition-colors"
                        >
                          <Linkedin className="w-4 h-4 mr-2 text-zenith-muted" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      
                      {profile.twitter_url && (
                        <a
                          href={profile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm hover:text-primary transition-colors"
                        >
                          <Twitter className="w-4 h-4 mr-2 text-zenith-muted" />
                          <span>Twitter</span>
                        </a>
                      )}
                      
                      {profile.website_url && (
                        <a
                          href={profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm hover:text-primary transition-colors"
                        >
                          <Globe className="w-4 h-4 mr-2 text-zenith-muted" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column - Bio and Details */}
                  <div className="col-span-2 space-y-6">
                    <div className="bg-zenith-section dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-lg font-medium mb-2">Bio</h4>
                      <p className="text-zenith-secondary dark:text-gray-300">
                        {profile.bio || "No bio provided"}
                      </p>
                    </div>
                    
                    {/* Interests section removed as the field is not in the database schema */}
                    
                    <div className="bg-zenith-section dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-lg font-medium mb-4">Assignment Stats</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-card p-3 rounded-lg">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {profile?.stats?.totalSubmissions || 0}
                          </div>
                          <div className="text-sm text-zenith-muted dark:text-zenith-muted">
                            Total Submissions
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {profile?.stats?.gradedSubmissions || 0}
                          </div>
                          <div className="text-sm text-zenith-muted dark:text-zenith-muted">
                            Graded
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600 mb-1">
                            {profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined
                              ? `${profile.stats.averageGrade}%` 
                              : 'N/A'}
                          </div>
                          <div className="text-sm text-zenith-muted dark:text-zenith-muted">
                            Average Grade
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Club Management Actions */}
                    {canManageUser && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h4 className="text-lg font-medium mb-3 text-orange-800 dark:text-orange-200">
                          Club Management
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setManagementAction('changeRole');
                              setShowManagementModal(true);
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            Change Role
                          </button>
                          <button
                            onClick={() => {
                              setManagementAction('changeTag');
                              setShowManagementModal(true);
                              // Set initial tag based on current profile
                              if (profile?.role?.startsWith('student')) {
                                setNewTag(profile.role);
                              } else {
                                setNewTag('student');
                              }
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Change Tag
                          </button>
                          <button
                            onClick={() => {
                              setManagementAction('remove');
                              setShowManagementModal(true);
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove from Club
                          </button>
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-300 mt-2">
                          You have permission to manage this club member as a {user?.role}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submissions Tab */}
              {activeTab === 'submissions' && (
                <div>
                  {submissionsError ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-red-700 mb-2">Unable to load submissions</h3>
                      <p className="text-red-600 mb-4">{submissionsError}</p>
                      <button
                        onClick={() => userId && fetchUserSubmissions(userId)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : submissions.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-zenith-section dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zenith-muted dark:text-zenith-muted uppercase tracking-wider">
                                Assignment
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zenith-muted dark:text-zenith-muted uppercase tracking-wider">
                                Submitted
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zenith-muted dark:text-zenith-muted uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-zenith-muted dark:text-zenith-muted uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-zenith-muted dark:text-zenith-muted uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-card dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                            {submissions.map((submission) => (
                              <tr key={submission.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-primary">
                                    {submission.assignment.title}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-zenith-muted dark:text-zenith-muted flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {timeAgo(submission.submittedAt)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(submission.status)}`}>
                                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {submission.grade !== null ? (
                                    <div className="text-sm text-primary">
                                      {submission.grade}/{submission.assignment.totalPoints}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-zenith-muted dark:text-zenith-muted">
                                      Not graded
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link 
                                    href={`/assignments/${submission.assignment.id}/results?submission=${submission.id}`}
                                    target="_blank"
                                    className="text-primary hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end"
                                  >
                                    <span>View</span>
                                    <ExternalLink className="w-4 h-4 ml-1" />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center justify-between border-t border-custom bg-card dark:bg-gray-900 px-4 py-3 sm:px-6 mt-4">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => handlePageChange(Math.floor(pagination.offset / pagination.limit) - 1)}
                            disabled={pagination.offset === 0}
                            className={`relative inline-flex items-center px-4 py-2 border border-custom text-sm font-medium rounded-md ${
                              pagination.offset === 0
                                ? "bg-zenith-section text-zenith-muted cursor-not-allowed"
                                : "bg-card text-zenith-secondary hover:bg-zenith-section"
                            }`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(Math.floor(pagination.offset / pagination.limit) + 1)}
                            disabled={!pagination.hasMore}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-custom text-sm font-medium rounded-md ${
                              !pagination.hasMore
                                ? "bg-zenith-section text-zenith-muted cursor-not-allowed"
                                : "bg-card text-zenith-secondary hover:bg-zenith-section"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-zenith-secondary dark:text-gray-300">
                              Showing <span className="font-medium">{pagination.offset + 1}</span> to{" "}
                              <span className="font-medium">
                                {Math.min(pagination.offset + pagination.limit, pagination.total)}
                              </span>{" "}
                              of <span className="font-medium">{pagination.total}</span> submissions
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => handlePageChange(Math.floor(pagination.offset / pagination.limit) - 1)}
                                disabled={pagination.offset === 0}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-custom bg-card dark:border-gray-600 text-sm font-medium ${
                                  pagination.offset === 0
                                    ? "text-gray-300 dark:text-zenith-secondary cursor-not-allowed"
                                    : "text-zenith-muted hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 dark:text-gray-300"
                                }`}
                              >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              
                              {/* Page Numbers */}
                              {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handlePageChange(idx)}
                                  className={`relative inline-flex items-center px-4 py-2 border ${
                                    Math.floor(pagination.offset / pagination.limit) === idx
                                      ? "bg-blue-50 dark:bg-blue-900 border-zenith-primary text-primary dark:text-blue-300"
                                      : "bg-card border-custom dark:border-gray-600 text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-zenith-secondary/90"
                                  } text-sm font-medium`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => handlePageChange(Math.floor(pagination.offset / pagination.limit) + 1)}
                                disabled={!pagination.hasMore}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-custom bg-card dark:border-gray-600 text-sm font-medium ${
                                  !pagination.hasMore
                                    ? "text-gray-300 dark:text-zenith-secondary cursor-not-allowed"
                                    : "text-zenith-muted hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 dark:text-gray-300"
                                }`}
                              >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-zenith-muted mb-4" />
                      <h3 className="text-lg font-medium text-primary mb-1">No submissions found</h3>
                      <p className="text-zenith-muted dark:text-zenith-muted">
                        {isCurrentUser 
                          ? "You haven't submitted any assignments yet." 
                          : "This user hasn't submitted any assignments yet."}
                      </p>
                      <div className="mt-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-zenith-section text-zenith-secondary">
                          <FileText className="w-4 h-4 mr-2" />
                          0 submissions
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Report Tab */}
              {activeTab === 'report' && (
                <div className="space-y-6">
                  <div className="bg-card p-6 rounded-lg shadow-sm border border-custom">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                      <FileBarChart className="w-5 h-5 mr-2 text-primary" />
                      User Profile Report
                    </h3>
                    
                    <div className="mb-6">
                      <p className="text-zenith-secondary dark:text-gray-300">
                        Generate a comprehensive report with the user's profile information, statistics, and submission history. 
                        The report will be downloaded as a Markdown file.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zenith-section dark:bg-gray-700 p-4 rounded-md">
                          <h4 className="font-medium text-zenith-secondary dark:text-gray-300 mb-2">Report Contents</h4>
                          <ul className="list-disc pl-5 text-sm text-zenith-secondary dark:text-zenith-muted space-y-1">
                            <li>User profile information</li>
                            <li>Contact details</li>
                            <li>Assignment statistics</li>
                            <li>Recent submissions</li>
                            <li>Performance summary</li>
                            <li>Activity overview</li>
                          </ul>
                        </div>
                        <div className="bg-zenith-section dark:bg-gray-700 p-4 rounded-md">
                          <h4 className="font-medium text-zenith-secondary dark:text-gray-300 mb-2">Statistics Included</h4>
                          <ul className="list-disc pl-5 text-sm text-zenith-secondary dark:text-zenith-muted space-y-1">
                            <li>Total submissions: {profile?.stats?.totalSubmissions || 0}</li>
                            <li>Graded submissions: {profile?.stats?.gradedSubmissions || 0}</li>
                            <li>Average grade: {profile?.stats?.averageGrade !== null && profile?.stats?.averageGrade !== undefined ? `${profile.stats.averageGrade}%` : 'N/A'}</li>
                            <li>Submission rate: {(profile?.stats?.totalSubmissions || 0) > 0 
                              ? `${Math.round(((profile?.stats?.gradedSubmissions || 0) / (profile?.stats?.totalSubmissions || 1)) * 100)}%` 
                              : 'N/A'}</li>
                          </ul>
                        </div>
                      </div>
                      
                      <button
                        onClick={generateUserReport}
                        className="w-full px-4 py-2 bg-green-600 text-primary rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <FileBarChart className="w-4 h-4 mr-2" />
                        Generate and Download Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-zenith-muted dark:text-zenith-muted">
            No profile data available
          </div>
        )}
        
        {/* Club Management Modal */}
        {showManagementModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 border border-custom">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {managementAction === 'changeRole' ? 'Change Member Role' : 
                   managementAction === 'changeTag' ? 'Change Member Tag' : 
                   'Remove Member'}
                </h3>
                
                {managementAction === 'changeRole' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zenith-secondary">
                      Select a new role for {profile?.name}:
                    </p>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full p-2 border border-custom rounded-md bg-card text-primary"
                    >
                      <option value="member">Member</option>
                      <option value="co_coordinator">Co-Coordinator</option>
                      <option value="coordinator">Coordinator</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowManagementModal(false);
                          setManagementAction(null);
                        }}
                        className="px-4 py-2 text-zenith-secondary hover:bg-zenith-hover rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRoleChange}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update Role
                      </button>
                    </div>
                  </div>
                ) : managementAction === 'changeTag' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zenith-secondary">
                      Select a new tag for {profile?.name}:
                    </p>
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full p-2 border border-custom rounded-md bg-card text-primary"
                    >
                      <option value="student">Student</option>
                      <option value="student media">Student Media</option>
                      <option value="student developer">Student Developer</option>
                      <option value="student designer">Student Designer</option>
                      <option value="student coordinator">Student Coordinator</option>
                      <option value="student ambassador">Student Ambassador</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowManagementModal(false);
                          setManagementAction(null);
                        }}
                        className="px-4 py-2 text-zenith-secondary hover:bg-zenith-hover rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRoleChange}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update Tag
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-zenith-secondary">
                      Are you sure you want to remove {profile?.name} from the club? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowManagementModal(false);
                          setManagementAction(null);
                        }}
                        className="px-4 py-2 text-zenith-secondary hover:bg-zenith-hover rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveMember}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Remove Member
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer with Close Button */}
        <div className="border-t border-custom p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zenith-primary text-primary rounded-md hover:bg-zenith-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
