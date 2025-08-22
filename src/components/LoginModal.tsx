'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, Lock, User, Code2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectMessage?: string;
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  message = "Authentication Required",
  redirectMessage = "Please log in to access the Code Playground and start coding!" 
}: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 border border-custom"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zenith-hover transition-colors"
        >
          <X className="w-5 h-5 text-zenith-muted" />
        </button>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-zenith-primary to-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">{message}</h2>
          <p className="text-zenith-secondary text-center">
            {redirectMessage}
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 text-sm text-zenith-secondary">
            <Code2 className="w-4 h-4 text-primary" />
            <span>Multi-language code execution</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-zenith-secondary">
            <User className="w-4 h-4 text-primary" />
            <span>Save and share your code</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-zenith-secondary">
            <Lock className="w-4 h-4 text-primary" />
            <span>Secure code execution environment</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/login?redirect=/playground"
            className="block w-full bg-gradient-to-r from-zenith-primary to-blue-600 text-primary text-center py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
          >
            Log In to Continue
          </Link>
          <Link
            href="/register?redirect=/playground"
            className="block w-full border border-custom text-primary text-center py-3 px-4 rounded-lg font-semibold hover:bg-zenith-hover transition-colors"
          >
            Create New Account
          </Link>
        </div>

        {/* Bottom Note */}
        <p className="text-xs text-zenith-muted text-center mt-6">
          Join the Zenith community and access all features including assignments, events, and more!
        </p>
      </motion.div>
    </div>
  );
}
