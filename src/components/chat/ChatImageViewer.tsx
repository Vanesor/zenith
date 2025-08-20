'use client';

import { useState } from 'react';
import { X, Download, Maximize2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatImageViewerProps {
  imageUrl: string;
  sender: string;
  timestamp: string;
  onClose: () => void;
}

export function ChatImageViewer({ imageUrl, sender, timestamp, onClose }: ChatImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(imageUrl).catch(err => {
      console.error('Could not copy image URL: ', err);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-[90vh] w-full'}`}>
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-center z-10">
          <div>
            <div className="text-white font-medium">{sender}</div>
            <div className="text-gray-300 text-sm">{timestamp}</div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={handleDownload}
              className="text-white hover:text-blue-400 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={handleCopy}
              className="text-white hover:text-blue-400 transition-colors"
              title="Copy URL"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:text-blue-400 transition-colors"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25 }}
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={imageUrl} 
            alt={`Image shared by ${sender}`}
            className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'max-w-full max-h-[80vh] rounded-lg'}`}
          />
        </motion.div>
      </div>
    </div>
  );
}
