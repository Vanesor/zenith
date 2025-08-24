import { useState, useCallback } from 'react';

export interface UploadedImage {
  success: boolean;
  fileUrl: string;
  fileId: string;
  thumbnailUrl?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface UseImageUploadOptions {
  endpoint?: string; // Custom endpoint to use
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
  uploadImage: (file: File, customData?: FormData) => Promise<UploadedImage | null>;
  uploadMultiple: (files: FileList | File[]) => Promise<UploadedImage[]>;
  deleteImage: (fileId: string, endpoint?: string) => Promise<boolean>;
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
    endpoint = '/api/upload', // Default general upload endpoint
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

  const uploadImage = useCallback(async (file: File, customData?: FormData): Promise<UploadedImage | null> => {
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
      const formData = customData || new FormData();
      if (!customData) {
        formData.append('file', file);
        formData.append('path', folder);
        if (maxWidth) formData.append('maxWidth', maxWidth.toString());
        if (maxHeight) formData.append('maxHeight', maxHeight.toString());
      }

      // Upload with progress tracking
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      }

      const uploadedImage: UploadedImage = {
        success: result.success,
        fileUrl: result.url || result.fileUrl,
        fileId: result.fileId,
        thumbnailUrl: result.thumbnailUrl,
        fileName: result.fileName || file.name,
        fileType: result.fileType || file.type,
        fileSize: result.fileSize || file.size
      };

      onSuccess?.(uploadedImage);
      return uploadedImage;

    } catch (uploadError) {
      const errorMsg = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [endpoint, folder, maxWidth, maxHeight, validateFile, onProgress, onSuccess, onError]);

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

  const deleteImage = useCallback(async (fileId: string, deleteEndpoint?: string): Promise<boolean> => {
    try {
      setError(null);
      
      const deleteUrl = deleteEndpoint || `/api/media/${fileId}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return true;
      } else {
        const errorMsg = result.error || 'Failed to delete file';
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
