import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext"; // Use the original ThemeContext
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import GlobalAuthModal from "@/components/GlobalAuthModal";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 bg-zenith-main text-zenith-primary`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AuthModalProvider>
              <ToastProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
                <GlobalAuthModal />
              </ToastProvider>
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
