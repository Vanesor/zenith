"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { ToastProvider as OldToastProvider } from "@/contexts/ToastContext";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SessionProvider } from "next-auth/react";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import GlobalAuthGuard from "@/components/GlobalAuthGuard";
import { PaperpalLayoutWrapper } from "@/components/PaperpalLayoutWrapper";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SessionProvider>
        <AuthProvider>
          <AuthModalProvider>
            <OldToastProvider>
              <GlobalAuthGuard>
                <PaperpalLayoutWrapper>{children}</PaperpalLayoutWrapper>
              </GlobalAuthGuard>
              <GlobalAuthModal />
              <ToastProvider />
            </OldToastProvider>
          </AuthModalProvider>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
