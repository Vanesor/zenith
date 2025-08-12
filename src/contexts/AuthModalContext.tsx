'use client';

import React, { createContext, useContext, useState } from 'react';

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  openAuthModal: (reason?: string, shouldRedirectOnClose?: boolean, redirectPath?: string) => void;
  closeAuthModal: () => void;
  authModalReason: string;
  shouldRedirectOnClose: boolean;
  redirectPath: string;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

interface AuthModalProviderProps {
  children: React.ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Please sign in to continue');
  const [shouldRedirectOnClose, setShouldRedirectOnClose] = useState(true);
  const [redirectPath, setRedirectPath] = useState('/login');

  const openAuthModal = (reason?: string, shouldRedirect?: boolean, redirectPath?: string) => {
    setAuthModalReason(reason || 'Please sign in to continue');
    setShouldRedirectOnClose(shouldRedirect ?? true);
    setRedirectPath(redirectPath || '/login');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalReason('Please sign in to continue');
    setShouldRedirectOnClose(true);
    setRedirectPath('/login');
  };

  return (
    <AuthModalContext.Provider
      value={{
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalReason,
        shouldRedirectOnClose,
        redirectPath,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
