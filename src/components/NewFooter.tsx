"use client";

import React from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Heart
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zenith-section dark:bg-gray-900 border-t border-zenith-border dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* College Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-zenith-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">GEC</span>
              </div>
              <div>
                <h3 className="font-bold text-zenith-primary dark:text-white">
                  Government Engineering College
                </h3>
              </div>
            </div>
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
              Leading institution in technical education, fostering innovation and excellence 
              in engineering and technology since 1995.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="#" 
                className="text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className="text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className="text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className="text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-zenith-primary dark:text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/assignments" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Assignments
                </Link>
              </li>
              <li>
                <Link 
                  href="/events" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link 
                  href="/discussions" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Discussions
                </Link>
              </li>
              <li>
                <Link 
                  href="/members" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Members
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-zenith-primary dark:text-white">Zenith Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  About Platform
                </Link>
              </li>
              <li>
                <Link 
                  href="/help" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-blue-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-zenith-primary dark:text-white">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-zenith-muted mt-1 flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  123 Engineering Road,<br />
                  Tech City, TC 12345
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-zenith-muted flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  +1 (555) 123-4567
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-zenith-muted flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  info@gec.edu
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zenith-border dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
              © 2025 Government Engineering College. All rights reserved.
            </p>
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted flex items-center">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by GEC Students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
