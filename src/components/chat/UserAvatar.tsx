'use client';

import { useMemo } from 'react';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({ 
  name, 
  avatar, 
  size = 'md',
  showStatus = false,
  isOnline = false
}: UserAvatarProps) {
  const initials = useMemo(() => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 1).toUpperCase();
    }
    return (nameParts[0].substring(0, 1) + nameParts[1].substring(0, 1)).toUpperCase();
  }, [name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  // Generate a consistent color based on name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  const bgColorClasses = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-pink-500'
  ];

  return (
    <div className="relative inline-block">
      {avatar ? (
        <img 
          src={avatar} 
          alt={name} 
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-800`} 
        />
      ) : (
        <div className={`${sizeClasses[size]} ${bgColorClasses[colorIndex]} rounded-full flex items-center justify-center text-primary font-medium`}>
          {initials}
        </div>
      )}
      
      {showStatus && (
        <div className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
      )}
    </div>
  );
}
