"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ClubLogoProps {
  clubId: string;
  logoUrl?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96
};

export function ClubLogo({ 
  clubId, 
  logoUrl, 
  name, 
  size = 'md', 
  className = '',
  fallbackClassName = ''
}: ClubLogoProps) {
  const [logo, setLogo] = useState<string | null>(logoUrl || null);
  const [loading, setLoading] = useState<boolean>(!logoUrl && !!clubId);
  const [error, setError] = useState<boolean>(false);
  
  const dimensions = sizeMap[size];
  
  // Fetch logo if not provided
  useEffect(() => {
    if (!logoUrl && clubId && !logo) {
      setLoading(true);
      
      fetch(`/api/clubs/${clubId}/images`)
        .then(res => res.json())
        .then(data => {
          if (data.logo) {
            setLogo(data.logo);
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
  }, [clubId, logoUrl, logo]);
  
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-md ${className}`}
        style={{ width: dimensions, height: dimensions }}
      >
        <span className="animate-pulse">...</span>
      </div>
    );
  }
  
  if (error || !logo) {
    return (
      <div 
        className={`flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold rounded-md ${className} ${fallbackClassName}`}
        style={{ width: dimensions, height: dimensions }}
      >
        {name ? name.substring(0, 2).toUpperCase() : 'CL'}
      </div>
    );
  }
  
  return (
    <Image
      src={logo}
      alt={name || 'Club logo'}
      width={dimensions}
      height={dimensions}
      className={`rounded-md object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

export default ClubLogo;
