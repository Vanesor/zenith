'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Upload } from 'lucide-react';

interface ChatImageUploadProps {
  onImageUploaded: (url: string) => void;
  onCancel: () => void;
  initialImage?: File | null;
  roomId?: string;
}

export function ChatImageUpload({ onImageUploaded, onCancel, initialImage = null, roomId }: ChatImageUploadProps) {
  const [image, setImage] = useState<File | null>(initialImage);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generate preview when image changes
  React.useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    
    // Clean up the object URL when component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB for chat images)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }
    
    setImage(file);
    setError(null);
  };
  
  // Handle upload using MediaService via API
  const handleUpload = async () => {
    if (!image) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', image);
      if (roomId) {
        formData.append('roomId', roomId);
      }
      
      const response = await fetch('/api/chat/upload-attachment', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }
      
      onImageUploaded(result.fileUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-primary">Upload Image</h3>
        <button 
          className="text-gray-400 hover:text-primary"
          onClick={onCancel}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Image preview */}
      {preview ? (
        <div className="relative mb-4">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto rounded-lg object-contain max-h-64"
          />
          <button
            className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 rounded-full p-1"
            onClick={() => {
              setImage(null);
              setPreview(null);
            }}
          >
            <X className="w-4 h-4 text-primary" />
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 text-gray-500 mb-3" />
          <p className="text-gray-400 text-center">
            Click to select an image<br />
            <span className="text-sm">or drag and drop</span>
          </p>
        </div>
      )}
      
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex space-x-3">
        <button 
          className="flex-1 py-2 px-4 bg-gray-700 text-primary rounded-lg hover:bg-gray-600 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center transition-colors ${
            !image || uploading
              ? 'bg-blue-600 bg-opacity-50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
          onClick={handleUpload}
          disabled={!image || uploading}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload
        </button>
      </div>
    </div>
  );
}
