'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${getSizeClasses()} animate-spin text-blue-600 dark:text-blue-400`} />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  );
}

interface FullscreenLoadingProps {
  title?: string;
  message?: string;
}

export function FullscreenLoading({ 
  title = 'Creating Assignment...', 
  message = 'Please wait while we process your assignment.'
}: FullscreenLoadingProps) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {message}
          </p>
          
          <div className="mt-6 flex items-center justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
