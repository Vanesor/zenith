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
    <footer className="bg-zenith-section dark:bg-gray-900 border-t border-custom dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* College Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src="/collegelogo.png"
                  alt="St. Vincent Pallotti College Logo"
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="font-bold text-primary">
                  St. Vincent Pallotti College
                </h3>
                <p className="text-xs text-zenith-secondary dark:text-zenith-muted">
                  of Engineering & Technology
                </p>
              </div>
            </div>
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
              Established in 2004 by the Nagpur Pallottine Society. Accredited by NAAC with A grade.
              Affiliated to Nagpur University and approved by AICTE, Government of India.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="https://www.facebook.com/stvincentngp/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link 
                href="https://twitter.com/techpallottines" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link 
                href="https://www.instagram.com/svpcetnagpur" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                href="https://www.linkedin.com/school/svpcet/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/assignments" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Assignments
                </Link>
              </li>
              <li>
                <Link 
                  href="/events" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link 
                  href="/members" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Members
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">
              ZENITH <span className="text-xs text-zenith-secondary dark:text-zenith-muted ml-1">Forum</span>
            </h4>
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-3">
              Department of Computer Engineering's official student forum for academic collaboration, 
              knowledge sharing, and community building.
            </p>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  About Platform
                </Link>
              </li>
              <li>
                <Link 
                  href="/help" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-zenith-muted mt-1 flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  Gavsi Manapur, Wardha Road,<br />
                  Nagpur, Maharashtra - 441108
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-zenith-muted flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  +91 7743979315
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-zenith-muted flex-shrink-0" />
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  info@stvincentngp.edu.in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-custom dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
              © {new Date().getFullYear()} St. Vincent Pallotti College of Engineering & Technology. All rights reserved.
            </p>
            <p className="text-sm text-zenith-secondary dark:text-zenith-muted flex items-center">
              <span className="mr-1">Zenith Forum</span>
              <Heart className="w-4 h-4 text-red-500 mx-1" />
              <span className="ml-1">Department of Computer Engineering</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
