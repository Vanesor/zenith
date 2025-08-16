"use client";

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          border: '1px solid var(--toast-border)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
        // Success toasts
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
          style: {
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          },
        },
        // Error toasts
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
          style: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#DC2626',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          },
        },
        // Loading toasts
        loading: {
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#ffffff',
          },
          style: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#2563EB',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          },
        },
      }}
    />
  );
}
