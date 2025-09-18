"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserMinus,
  Settings,
  Calendar,
  FileText,
  Shield,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Mail,
  Crown,
  User,
  Star,
  Database,
  Activity,
  Save,
  RefreshCw,
  Lock,
  Grid,
  BarChart2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProfileModal from "@/components/ProfileModal";
import SafeAvatar from "@/components/SafeAvatar";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from "react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [userAccess, setUserAccess] = useState<{
    isSystemAdmin: boolean;
    isZenithCommittee: boolean;
    isClubCoordinator: boolean;
  }>({
    isSystemAdmin: false,
    isZenithCommittee: false,
    isClubCoordinator: false
  });

  // Determine user access on component mount
  useEffect(() => {
    if (user && !isLoading) {
      const userRole = user.role?.toLowerCase() || '';
      
      // System admin roles
      const isSystemAdmin = ['admin', 'super_admin'].includes(userRole);
      
      // Zenith committee roles
      const zenithRoles = [
        'president', 'vice_president', 'innovation_head', 'secretary', 'treasurer', 
        'outreach_coordinator', 'media_coordinator', 'zenith_committee', 'joint_secretary', 
        'joint_treasurer', 'outreach_head', 'media_head', 'secretary_committee'
      ];
      
      // Club coordinator roles
      const coordinatorRoles = [
        'coordinator', 'co_coordinator', 'club_coordinator', 'co-coordinator'
      ];
      
      const isZenithCommittee = zenithRoles.some(role => role.toLowerCase() === userRole);
      const isClubCoordinator = coordinatorRoles.some(role => role.toLowerCase() === userRole);
      
      setUserAccess({
        isSystemAdmin,
        isZenithCommittee,
        isClubCoordinator
      });
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a section to manage
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <SafeAvatar
                  src={user.profile_image_url || user.avatar}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* System Administration - Only for System Admins */}
            {userAccess.isSystemAdmin && (
              <Link href="/admin/super-admin" className="group">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-md p-3 group-hover:bg-red-500 transition-colors">
                        <Shield className="h-6 w-6 text-red-600 dark:text-red-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          System Administration
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Advanced system settings and user management
                        </p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Lock className="h-4 w-4 mr-2 text-gray-400" />
                          Security & Permissions
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Database className="h-4 w-4 mr-2 text-gray-400" />
                          Database Management
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Activity className="h-4 w-4 mr-2 text-gray-400" />
                          System Logs & Monitoring
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Committee Management - For Zenith Committee and System Admins */}
            {(userAccess.isZenithCommittee || userAccess.isSystemAdmin) && (
              <Link href="/admin/committee-management" className="group">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-3 group-hover:bg-purple-500 transition-colors">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Committee Management
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Manage Zenith committees and members
                        </p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <UserPlus className="h-4 w-4 mr-2 text-gray-400" />
                          Committee Membership
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Settings className="h-4 w-4 mr-2 text-gray-400" />
                          Committee Settings
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Committee Events
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Club Management - For All Admin Users */}
            <Link href="/admin/club-management" className="group">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3 group-hover:bg-blue-500 transition-colors">
                      <Grid className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Club Management
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {userAccess.isSystemAdmin || userAccess.isZenithCommittee 
                          ? "Manage all clubs and their members" 
                          : "Manage your club and members"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        Club Membership
                      </li>
                      <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        Club Content
                      </li>
                      <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <BarChart2 className="h-4 w-4 mr-2 text-gray-400" />
                        Club Analytics
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}