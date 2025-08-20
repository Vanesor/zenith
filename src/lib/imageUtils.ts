// Image utility functions for Zenith application
// Handles image URLs, fallbacks, and proper rendering

export interface ImageConfig {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const getImageUrl = (imageData: any): string | null => {
  // Handle different image field formats from the database
  if (!imageData) return null;
  
  // Direct URL string
  if (typeof imageData === 'string' && imageData.trim()) {
    return imageData;
  }
  
  // JSON object with URL
  if (typeof imageData === 'object') {
    // Check various possible field names
    const url = imageData.url || imageData.image_url || imageData.avatar || imageData.src;
    if (url && typeof url === 'string' && url.trim()) {
      return url;
    }
  }
  
  return null;
};

export const getAvatarFallback = (name?: string, email?: string): string => {
  const initial = name?.charAt(0) || email?.charAt(0) || 'U';
  return initial.toUpperCase();
};

export const getImageSizeClasses = (size: string = 'md'): string => {
  const sizeMap = {
    'sm': 'w-8 h-8',
    'md': 'w-12 h-12', 
    'lg': 'w-16 h-16',
    'xl': 'w-24 h-24'
  };
  return sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
};

export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's a valid HTTP/HTTPS URL
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // Check if it's a relative path
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
};

export const getClubLogoUrl = (clubId: string): string => {
  // Return logo path based on club ID
  return `/logos/${clubId.toLowerCase()}.svg`;
};

export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackContent?: string
): void => {
  const img = event.currentTarget;
  const parent = img.parentElement;
  
  if (parent) {
    // Hide the broken image
    img.style.display = 'none';
    
    // Show fallback if provided
    if (fallbackContent) {
      const fallback = document.createElement('div');
      fallback.innerHTML = fallbackContent;
      fallback.className = 'flex items-center justify-center w-full h-full bg-zenith-hover rounded-full';
      parent.appendChild(fallback);
    }
  }
};

// Handle clipboard paste events for images
export const handleClipboardPaste = async (
  event: ClipboardEvent,
  onImageCapture: (file: File) => void,
  onTextCapture?: (text: string) => void
): Promise<void> => {
  if (!event.clipboardData) return;

  // Handle images
  const items = Array.from(event.clipboardData.items);
  for (const item of items) {
    // Handle image paste
    if (item.type.indexOf('image') === 0) {
      const file = item.getAsFile();
      if (file && onImageCapture) {
        // Prevent default to avoid duplicate paste
        event.preventDefault();
        onImageCapture(file);
        return;
      }
    }
    
    // Handle text paste if no image is found and handler is provided
    else if (item.type === 'text/plain' && onTextCapture) {
      item.getAsString((text) => {
        onTextCapture(text);
      });
    }
  }
};

// Upload an image file to supabase storage
export const uploadImageToStorage = async (
  file: File, 
  folderPath: string = 'chat'
): Promise<string | null> => {
  try {
    // Generate a unique filename to avoid collisions
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `${folderPath}/${fileName}`;
    
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', fullPath);
    
    // Send the upload request to our API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};
