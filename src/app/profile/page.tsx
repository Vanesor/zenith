"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Globe,
  Github,
  Linkedin,
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Activity,
  FileText,
  CheckCircle,
  Clock,
  Trophy,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  joinedDate: string;
  clubs: string[];
  role: string;
}

interface AssignmentActivity {
  id: string;
  title: string;
  club: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'completed' | 'pending' | 'graded';
  submittedAt: string;
  attempts: number;
  timeSpent: number;
}

interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'submitted' | 'graded' | 'completed';
  submittedAt: string;
  timeSpent: number;
  isPassing: boolean;
}

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentActivity[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    avatar: "",
    phone: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    joinedDate: "2025-01-15",
    clubs: [],
    role: "MEMBER",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      setProfileError(null);
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      const profileData = data.profile || data; // Handle both wrapped and unwrapped responses
      setProfile(prevProfile => ({
        ...prevProfile,
        ...profileData,
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        phone: profileData.phone || "",
        location: profileData.location || "",
        website: profileData.website || "",
        github: profileData.github || "",
        linkedin: profileData.linkedin || "",
        twitter: profileData.twitter || "",
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid or expired token')) {
        setProfileError('Your session has expired. Please log in again.');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setProfileError('Failed to load profile data. Please refresh the page.');
      }
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // 2FA states
  const [twoFactorState, setTwoFactorState] = useState<{
    enabled: boolean;
    inProgress: boolean;
    qrCode: string | null;
    tempSecret: string | null;
    verificationCode: string;
    recoveryCodes: string[] | null;
    showRecoveryCodes: boolean;
    isLoading: boolean;
    errorMessage: string | null;
  }>({
    enabled: false,
    inProgress: false,
    qrCode: null,
    tempSecret: null,
    verificationCode: "",
    recoveryCodes: null,
    showRecoveryCodes: false,
    isLoading: false,
    errorMessage: null,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      // Parse name field if it exists, otherwise use empty strings
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setProfile({
        firstName: firstName,
        lastName: lastName,
        username: user.email?.split('@')[0] || "",
        email: user.email,
        bio: "",
        avatar: user.avatar || "",
        phone: "",
        location: "",
        website: "",
        github: "",
        linkedin: "",
        twitter: "",
        joinedDate: "2025-01-15",
        clubs: [],
        role: user.role || "MEMBER",
      });
      // Fetch complete profile data from API
      fetchProfileData();
      // Fetch assignment history when profile loads
      fetchAssignmentHistory();
      fetchSubmissions();
      fetchTwoFactorStatus();
    }
  }, [user, isLoading, router]);
  
  // Fetch 2FA status
  const fetchTwoFactorStatus = async () => {
    if (!user) return;
    
    try {
      setTwoFactorState(prevState => ({
        ...prevState,
        isLoading: true,
        errorMessage: null
      }));
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/2fa/setup', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorState(prevState => ({
          ...prevState,
          enabled: data.enabled || false,
          inProgress: data.tempSecret ? true : false,
          tempSecret: data.tempSecret || null,
          isLoading: false
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch 2FA status:', errorData.error);
        setTwoFactorState(prevState => ({
          ...prevState,
          errorMessage: errorData.error || 'Failed to fetch 2FA status',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'An unexpected error occurred',
        isLoading: false
      }));
    }
  };
  
  // Setup 2FA
  const handleSetup2FA = async () => {
    try {
      setTwoFactorState(prevState => ({
        ...prevState,
        isLoading: true,
        errorMessage: null
      }));
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorState(prevState => ({
          ...prevState,
          inProgress: true,
          qrCode: data.qrCode,
          tempSecret: data.tempSecret,
          recoveryCodes: data.recoveryCodes,
          showRecoveryCodes: false,
          isLoading: false,
          errorMessage: null
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to setup 2FA:', errorData.error);
        setTwoFactorState(prevState => ({
          ...prevState,
          errorMessage: errorData.error || 'Failed to setup 2FA',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'An unexpected error occurred while setting up 2FA',
        isLoading: false
      }));
    }
  };
  
  // Verify and enable 2FA
  const handleVerify2FA = async () => {
    if (!twoFactorState.verificationCode) {
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'Verification code is required'
      }));
      return;
    }
    
    if (!twoFactorState.tempSecret) {
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'No active 2FA setup in progress. Please restart the setup process.'
      }));
      return;
    }
    
    try {
      setTwoFactorState(prevState => ({
        ...prevState,
        isLoading: true,
        errorMessage: null
      }));
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: twoFactorState.verificationCode,
          tempSecret: twoFactorState.tempSecret // Pass the tempSecret to the API
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorState(prevState => ({
          ...prevState,
          enabled: true,
          inProgress: false,
          showRecoveryCodes: true,
          isLoading: false,
          errorMessage: null
        }));
      } else {
        const data = await response.json();
        console.error('Failed to verify 2FA code:', data.error);
        setTwoFactorState(prevState => ({
          ...prevState,
          errorMessage: data.error || 'Failed to verify 2FA code',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'An unexpected error occurred while verifying 2FA',
        isLoading: false
      }));
    }
  };
  
  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!twoFactorState.verificationCode) {
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'Verification code is required'
      }));
      return;
    }
    
    try {
      setTwoFactorState(prevState => ({
        ...prevState,
        isLoading: true,
        errorMessage: null
      }));
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: twoFactorState.verificationCode
        })
      });

      if (response.ok) {
        setTwoFactorState({
          enabled: false,
          inProgress: false,
          qrCode: null,
          tempSecret: null,
          verificationCode: "",
          recoveryCodes: null,
          showRecoveryCodes: false,
          isLoading: false,
          errorMessage: null
        });
      } else {
        const data = await response.json();
        console.error('Failed to disable 2FA:', data.error);
        setTwoFactorState(prevState => ({
          ...prevState,
          errorMessage: data.error || 'Failed to disable 2FA',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setTwoFactorState(prevState => ({
        ...prevState,
        errorMessage: 'An unexpected error occurred while disabling 2FA',
        isLoading: false
      }));
    }
  };
  
  // Cancel 2FA setup process
  const handleCancel2FASetup = () => {
    setTwoFactorState(prevState => ({
      ...prevState,
      inProgress: false,
      qrCode: null,
      tempSecret: null,
      verificationCode: "",
      errorMessage: null
    }));
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      setLoadingSubmissions(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/user/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const fetchAssignmentHistory = async () => {
    if (!user) return;
    
    try {
      setLoadingActivities(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/user/assignment-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignmentHistory(data.assignments || []);
      } else {
        console.error('Failed to fetch assignment history');
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSave = async () => {
    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      const updatedProfile = updatedData.profile || updatedData; // Handle wrapped response
      setProfile(prevProfile => ({ ...prevProfile, ...updatedProfile }));
      setIsEditing(false);
      setProfileSuccess('Profile updated successfully!');
      
      // Update auth context with new profile data
      updateUser({
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
      if (errorMessage.includes('Invalid or expired token')) {
        setProfileError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setProfileError(errorMessage);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    try {
      // In a real app, this would make an API call to change password
      console.log("Changing password");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
      // Show success message
    } catch (error) {
      console.error("Error changing password:", error);
      // Show error message
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setProfileError('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image file size must be less than 5MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      setProfileError(null);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Upload to server
      const token = localStorage.getItem('zenith-token');
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
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Update profile with new avatar URL
      setProfile(prev => ({ ...prev, avatar: data.avatarUrl }));
      // Update user in auth context
      updateUser({ avatar: data.avatarUrl });
      setProfileSuccess('Profile image updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(null), 3000);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to upload image');
      // Reset preview on error
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const triggerAvatarUpload = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleAvatarDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a fake input change event
      const fileList = new DataTransfer();
      fileList.items.add(file);
      
      const fakeEvent = {
        target: { 
          files: fileList.files, 
          value: '' 
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleAvatarUpload(fakeEvent);
    }
  };

  const handleAvatarDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  if (isLoading || !user || loadingProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-zenith-main transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-zenith-card rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Success/Error Messages */}
          {(profileSuccess || profileError) && (
            <div className={`px-6 py-3 ${profileSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border-l-4`}>
              <div className="flex items-center">
                {profileSuccess ? (
                  <CheckCircle size={20} className="mr-2" />
                ) : (
                  <X size={20} className="mr-2" />
                )}
                <p>{profileSuccess || profileError}</p>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <div 
                  className={`w-32 h-32 bg-white/20 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all ${isEditing ? 'hover:bg-white/30 border-2 border-dashed border-transparent hover:border-white/50' : ''}`}
                  onClick={isEditing ? triggerAvatarUpload : undefined}
                  onDrop={isEditing ? handleAvatarDrop : undefined}
                  onDragOver={isEditing ? handleAvatarDragOver : undefined}
                  title={isEditing ? "Click to upload or drag & drop an image" : undefined}
                >
                  {(avatarPreview || profile.avatar) ? (
                    <Image
                      src={avatarPreview || profile.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      width={128}
                      height={128}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <User size={48} className="text-white mb-1" />
                      {isEditing && (
                        <span className="text-xs text-white/80">Click to upload</span>
                      )}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={triggerAvatarUpload}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    title="Change profile picture"
                  >
                    <Camera size={20} className="text-white" />
                  </button>
                )}
                {/* Hidden file input */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`
                    : user?.name || "User"}
                </h1>
                <p className="text-xl opacity-90 mb-2">
                  @{profile.username || user?.username || user?.email?.split('@')[0] || "user"}
                </p>
                <p className="text-lg opacity-80 mb-4">
                  {profile.bio || "No bio available"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <span className="flex items-center">
                    <Mail size={16} className="mr-2" />
                    {profile.email}
                  </span>
                  <span className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Joined {new Date(profile.joinedDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Shield size={16} className="mr-2" />
                    {profile.role}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all flex items-center"
                  >
                    <Edit size={20} className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={savingProfile}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                    >
                      {savingProfile ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={20} className="mr-2" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all flex items-center"
                    >
                      <X size={20} className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-zenith-card rounded-xl shadow-lg mb-8">
          <div className="border-b border-zenith-border">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "profile", label: "Profile Info", icon: User },
                { id: "activities", label: "Activities", icon: Activity },
                { id: "submissions", label: "Submissions", icon: FileText },
                { id: "settings", label: "Settings", icon: Settings },
                { id: "security", label: "Security", icon: Lock },
                { id: "notifications", label: "Notifications", icon: Bell },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({ ...profile, username: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled={true} // Email usually shouldn't be editable
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-zenith-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    disabled={!isEditing}
                    rows={4}
                    className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zenith-primary">
                    Social Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Github size={16} className="inline mr-2" />
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={profile.github}
                        onChange={(e) =>
                          setProfile({ ...profile, github: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                        placeholder="GitHub profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Linkedin size={16} className="inline mr-2" />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={profile.linkedin}
                        onChange={(e) =>
                          setProfile({ ...profile, linkedin: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe size={16} className="inline mr-2" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) =>
                          setProfile({ ...profile, website: e.target.value })
                        }
                        disabled={!isEditing}
                        className="w-full p-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary disabled:bg-zenith-hover"
                        placeholder="Personal website URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zenith-primary">
                      Assignment History
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Track your assignment submissions and scores
                    </p>
                  </div>
                  <button
                    onClick={fetchAssignmentHistory}
                    disabled={loadingActivities}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {loadingActivities ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {loadingActivities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-zenith-muted">Loading activities...</span>
                  </div>
                ) : assignmentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zenith-primary mb-2">
                      No Assignments Yet
                    </h3>
                    <p className="text-zenith-muted">
                      Your assignment submissions will appear here once you start taking assignments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Assignment Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total Assignments</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {assignmentHistory.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {assignmentHistory.filter(a => a.status === 'completed' || a.status === 'graded').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Average Score</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                              {assignmentHistory.length > 0 
                                ? Math.round(assignmentHistory.reduce((acc, a) => acc + a.percentage, 0) / assignmentHistory.length)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                          <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Total Time</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {Math.round(assignmentHistory.reduce((acc, a) => acc + a.timeSpent, 0) / 60)}h
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment List */}
                    {assignmentHistory.map((assignment) => (
                      <div key={assignment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-zenith-primary">
                                {assignment.title}
                              </h4>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                {assignment.club}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                assignment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.status === 'graded'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zenith-muted">
                              <div>
                                <span className="font-medium">Score:</span> {assignment.score}/{assignment.maxScore}
                              </div>
                              <div>
                                <span className="font-medium">Percentage:</span> {assignment.percentage.toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium">Attempts:</span> {assignment.attempts}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {Math.round(assignment.timeSpent / 60)}min
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className={`text-2xl font-bold ${
                              assignment.percentage >= 80 
                                ? 'text-green-600 dark:text-green-400'
                                : assignment.percentage >= 60 
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {assignment.percentage.toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              {new Date(assignment.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              assignment.percentage >= 80 
                                ? 'bg-green-500'
                                : assignment.percentage >= 60 
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${assignment.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      My Assignment Submissions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View your assignment submission history and scores
                    </p>
                  </div>
                  <button
                    onClick={fetchSubmissions}
                    disabled={loadingSubmissions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loadingSubmissions ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {loadingSubmissions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No submissions yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      You haven't submitted any assignments yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div 
                        key={submission.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {submission.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              submission.status === 'graded' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : submission.status === 'submitted'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </span>
                            {submission.isPassing && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Passed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {submission.score}/{submission.maxScore}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Percentage</div>
                            <div className={`font-semibold ${
                              Number(submission.percentage) >= 80 
                                ? 'text-green-600 dark:text-green-400'
                                : Number(submission.percentage) >= 60 
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {Number.isFinite(Number(submission.percentage)) ? Number(submission.percentage).toFixed(1) : '0.0'}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full ${
                              submission.percentage >= 80 
                                ? 'bg-green-500'
                                : submission.percentage >= 60 
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(submission.percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => router.push(`/assignments/${submission.assignmentId}/results`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Results
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8">
                {/* Password Change Section */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      {showPasswordChange ? <X size={18} /> : <Lock size={18} />}
                      {showPasswordChange ? "Cancel" : "Change Password"}
                    </button>
                  </div>

                {showPasswordChange && (
                  <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zenith-card text-zenith-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                )}

                {showPasswordChange && (
                    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                current: !showPasswords.current,
                              })
                            }
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                new: !showPasswords.new,
                              })
                            }
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                confirm: !showPasswords.confirm,
                              })
                            }
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Update Password
                      </button>
                    </div>
                  )}
                </div>

                {/* Two-Factor Authentication Section */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield size={20} className="text-blue-600" />
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center">
                      {twoFactorState.enabled ? (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle size={14} />
                          Enabled
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Clock size={14} />
                          Not Enabled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 2FA Status and Action Button */}
                    {!twoFactorState.inProgress && !twoFactorState.showRecoveryCodes && (
                      <div className="flex flex-col space-y-6">
                        <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-start">
                            <div className="mr-4 bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                              <Shield size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                {twoFactorState.enabled ? 'Two-Factor Authentication is Enabled' : 'Protect Your Account with 2FA'}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {twoFactorState.enabled 
                                  ? 'Your account is protected with an authenticator app. You\'ll need to enter a verification code when signing in.'
                                  : 'Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.'}
                              </p>
                              <div className="mt-4">
                                {twoFactorState.enabled ? (
                                  <button 
                                    onClick={() => setTwoFactorState(prev => ({...prev, verificationCode: "", inProgress: true}))} 
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    disabled={twoFactorState.isLoading}
                                  >
                                    {twoFactorState.isLoading ? (
                                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    ) : (
                                      <X size={18} />
                                    )}
                                    {twoFactorState.isLoading ? 'Processing...' : 'Disable 2FA'}
                                  </button>
                                ) : (
                                  <button 
                                    onClick={handleSetup2FA} 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    disabled={twoFactorState.isLoading}
                                  >
                                    {twoFactorState.isLoading ? (
                                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    ) : (
                                      <Shield size={18} />
                                    )}
                                    {twoFactorState.isLoading ? 'Setting up...' : 'Enable 2FA'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Error message */}
                        {twoFactorState.errorMessage && (
                          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                            <div className="flex items-start">
                              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 mr-2" />
                              <p className="text-red-700 dark:text-red-300">{twoFactorState.errorMessage}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
                            <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                              <Trophy size={16} /> Enhanced Security
                            </h5>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              Protect your account from unauthorized access with a second verification step.
                            </p>
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-gray-700 rounded-lg border border-emerald-100 dark:border-gray-600">
                            <h5 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-2">
                              <Globe size={16} /> Works Everywhere
                            </h5>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200">
                              Compatible with popular authenticator apps like Google Authenticator, Authy, and Microsoft Authenticator.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2FA Setup Process */}
                    {twoFactorState.inProgress && !twoFactorState.enabled && (
                      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-center space-y-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Setup Two-Factor Authentication
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Scan the QR code with an authenticator app or manually enter the setup key.
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-4">
                          {/* QR Code */}
                          <div className="flex-shrink-0">
                            {twoFactorState.qrCode && (
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <img 
                                  src={twoFactorState.qrCode} 
                                  alt="2FA QR Code" 
                                  className="h-48 w-48 object-contain"
                                />
                              </div>
                            )}
                          </div>

                          {/* Instructions */}
                          <div className="flex-1 space-y-5">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200">1. Download an authenticator app</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                If you don't already have an authenticator app, download one of these:
                              </p>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
                                <li>Google Authenticator</li>
                                <li>Microsoft Authenticator</li>
                                <li>Authy</li>
                                <li>1Password</li>
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200">2. Scan QR code or enter key</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Scan the QR code with your authenticator app or manually enter this key:
                              </p>
                              {twoFactorState.tempSecret && (
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600">
                                  <code className="text-sm font-mono break-all">
                                    {twoFactorState.tempSecret}
                                  </code>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200">3. Verify setup</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Enter the 6-digit code from your authenticator app:
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="000000"
                                  maxLength={6}
                                  value={twoFactorState.verificationCode}
                                  onChange={(e) => setTwoFactorState(prev => ({...prev, verificationCode: e.target.value}))}
                                  className="w-full max-w-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Error message */}
                        {twoFactorState.errorMessage && (
                          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                            <div className="flex items-start">
                              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 mr-2" />
                              <p className="text-red-700 dark:text-red-300">{twoFactorState.errorMessage}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button 
                            onClick={handleCancel2FASetup}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            disabled={twoFactorState.isLoading}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleVerify2FA}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            disabled={!twoFactorState.verificationCode || twoFactorState.verificationCode.length !== 6 || twoFactorState.isLoading}
                          >
                            {twoFactorState.isLoading ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            ) : (
                              <CheckCircle size={18} />
                            )}
                            {twoFactorState.isLoading ? 'Verifying...' : 'Verify and Enable'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recovery Codes Display */}
                    {twoFactorState.showRecoveryCodes && twoFactorState.recoveryCodes && (
                      <div className="space-y-4 p-6 bg-yellow-50 dark:bg-gray-700 rounded-lg border border-yellow-200 dark:border-gray-600">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Save Your Recovery Codes
                          </h4>
                          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                            Keep these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {twoFactorState.recoveryCodes.map((code, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded font-mono text-sm flex justify-center">
                              {code}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-center pt-4">
                          <button
                            onClick={() => setTwoFactorState(prev => ({...prev, showRecoveryCodes: false}))}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            disabled={twoFactorState.isLoading}
                          >
                            <CheckCircle size={18} />
                            I've Saved These Codes
                          </button>
                        </div>
                        
                        <p className="text-center text-sm text-yellow-600 dark:text-yellow-400 mt-4">
                          Keep these codes in a secure location. They can be used to regain access to your account if you lose your device.
                        </p>
                      </div>
                    )}

                    {/* 2FA Disable Confirmation */}
                    {twoFactorState.inProgress && twoFactorState.enabled && (
                      <div className="space-y-4 p-6 bg-red-50 dark:bg-gray-700 rounded-lg border border-red-200 dark:border-gray-600">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Disable Two-Factor Authentication
                          </h4>
                          <p className="text-red-800 dark:text-red-200 text-sm mt-1">
                            Warning: This will remove the extra security from your account.
                          </p>
                        </div>

                        <div className="space-y-3 mt-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            To confirm, enter the 6-digit code from your authenticator app:
                          </p>
                          <div className="flex justify-center">
                            <input
                              type="text"
                              placeholder="000000"
                              maxLength={6}
                              value={twoFactorState.verificationCode}
                              onChange={(e) => setTwoFactorState(prev => ({...prev, verificationCode: e.target.value}))}
                              className="w-full max-w-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest"
                            />
                          </div>
                        </div>

                        {/* Error message */}
                        {twoFactorState.errorMessage && (
                          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                            <div className="flex items-start">
                              <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 mr-2" />
                              <p className="text-red-700 dark:text-red-300">{twoFactorState.errorMessage}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-center gap-3 pt-4">
                          <button 
                            onClick={handleCancel2FASetup}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            disabled={twoFactorState.isLoading}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleDisable2FA}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            disabled={!twoFactorState.verificationCode || twoFactorState.verificationCode.length !== 6 || twoFactorState.isLoading}
                          >
                            {twoFactorState.isLoading ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            ) : (
                              <X size={18} />
                            )}
                            {twoFactorState.isLoading ? 'Disabling...' : 'Disable 2FA'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Management Section */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe size={20} className="text-blue-600" />
                        Active Sessions
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your active sessions and devices
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                      Session management will be available soon
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zenith-primary mb-4">
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-zenith-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-zenith-primary">
                          Profile Visibility
                        </h4>
                        <p className="text-sm text-zenith-muted">
                          Control who can see your profile
                        </p>
                      </div>
                      <select className="px-3 py-2 border border-zenith-border rounded-lg bg-zenith-card text-zenith-primary">
                        <option>Public</option>
                        <option>Club Members Only</option>
                        <option>Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-zenith-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-zenith-primary">
                          Activity Status
                        </h4>
                        <p className="text-sm text-zenith-muted">
                          Show when you&apos;re online
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zenith-primary mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Email Notifications",
                        description:
                          "Receive email updates for important activities",
                      },
                      {
                        title: "Push Notifications",
                        description: "Get notified on your device",
                      },
                      {
                        title: "Club Announcements",
                        description: "Notifications for club announcements",
                      },
                      {
                        title: "Event Reminders",
                        description: "Reminders for upcoming events",
                      },
                      {
                        title: "Assignment Deadlines",
                        description: "Notifications for assignment due dates",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-zenith-border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-zenith-primary">
                            {item.title}
                          </h4>
                          <p className="text-sm text-zenith-muted">
                            {item.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ZenChatbot />
        </div>
      </div>
    </MainLayout>
  );
}
