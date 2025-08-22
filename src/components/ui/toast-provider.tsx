"use client";

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Enhanced default options with professional styling
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          border: '1px solid var(--toast-border)',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '400px',
          wordWrap: 'break-word',
          transform: 'translateZ(0)', // Hardware acceleration
        },
        // Enhanced Success toasts
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
          style: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
            color: 'var(--toast-color)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            animation: 'slideInRight 0.3s ease-out',
          },
        },
        // Enhanced Error toasts
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
            color: 'var(--toast-color)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            animation: 'slideInRight 0.3s ease-out',
          },
        },
        // Enhanced Loading toasts
        loading: {
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#ffffff',
          },
          style: {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))',
            color: 'var(--toast-color)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            animation: 'slideInRight 0.3s ease-out',
          },
        },
      }}
    />
  );
}
