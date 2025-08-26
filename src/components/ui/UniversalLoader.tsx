import { FC } from 'react';

interface UniversalLoaderProps {
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'blue' | 'purple';
  text?: string;
  className?: string;
}

const UniversalLoader: FC<UniversalLoaderProps> = ({ 
  size = 'medium', 
  theme = 'blue', 
  text = 'Loading...', 
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      spinner: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2'
    },
    medium: {
      spinner: 'w-6 h-6',
      text: 'text-base',
      gap: 'gap-3'
    },
    large: {
      spinner: 'w-8 h-8',
      text: 'text-lg',
      gap: 'gap-4'
    }
  };

  // Theme configurations
  const themeConfig = {
    light: {
      spinner: 'border-gray-300 border-t-gray-600',
      text: 'text-gray-600',
      bg: 'bg-white/80'
    },
    dark: {
      spinner: 'border-gray-600 border-t-gray-300',
      text: 'text-gray-300',
      bg: 'bg-black/80'
    },
    blue: {
      spinner: 'border-blue-200 border-t-blue-600',
      text: 'text-blue-600',
      bg: 'bg-blue-50/80'
    },
    purple: {
      spinner: 'border-purple-200 border-t-purple-600',
      text: 'text-purple-600',
      bg: 'bg-purple-50/80'
    }
  };

  const sizeClasses = sizeConfig[size];
  const themeClasses = themeConfig[theme];

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${themeClasses.bg} rounded-lg backdrop-blur-sm ${className}`}>
      <div className={`flex items-center ${sizeClasses.gap}`}>
        {/* Spinning loader */}
        <div
          className={`
            ${sizeClasses.spinner} 
            ${themeClasses.spinner} 
            border-2 
            rounded-full 
            animate-spin
          `}
        />
        
        {/* Loading text */}
        <span className={`${sizeClasses.text} ${themeClasses.text} font-medium`}>
          {text}
        </span>
      </div>
    </div>
  );
};

export default UniversalLoader;
