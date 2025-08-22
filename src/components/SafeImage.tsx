"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { getImageUrl, getAvatarFallback, isValidImageUrl, getImageSizeClasses } from '@/lib/imageUtils';

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: boolean;
  width?: number;
  height?: number;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackText,
  size = 'md',
  className = '',
  rounded = true,
  width,
  height
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = getImageUrl(src);
  const sizeClasses = getImageSizeClasses(size);
  const shouldShowImage = imageUrl && isValidImageUrl(imageUrl) && !imageError;

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const getFallbackContent = () => {
    if (fallbackText) {
      return (
        <div className={`${sizeClasses} bg-zenith-accent text-primary flex items-center justify-center ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}>
          <span className="font-semibold text-sm">
            {getAvatarFallback(fallbackText)}
          </span>
        </div>
      );
    }

    return (
      <div className={`${sizeClasses} bg-zenith-hover text-zenith-muted flex items-center justify-center ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}>
        <User size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 32} />
      </div>
    );
  };

  if (!shouldShowImage) {
    return getFallbackContent();
  }

  return (
    <div className={`${sizeClasses} ${className} relative`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-zenith-hover animate-pulse ${rounded ? 'rounded-full' : 'rounded-lg'}`} />
      )}
      <Image
        src={imageUrl}
        alt={alt}
        width={width || (size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96)}
        height={height || (size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96)}
        className={`${rounded ? 'rounded-full' : 'rounded-lg'} object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};
