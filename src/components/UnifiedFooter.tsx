"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function UnifiedFooter() {
  return (
    <footer className="bg-zenith-card border-t border-zenith-border mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* College Information */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/pallotti-logo.png"
                alt="St. Vincent Pallotti College Logo"
                width={60}
                height={60}
                className="object-cover rounded-full"
              />
              <h3 className="text-lg font-bold text-zenith-primary">St. Vincent Pallotti College</h3>
            </div>
            <p className="text-sm text-zenith-secondary mb-2 text-center md:text-left">
              Department of Computer Engineering
            </p>
            <p className="text-sm text-zenith-secondary mb-4 text-center md:text-left">
              NAAC Accredited 'A' Grade
            </p>
            <div className="flex items-center gap-2 text-sm text-zenith-secondary mb-2">
              <MapPin size={16} />
              <span>Gavsi Manapur, Wardha Road, Nagpur - 441108</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zenith-secondary mb-2">
              <Mail size={16} />
              <a href="mailto:info@stvincentngp.edu.in" className="hover:text-zenith-accent transition-colors">
                info@stvincentngp.edu.in
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-zenith-secondary">
              <Phone size={16} />
              <a href="tel:+917743979315" className="hover:text-zenith-accent transition-colors">
                +91 7743979315
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold text-zenith-primary mb-4">Quick Links</h3>
            <ul className="space-y-2 text-center md:text-left">
              <li>
                <Link href="/about" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  About Zenith
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Clubs
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/assignments" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Assignments
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Chat
                </Link>
              </li>
              <li>
                <Link href="/playground" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-zenith-secondary hover:text-zenith-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Zenith & Social */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight text-zenith-primary">ZENITH</h2>
              <span className="text-xs text-zenith-secondary ml-2">Forum</span>
            </div>
            <p className="text-sm text-zenith-secondary mb-4 text-center md:text-left">
              Department of Computer Engineering's official student forum for academic collaboration, 
              knowledge sharing, and community building.
            </p>

            <h4 className="text-md font-semibold text-zenith-primary mb-2">Connect with us</h4>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/stvincentngp/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-secondary hover:text-zenith-accent transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/svpcetnagpur" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-secondary hover:text-zenith-accent transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://twitter.com/techpallottines" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-secondary hover:text-zenith-accent transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://www.linkedin.com/school/svpcet/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-secondary hover:text-zenith-accent transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://www.youtube.com/channel/UCwI-u4lNseB2N9t2H5otnVA" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zenith-secondary hover:text-zenith-accent transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-zenith-border mt-8 pt-6 text-center">
          <p className="text-sm text-zenith-secondary">
            &copy; {new Date().getFullYear()} Zenith Forum, Department of Computer Engineering | St. Vincent Pallotti College of Engineering & Technology
          </p>
          <p className="text-xs text-zenith-secondary mt-1">
            Affiliated to Nagpur University | Approved by AICTE, Government of India
          </p>
        </div>
      </div>
    </footer>
  );
}

export default UnifiedFooter;
