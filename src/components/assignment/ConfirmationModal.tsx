'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600 dark:text-red-400',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200 dark:border-red-600'
        };
      case 'warning':
        return {
          icon: 'text-amber-600 dark:text-amber-400',
          confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          border: 'border-amber-200 dark:border-amber-600'
        };
      case 'info':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          border: 'border-blue-200 dark:border-blue-600'
        };
      default:
        return {
          icon: 'text-red-600 dark:text-red-400',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200 dark:border-red-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center ${styles.border}`}>
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {message}
              </p>
            </div>
            
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
