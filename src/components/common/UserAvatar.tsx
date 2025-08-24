"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  userId: string;
  name?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl'
};

export function UserAvatar({ 
  userId, 
  name, 
  imageUrl, 
  size = 'md', 
  className = '',
  fallbackClassName = ''
}: UserAvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState<boolean>(!imageUrl && !!userId);
  const [error, setError] = useState<boolean>(false);
  
  // Get initials for fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Fetch avatar if not provided
  useEffect(() => {
    if (!imageUrl && userId && !avatar) {
      setLoading(true);
      
      fetch(`/api/users/${userId}/avatar`)
        .then(res => res.json())
        .then(data => {
          if (data.avatarUrl) {
            setAvatar(data.avatarUrl);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, imageUrl, avatar]);
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {!error && avatar && (
        <AvatarImage 
          src={avatar} 
          alt={name || 'User avatar'} 
          onError={() => setError(true)}
        />
      )}
      <AvatarFallback className={fallbackClassName}>
        {loading ? '...' : getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
