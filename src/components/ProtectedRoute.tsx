'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalLoader } from './UniversalLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
  loadingMessage?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/login',
  loadingMessage = 'Verifying access...'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated, redirect to login
      router.push(fallbackPath);
      return;
    }

    if (!isLoading && user && requiredRoles.length > 0) {
      // Check if user has required role
      if (!requiredRoles.includes(user.role)) {
        // User doesn't have required role, redirect to dashboard
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, requiredRoles, fallbackPath, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <UniversalLoader message={loadingMessage} />;
  }

  // If user is not authenticated, show loading (will redirect)
  if (!user) {
    return <UniversalLoader message="Redirecting to login..." />;
  }

  // If specific roles are required and user doesn't have them
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <UniversalLoader message="Access denied. Redirecting..." />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

// Higher-order component for pages that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRoles?: string[];
    fallbackPath?: string;
    loadingMessage?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Pre-configured components for common use cases
export const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={['admin']} loadingMessage="Verifying admin access...">
    {children}
  </ProtectedRoute>
);

export const CoordinatorRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute 
    requiredRoles={['admin', 'coordinator', 'co_coordinator']} 
    loadingMessage="Verifying coordinator access..."
  >
    {children}
  </ProtectedRoute>
);

export const StudentRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute 
    requiredRoles={['student', 'admin', 'coordinator', 'co_coordinator']} 
    loadingMessage="Verifying student access..."
  >
    {children}
  </ProtectedRoute>
);
