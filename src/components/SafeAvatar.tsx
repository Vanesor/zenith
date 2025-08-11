import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface SafeAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackName?: string;
}

const SafeAvatar: React.FC<SafeAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  fallbackName
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-12 h-12';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-24 h-24';
      default: return 'w-12 h-12';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      default: return 'w-6 h-6';
    }
  };

  const isSupabaseUrl = (url: string) => {
    return url.includes('.supabase.co') || url.startsWith('/storage/');
  };

  const isLocalUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      return url.startsWith('/') || url.startsWith('data:') || url.includes(window.location.hostname);
    }
    return url.startsWith('/') || url.startsWith('data:');
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // If no src, show initials or default icon
  if (!src) {
    return (
      <div className={`${getSizeClasses()} rounded-full bg-zenith-section flex items-center justify-center ${className}`}>
        {fallbackName ? (
          <span className="text-zenith-secondary font-medium text-sm">
            {getInitials(fallbackName)}
          </span>
        ) : (
          <User className={`${getIconSize()} text-zenith-muted`} />
        )}
      </div>
    );
  }

  // For Supabase URLs or local URLs, use Next.js Image with optimization
  if (isSupabaseUrl(src) || isLocalUrl(src)) {
    return (
      <div className={`${getSizeClasses()} rounded-full overflow-hidden ${className} relative`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === 'xl' ? '96px' : size === 'lg' ? '64px' : size === 'md' ? '48px' : '32px'}
          onError={() => {
            // Handle error by showing fallback
            const target = event?.target as HTMLImageElement;
            if (target) {
              target.style.display = 'none';
            }
          }}
        />
        {/* Fallback for error state */}
        <div className="absolute inset-0 bg-zenith-section flex items-center justify-center opacity-0 peer-error:opacity-100">
          {fallbackName ? (
            <span className="text-zenith-secondary font-medium text-sm">
              {getInitials(fallbackName)}
            </span>
          ) : (
            <User className={`${getIconSize()} text-zenith-muted`} />
          )}
        </div>
      </div>
    );
  }

  // For external URLs, use img tag to avoid Next.js domain restrictions
  return (
    <div className={`${getSizeClasses()} rounded-full overflow-hidden ${className} relative`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          // Show fallback
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
      {/* Fallback for error state */}
      <div className="absolute inset-0 bg-zenith-section items-center justify-center hidden">
        {fallbackName ? (
          <span className="text-zenith-secondary font-medium text-sm">
            {getInitials(fallbackName)}
          </span>
        ) : (
          <User className={`${getIconSize()} text-zenith-muted`} />
        )}
      </div>
    </div>
  );
};

export default SafeAvatar;
