'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Reply, 
  Edit3, 
  Trash2, 
  Copy, 
  Check,
  CheckCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useToast } from '@/contexts/ToastContext';

interface ChatMessageBubbleProps {
  message: {
    id: string;
    message: string;
    user_id: string;
    sender_name?: string;
    room_id: string;
    created_at: string;
    updated_at?: string;
    reply_to_message_id?: string;
    reply_to_message?: any;
    is_edited?: boolean;
    message_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
    is_deleted?: boolean;
    attachments?: any[];
  };
  currentUserId: string;
  onReply: (message: any) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  showSender: boolean;
  isConsecutive: boolean;
  isLatestInGroup: boolean;
  formatTime: (dateString: string) => string;
}

export function ChatMessageBubble({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  showSender,
  isConsecutive,
  isLatestInGroup,
  formatTime
}: ChatMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const { showToast } = useToast();
  
  const isMe = message.user_id === currentUserId;
  
  // Get message status icon
  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
      {/* Show avatar only for other users and not for consecutive messages */}
      {!isMe && (showSender || isLatestInGroup) && (
        <div className="mr-2 self-end mb-1">
          <UserAvatar 
            name={message.sender_name || 'Unknown'} 
            size="sm"
          />
        </div>
      )}
      
      <div 
        className={`relative max-w-[80%] ${isMe ? 'order-1' : 'order-2'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Sender name for others' messages */}
        {showSender && !isMe && (
          <div className="text-xs text-blue-400 ml-2 mb-1">
            {message.sender_name || 'Unknown User'}
          </div>
        )}
        
        {/* Reply preview if this is a reply */}
        {message.reply_to_message_id && (
          <div 
            className={`rounded-t-lg px-3 py-1 text-xs cursor-pointer hover:opacity-80 ${
              isMe 
                ? 'bg-college-primary text-blue-100 mr-2' 
                : 'bg-gray-700 text-gray-300 ml-2'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              // Find the original message element by ID
              const originalMsgEl = document.getElementById(`msg-${message.reply_to_message_id}`);
              if (originalMsgEl) {
                // Scroll to the original message
                originalMsgEl.scrollIntoView({ behavior: 'smooth' });
                
                // Flash highlight animation
                originalMsgEl.classList.add('bg-college-primary', 'bg-opacity-20');
                setTimeout(() => {
                  originalMsgEl.classList.remove('bg-college-primary', 'bg-opacity-20');
                }, 2000);
              }
            }}
          >
            <div className="flex items-center">
              <Reply className="w-3 h-3 mr-1" />
              <span className="font-medium truncate">
                {message.reply_to_message?.sender_name || 'Unknown'}
              </span>
            </div>
            <div className="truncate">
              {message.reply_to_message?.message || 'Message not available'}
            </div>
          </div>
        )}
        
        {/* Message content */}
        <div 
          id={`msg-${message.id}`} 
          className={`px-4 py-2 rounded-2xl transition-colors duration-500 ${
            message.reply_to_message_id 
              ? (isMe ? 'bg-college-primary text-white rounded-tr-none' : 'bg-gray-800 text-white rounded-tl-none') 
              : (isMe ? 'bg-college-primary text-white' : 'bg-gray-800 text-white')
          } ${isMe ? 'mr-2' : 'ml-2'}`}
        >
          {message.is_deleted ? (
            <span className="italic text-gray-400">
              This message was deleted
            </span>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">
                {message.message}
              </div>
              <div className="flex items-center justify-end space-x-1 mt-1">
                <span className="text-xs text-opacity-75 text-white">
                  {formatTime(message.created_at)}
                </span>
                {isMe && getMessageStatusIcon(message.message_status)}
                {message.is_edited && (
                  <span className="text-xs text-opacity-60 text-white">
                    (edited)
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Message actions */}
        {showActions && !message.is_deleted && (
          <div className={`absolute top-0 ${isMe ? 'left-0 transform -translate-x-full -translate-y-1/2' : 'right-0 transform translate-x-full -translate-y-1/2'}`}>
            <div className="bg-gray-700 rounded-full p-1 flex space-x-1 shadow-lg">
              <button className="p-1 hover:bg-gray-600 rounded-full" onClick={() => onReply(message)}>
                <Reply className="w-4 h-4 text-blue-400" />
              </button>
              {isMe && (
                <>
                  <button 
                    className="p-1 hover:bg-gray-600 rounded-full"
                    onClick={() => onEdit(message.id, message.message)}
                  >
                    <Edit3 className="w-4 h-4 text-yellow-400" />
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-600 rounded-full"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </>
              )}
              <button 
                className="p-1 hover:bg-gray-600 rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(message.message);
                  showToast({
                    type: 'success',
                    title: 'Copied',
                    message: 'Message copied to clipboard'
                  });
                }}
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
