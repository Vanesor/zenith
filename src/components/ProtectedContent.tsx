"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Crown, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { UniversalLoader } from './UniversalLoader';
import { AuthButton } from './AuthButton';

interface ProtectedContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
  loadingMessage?: string;
  fallbackMessage?: string;
  authPrompt?: string;
  showAuthButton?: boolean;
  className?: string;
}

export function ProtectedContent({
  children,
  fallback,
  requiredRoles = [],
  requireAuth = true,
  loadingMessage = 'Checking permissions...',
  fallbackMessage = 'Authentication required to view this content',
  authPrompt = 'Please sign in to access this content',
  showAuthButton = true,
  className = '',
}: ProtectedContentProps) {
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <UniversalLoader message={loadingMessage} fullScreen={false} />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                   border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center ${className}`}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 
                          rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Authentication Required
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {fallbackMessage}
        </p>
        
        {showAuthButton && (
          <AuthButton
            onClick={() => openAuthModal(authPrompt, false)}
            className="mx-auto"
            requireAuth={false}
            icon={<User className="w-4 h-4 mr-2" />}
          >
            Sign In to Continue
          </AuthButton>
        )}
      </motion.div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const getRoleIcon = (role: string) => {
      if (['admin'].includes(role)) return Crown;
      if (['coordinator', 'co_coordinator', 'president', 'vice_president'].includes(role)) return Shield;
      return User;
    };

    const RoleIcon = getRoleIcon(requiredRoles[0]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 
                   border border-red-200 dark:border-red-800 rounded-xl p-8 text-center ${className}`}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 
                          rounded-full flex items-center justify-center">
            <RoleIcon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Insufficient Permissions
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          This content requires one of the following roles: {requiredRoles.join(', ')}
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Your current role: <span className="font-medium">{user.role}</span>
        </p>
      </motion.div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

// Specialized protected content components
interface ProtectedSectionProps extends Omit<ProtectedContentProps, 'children'> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function ProtectedSection({
  title,
  description,
  children,
  ...props
}: ProtectedSectionProps) {
  return (
    <ProtectedContent {...props}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {children}
      </motion.div>
    </ProtectedContent>
  );
}

export function ManagementOnlyContent({ children, ...props }: Omit<ProtectedContentProps, 'requiredRoles'>) {
  return (
    <ProtectedContent
      requiredRoles={['admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 'vice_president']}
      fallbackMessage="Management access required to view this content"
      {...props}
    >
      {children}
    </ProtectedContent>
  );
}

export function AdminOnlyContent({ children, ...props }: Omit<ProtectedContentProps, 'requiredRoles'>) {
  return (
    <ProtectedContent
      requiredRoles={['admin']}
      fallbackMessage="Administrator access required to view this content"
      {...props}
    >
      {children}
    </ProtectedContent>
  );
}

export function ClubMemberContent({ children, ...props }: Omit<ProtectedContentProps, 'requiredRoles'>) {
  return (
    <ProtectedContent
      requiredRoles={['admin', 'coordinator', 'co_coordinator', 'committee_member', 'student']}
      fallbackMessage="Club membership required to view this content"
      {...props}
    >
      {children}
    </ProtectedContent>
  );
}

export default ProtectedContent;
