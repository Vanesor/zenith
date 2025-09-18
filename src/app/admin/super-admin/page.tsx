"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Settings,
  Database,
  Bell,
  FileText,
  UserPlus,
  Lock,
  Search,
  Filter,
  Plus,
  ChevronDown,
  Activity,
  BarChart2,
  Key,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import SafeAvatar from "@/components/SafeAvatar";

interface SystemStats {
  total_users: number;
  active_users: number;
  pending_approvals: number;
  system_health: {
    status: "healthy" | "warning" | "error";
    message?: string;
    last_checked: string;
  };
  database_size: string;
  last_backup: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  status: "active" | "inactive" | "pending" | "blocked";
  avatar?: string;
  profile_image_url?: string;
}

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  expires_at: string;
  last_used?: string;
  is_active: boolean;
  scopes: string[];
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  user_id?: string;
}

export default function SuperAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'student'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    role: ''
  });

  // Fetch system data
  useEffect(() => {
    if (!authLoading && user) {
      // Ensure user is a system admin
      if (user.role?.toLowerCase() !== 'admin' && user.role?.toLowerCase() !== 'super_admin') {
        router.push('/admin');
        return;
      }
      
      fetchSystemData();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Debug auth token
      const token = localStorage.getItem('zenith-token');
      console.log('Auth token available:', !!token);
      
      // Fetch real users from the API
      console.log('Fetching users from /api/admin/users...');
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Users response status:', usersResponse.status);
      
      const usersData = await usersResponse.json();
      console.log('Users data received:', {
        success: usersData.success,
        dataLength: usersData.data?.length,
        total: usersData.total
      });
      
      if (usersData.success) {
        // Map the API response to the User interface
        const fetchedUsers: User[] = usersData.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login || undefined,
          status: user.status as "active" | "inactive" | "pending" | "blocked", // Use real status from API
          profile_image_url: user.profile_image_url || user.avatar
        }));
        
        setUsers(fetchedUsers);
        console.log('Users state updated with:', fetchedUsers.length, 'users');
        console.log('First few users:', fetchedUsers.slice(0, 3));
        
        // Update system stats with real data
        setSystemStats({
          total_users: fetchedUsers.length,
          active_users: fetchedUsers.filter(u => u.status === 'active').length,
          pending_approvals: fetchedUsers.filter(u => u.status === 'pending').length,
          system_health: {
            status: "healthy",
            last_checked: new Date().toISOString()
          },
          database_size: "1.2 GB", // This would need to be fetched from database
          last_backup: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        });
      } else {
        console.error('Failed to fetch users:', usersData.error);
        showToast({
          type: 'error',
          title: 'Database Error',
          message: 'Failed to fetch users from database'
        });
        
        // Fallback to empty state
        setUsers([]);
        setSystemStats({
          total_users: 0,
          active_users: 0,
          pending_approvals: 0,
          system_health: {
            status: "error",
            message: "Failed to connect to database",
            last_checked: new Date().toISOString()
          },
          database_size: "Unknown",
          last_backup: "Unknown"
        });
      }
        
      // Set API keys (these could also be fetched from a real API)
      setApiKeys([
        {
          id: "key1",
          name: "Main API Key",
          created_at: "2025-01-10T00:00:00Z",
          expires_at: "2026-01-10T00:00:00Z",
          last_used: "2025-09-16T10:15:00Z",
          is_active: true,
          scopes: ["read", "write"]
        },
        {
          id: "key2",
          name: "Analytics API Key",
          created_at: "2025-03-15T00:00:00Z",
          expires_at: "2026-03-15T00:00:00Z",
          last_used: "2025-09-15T22:30:00Z",
          is_active: true,
          scopes: ["read"]
        }
      ]);
      
      // Set system logs (these could also be fetched from a real API)
      setSystemLogs([
        {
          id: "log1",
          timestamp: "2025-09-16T10:30:00Z",
          level: "info",
          message: "System backup completed successfully",
          source: "backup-service"
        },
        {
          id: "log2",
          timestamp: "2025-09-16T09:15:00Z",
          level: "warning",
          message: "High CPU usage detected",
          source: "monitoring-service"
        },
        {
          id: "log3",
          timestamp: "2025-09-15T23:45:00Z",
          level: "error",
          message: "Failed to connect to email service",
          source: "notification-service"
        }
      ]);
      
    } catch (error) {
      console.error("Error fetching system data:", error);
      showToast({
        type: 'error',
        title: 'System Error',
        message: 'Failed to load system data'
      });
    } finally {
      setLoading(false);
    }
  };

  // User editing functions
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setFormErrors({ name: '', email: '', role: '' });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'student' });
    setFormErrors({ name: '', email: '', role: '' });
  };

  const validateForm = () => {
    const errors = { name: '', email: '', role: '' };
    let isValid = true;

    // Name validation - must not be blank and contain at least two words
    if (!editForm.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else {
      const nameParts = editForm.name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        errors.name = 'Name must contain at least two words (first and last name)';
        isValid = false;
      }
    }

    // Email validation
    if (!editForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Role validation
    if (!editForm.role) {
      errors.role = 'Role is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const checkEmailUniqueness = async (email: string, currentUserId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/admin/users/check-email?email=${encodeURIComponent(email)}&userId=${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data.isUnique;
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return false;
    }
  };

  const saveUserChanges = async () => {
    if (!validateForm() || !editingUser) return;

    setEditLoading(true);
    try {
      // Check email uniqueness if email changed
      if (editForm.email !== editingUser.email) {
        const isEmailUnique = await checkEmailUniqueness(editForm.email, editingUser.id);
        if (!isEmailUnique) {
          setFormErrors(prev => ({ ...prev, email: 'This email is already in use by another user' }));
          setEditLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === editingUser.id 
              ? { ...user, ...editForm }
              : user
          )
        );

        showToast({
          type: 'success',
          title: 'User Updated',
          message: `${editForm.name} has been updated successfully`
        });

        closeEditModal();
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update user'
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the user'
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logging
  console.log('Current users state:', users.length);
  console.log('Filtered users:', filteredUsers.length);
  console.log('Search term:', searchTerm);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Administration</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Advanced system controls for administrators
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Admin
              </button>
            </div>
          </div>
          
          {/* Navigation tabs */}
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart2 },
              { id: "users", label: "User Management", icon: Users },
              { id: "system", label: "System Settings", icon: Settings },
              { id: "security", label: "Security", icon: Lock },
              { id: "logs", label: "System Logs", icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {systemStats?.total_users}
                            </div>
                            <div className="ml-2 text-sm text-green-600">
                              <span className="font-medium">{systemStats?.active_users} active</span>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <Bell className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Pending Approvals</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {systemStats?.pending_approvals}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 rounded-md p-3 ${
                        systemStats?.system_health.status === 'healthy' ? 'bg-green-500' :
                        systemStats?.system_health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">System Health</dt>
                          <dd className="flex items-baseline">
                            <div className={`text-lg font-semibold capitalize ${
                              systemStats?.system_health.status === 'healthy' ? 'text-green-600' :
                              systemStats?.system_health.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {systemStats?.system_health.status}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <Database className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Database Size</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {systemStats?.database_size}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <button className="px-4 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg flex items-center">
                      <UserPlus className="h-5 w-5 mr-2" />
                      <span>Add New User</span>
                    </button>
                    <button className="px-4 py-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      <span>Generate Reports</span>
                    </button>
                    <button className="px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      <span>Backup Database</span>
                    </button>
                    <button className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      <span>Manage API Keys</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent System Logs */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Recent System Logs
                    </h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                      <span>View All Logs</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {systemLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                log.level === "info" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                log.level === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {log.source}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {log.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    User Management
                  </h3>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div className="relative w-full sm:max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="president">President</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="member">Member</option>
                        <option value="student">Student</option>
                      </select>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            {users.length === 0 ? 'No users found' : `No users match "${searchTerm}"`}
                            <br />
                            <small>Total users loaded: {users.length}</small>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <SafeAvatar 
                                  src={user.profile_image_url || user.avatar} 
                                  alt={user.name} 
                                  className="h-10 w-10 rounded-full"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                            >
                              Edit
                            </button>
                            {/* Remove block/unblock buttons for now as requested */}
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    System Configuration
                  </h3>
                  <div className="mt-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Database Management
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Last backup: {new Date(systemStats?.last_backup || "").toLocaleString()}
                      </p>
                      <div className="mt-3 flex space-x-3">
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <Database className="h-4 w-4 mr-2" />
                          Create Backup
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Restore from Backup
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Email Configuration
                      </h4>
                      <div className="mt-3 max-w-xl">
                        <form className="space-y-4">
                          <div>
                            <label htmlFor="smtp_server" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              SMTP Server
                            </label>
                            <input
                              type="text"
                              id="smtp_server"
                              name="smtp_server"
                              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                              defaultValue="smtp.zenith.edu"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                SMTP Port
                              </label>
                              <input
                                type="text"
                                id="smtp_port"
                                name="smtp_port"
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                                defaultValue="587"
                              />
                            </div>
                            <div>
                              <label htmlFor="encryption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Encryption
                              </label>
                              <select
                                id="encryption"
                                name="encryption"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                              >
                                <option>TLS</option>
                                <option>SSL</option>
                                <option>None</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Save Configuration
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    API Keys
                  </h3>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Generate New API Key
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Scopes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Last Used
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {apiKeys.map((key) => (
                          <tr key={key.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {key.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(key.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(key.expires_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-1">
                                {key.scopes.map((scope) => (
                                  <span
                                    key={scope}
                                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  >
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {key.last_used ? new Date(key.last_used).toLocaleString() : "Never used"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                key.is_active 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {key.is_active ? 'Active' : 'Revoked'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {key.is_active ? (
                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                  Revoke
                                </button>
                              ) : (
                                <button className="text-gray-400 cursor-not-allowed">
                                  Revoked
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Authentication Settings
                  </h3>
                  <div className="mt-4 space-y-4 max-w-xl">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="enable_2fa"
                          name="enable_2fa"
                          type="checkbox"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          defaultChecked={true}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="enable_2fa" className="font-medium text-gray-700 dark:text-gray-300">
                          Require Two-Factor Authentication
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Enforce 2FA for all admin users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="password_policy"
                          name="password_policy"
                          type="checkbox"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          defaultChecked={true}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="password_policy" className="font-medium text-gray-700 dark:text-gray-300">
                          Enforce Strong Password Policy
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Require complex passwords with minimum 10 characters
                        </p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    System Logs
                  </h3>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <div className="relative w-full sm:max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Search logs..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                      >
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="critical">Critical</option>
                      </select>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export Logs
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Message
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {systemLogs.concat(systemLogs).concat(systemLogs).map((log, index) => (
                        <tr key={`${log.id}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.level === "info" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                              log.level === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {log.source}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {log.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {log.user_id ? `User: ${log.user_id}` : "System"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">20</span> of <span className="font-medium">100</span> logs
                    </p>
                    <div className="flex space-x-2">
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                        Previous
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeEditModal}
            ></div>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Edit User
                    </h3>
                    <div className="mt-4 space-y-4">
                      {/* Name Field */}
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                            formErrors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Enter full name (e.g., John Doe)"
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="edit-email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                            formErrors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Enter email address"
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                        )}
                      </div>

                      {/* Role Field */}
                      <div>
                        <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Role *
                        </label>
                        <select
                          id="edit-role"
                          value={editForm.role}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                            formErrors.role ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
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
                        {formErrors.role && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.role}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={saveUserChanges}
                  disabled={editLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}