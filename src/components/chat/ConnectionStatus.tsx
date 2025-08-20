'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  onRetry?: () => void;
  attemptCount?: number;
}

export function ConnectionStatus({ 
  status, 
  onRetry,
  attemptCount = 0
}: ConnectionStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-[60px] left-0 right-0 flex justify-center z-50"
    >
      <div className={`
        flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-md
        ${status === 'connected' ? 'bg-green-500 text-white' : ''}
        ${status === 'connecting' ? 'bg-yellow-500 text-white' : ''}
        ${status === 'disconnected' ? 'bg-red-500 text-white' : ''}
      `}>
        {status === 'connected' && (
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Wifi className="w-4 h-4 mr-1.5" />
            <span>Connected</span>
          </motion.div>
        )}
        
        {status === 'connecting' && (
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4 mr-1.5" />
            </motion.div>
            <span>{attemptCount > 1 
              ? `Reconnecting... (Attempt ${attemptCount})` 
              : 'Connecting...'
            }</span>
          </motion.div>
        )}
        
        {status === 'disconnected' && (
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <WifiOff className="w-4 h-4 mr-1.5" />
            <span className="mr-2">Connection lost</span>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-0.5 rounded text-xs ml-1"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
