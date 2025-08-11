"use client";

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  /** User's avatar URL */
  avatar?: string;
  /** User's name for fallback initials */
  name?: string;
  /** User's email for fallback initials */
  email?: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show online status indicator */
  showOnlineStatus?: boolean;
  /** Whether user is online */
  isOnline?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function UserAvatar({
  avatar,
  name,
  email,
  size = 'md',
  className = '',
  showOnlineStatus = false,
  isOnline = false,
  onClick,
  alt,
}: UserAvatarProps) {
  // Get size dimensions
  const sizeValue = typeof size === 'number' ? size : sizeMap[size];
  const sizeClass = typeof size === 'number' ? `w-[${size}px] h-[${size}px]` : sizeClasses[size];
  const textSizeClass = typeof size === 'number' ? 'text-sm' : textSizeClasses[size];

  // Generate initials from name or email
  const getInitials = () => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0]?.toUpperCase() || '';
    }
    if (email) {
      return email[0]?.toUpperCase() || '';
    }
    return '?';
  };

  // Generate consistent color based on name or email
  const getBackgroundColor = () => {
    const str = name || email || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a pleasant color
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 55%)`;
  };

  const containerClasses = `
    relative inline-flex items-center justify-center rounded-full overflow-hidden
    ${sizeClass}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim();

  return (
    <div className={containerClasses} onClick={onClick}>
      {avatar && avatar.trim() ? (
        <img
          src={avatar}
          alt={alt || `${name || email || 'User'}'s avatar`}
          className="object-cover w-full h-full rounded-full"
          onError={(e) => {
            // Hide the image on error and show fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center text-white font-semibold ${textSizeClass} rounded-full" 
                     style="background: ${getBackgroundColor()}">
                  ${getInitials()}
                </div>
              `;
            }
          }}
        />
      ) : (
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-semibold ${textSizeClass}`}
          style={{ background: getBackgroundColor() }}
        >
          {getInitials()}
        </div>
      )}
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div 
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-gray-800 ${
            typeof size === 'number' 
              ? 'w-3 h-3' 
              : size === 'xs' || size === 'sm' 
                ? 'w-2 h-2' 
                : 'w-3 h-3'
          } ${
            isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
}

export default UserAvatar;
