import { useState, useCallback } from 'react';

export interface UploadedImage {
  public_id: string;
  urls: {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  };
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface UseImageUploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onSuccess?: (image: UploadedImage) => void;
  onError?: (error: string) => void;
}

export interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<UploadedImage | null>;
  uploadMultiple: (files: FileList | File[]) => Promise<UploadedImage[]>;
  deleteImage: (publicId: string) => Promise<boolean>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  clearError: () => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    folder = 'general',
    maxWidth,
    maxHeight,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    onProgress,
    onSuccess,
    onError
  } = options;

  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`;
    }
    
    return null;
  }, [allowedTypes, maxFileSize]);

  const uploadImage = useCallback(async (file: File): Promise<UploadedImage | null> => {
    try {
      setError(null);
      
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (maxWidth) formData.append('maxWidth', maxWidth.toString());
      if (maxHeight) formData.append('maxHeight', maxHeight.toString());

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise<UploadedImage | null>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                const uploadedImage = response.data as UploadedImage;
                onSuccess?.(uploadedImage);
                resolve(uploadedImage);
              } else {
                const errorMsg = response.error || 'Upload failed';
                setError(errorMsg);
                onError?.(errorMsg);
                resolve(null);
              }
            } catch (parseError) {
              const errorMsg = 'Failed to parse response';
              setError(errorMsg);
              onError?.(errorMsg);
              resolve(null);
            }
          } else {
            const errorMsg = `Upload failed with status ${xhr.status}`;
            setError(errorMsg);
            onError?.(errorMsg);
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => {
          const errorMsg = 'Network error during upload';
          setError(errorMsg);
          onError?.(errorMsg);
          resolve(null);
        });

        xhr.open('POST', '/api/upload/images');
        xhr.send(formData);
      });

    } catch (uploadError) {
      const errorMsg = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, maxWidth, maxHeight, validateFile, onProgress, onSuccess, onError]);

  const uploadMultiple = useCallback(async (files: FileList | File[]): Promise<UploadedImage[]> => {
    const fileArray = Array.from(files);
    const results: UploadedImage[] = [];
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const result = await uploadImage(file);
        if (result) {
          results.push(result);
        }
        
        // Update overall progress
        setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
        onProgress?.(Math.round(((i + 1) / fileArray.length) * 100));
      }
    } catch (error) {
      console.error('Error uploading multiple files:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
    
    return results;
  }, [uploadImage, onProgress]);

  const deleteImage = useCallback(async (publicId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/upload/images?public_id=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return true;
      } else {
        const errorMsg = result.error || 'Failed to delete image';
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    } catch (deleteError) {
      const errorMsg = deleteError instanceof Error ? deleteError.message : 'Delete failed';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadImage,
    uploadMultiple,
    deleteImage,
    isUploading,
    uploadProgress,
    error,
    clearError
  };
}
