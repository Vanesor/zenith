import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { ToastProvider as OldToastProvider } from "@/contexts/ToastContext";
import { ToastProvider } from "@/components/ui/toast-provider";
import { PaperpalLayoutWrapper } from "@/components/PaperpalLayoutWrapper";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import GlobalAuthGuard from "@/components/GlobalAuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenith - College Department Forum",
  description:
    "Connect with specialized clubs and enhance your college experience through Ascend, Aster, Achievers, and Altogether.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
