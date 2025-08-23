"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';

interface AuthButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  requireAuth?: boolean;
  fallbackText?: string;
  authPrompt?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function AuthButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  requireAuth = true,
  fallbackText = 'Sign In Required',
  authPrompt = 'Please sign in to access this feature',
  icon,
  disabled = false,
}: AuthButtonProps) {
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleClick = () => {
    if (requireAuth && !user) {
      openAuthModal(authPrompt, false);
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl';
      case 'secondary':
        return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100';
      case 'ghost':
        return 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'outline':
        return 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const buttonContent = requireAuth && !user && !isLoading ? (
    <>
      <LogIn className="w-4 h-4 mr-2" />
      {fallbackText}
    </>
  ) : (
    <>
      {icon}
      {children}
    </>
  );

  if (isLoading) {
    return (
      <button
        disabled
        className={`
          ${getSizeClasses()}
          ${getVariantClasses()}
          rounded-lg font-medium transition-all duration-200
          opacity-50 cursor-not-allowed flex items-center justify-center
          ${className}
        `}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        Loading...
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        rounded-lg font-medium transition-all duration-200
        flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {buttonContent}
    </motion.button>
  );
}

// Specialized auth buttons for common actions
export function SignInButton({ 
  className = '', 
  size = 'md',
  authPrompt = 'Please sign in to continue'
}: Omit<AuthButtonProps, 'children' | 'requireAuth'>) {
  return (
    <AuthButton 
      className={className}
      size={size}
      requireAuth={true}
      authPrompt={authPrompt}
      icon={<User className="w-4 h-4 mr-2" />}
    >
      Sign In
    </AuthButton>
  );
}

export function JoinEventButton({ 
  onJoin, 
  className = '',
  eventTitle = 'this event'
}: { 
  onJoin?: () => void; 
  className?: string;
  eventTitle?: string;
}) {
  return (
    <AuthButton
      onClick={onJoin}
      className={className}
      requireAuth={true}
      authPrompt={`Please sign in to join ${eventTitle}`}
      fallbackText="Sign In to Join"
    >
      Join Event
    </AuthButton>
  );
}

export function CreatePostButton({ 
  onCreate, 
  className = '' 
}: { 
  onCreate?: () => void; 
  className?: string;
}) {
  return (
    <AuthButton
      onClick={onCreate}
      className={className}
      requireAuth={true}
      authPrompt="Please sign in to create a post"
      fallbackText="Sign In to Post"
      icon={<Lock className="w-4 h-4 mr-2" />}
    >
      Create Post
    </AuthButton>
  );
}

export function ViewDetailsButton({ 
  onView, 
  className = '',
  itemType = 'content'
}: { 
  onView?: () => void; 
  className?: string;
  itemType?: string;
}) {
  return (
    <AuthButton
      onClick={onView}
      className={className}
      variant="outline"
      requireAuth={true}
      authPrompt={`Please sign in to view ${itemType} details`}
      fallbackText="Sign In to View"
    >
      View Details
    </AuthButton>
  );
}

export default AuthButton;
