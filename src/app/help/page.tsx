"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Lock, 
  Settings, 
  MessageSquare,
  Calendar,
  Users,
  FileText,
  Home,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I join a club?',
    answer: 'To join a club, first register an account on Zenith Forum. Once logged in, browse the available clubs and click "Join" on any club page. You can also visit club pages directly without authentication to learn more about them.',
    category: 'clubs'
  },
  {
    id: '2',
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page. Enter your email address and you\'ll receive a password reset link. Follow the instructions in the email to set a new password.',
    category: 'account'
  },
  {
    id: '3',
    question: 'How do I create an event?',
    answer: 'Only club coordinators and committee members can create events. Go to your club\'s dashboard and click "Create Event". Fill in the event details including title, description, date, time, and location.',
    category: 'events'
  },
  {
    id: '4',
    question: 'How do I create a post?',
    answer: 'Navigate to your club\'s page and click "Create Post". Add a title, content, and optional tags. Posts can include text, images, and links to resources.',
    category: 'posts'
  },
  {
    id: '5',
    question: 'Who can see my profile information?',
    answer: 'Your basic profile information (name, club memberships) is visible to other club members. Your email and personal details are kept private unless you choose to share them.',
    category: 'privacy'
  },
  {
    id: '6',
    question: 'How do I enable two-factor authentication?',
    answer: 'Go to Settings > Security and click "Enable 2FA". Follow the setup instructions using your preferred authenticator app like Google Authenticator or Authy.',
    category: 'security'
  },
  {
    id: '7',
    question: 'Can I join multiple clubs?',
    answer: 'Yes! You can join multiple clubs that interest you. Each club has its own activities, events, and discussions.',
    category: 'clubs'
  },
  {
    id: '8',
    question: 'How do I contact club coordinators?',
    answer: 'You can find coordinator contact information on each club\'s page. You can also send messages through the platform or attend club events to meet them in person.',
    category: 'clubs'
  },
  {
    id: '9',
    question: 'What are the different user roles?',
    answer: 'Zenith has several roles: Regular Members, Committee Members, Coordinators, Co-Coordinators, Secretaries, and Admins. Each role has different permissions for managing clubs and content.',
    category: 'account'
  },
  {
    id: '10',
    question: 'How do I report inappropriate content?',
    answer: 'If you see inappropriate content, contact the club coordinators or use the support form to report it to administrators. We take community guidelines seriously.',
    category: 'safety'
  }
];

const categories = [
  { id: 'all', name: 'All Topics', icon: HelpCircle },
  { id: 'account', name: 'Account & Profile', icon: User },
  { id: 'clubs', name: 'Clubs & Membership', icon: Users },
  { id: 'events', name: 'Events', icon: Calendar },
  { id: 'posts', name: 'Posts & Content', icon: FileText },
  { id: 'security', name: 'Security & Privacy', icon: Lock },
  { id: 'safety', name: 'Safety & Reporting', icon: Settings }
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-zenith-main">
      {/* Header */}
      <header className="bg-zenith-nav border-b border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-zenith-muted hover:text-zenith-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <Link
              href="/"
              className="flex items-center space-x-2"
            >
              <Home className="w-5 h-5 text-zenith-primary" />
              <span className="font-semibold text-zenith-primary">Zenith Forum</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-zenith-accent rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zenith-primary mb-4">Help & Support</h1>
          <p className="text-xl text-zenith-secondary max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of Zenith Forum
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zenith-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-zenith-card border border-zenith-border rounded-xl text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-zenith-accent text-white'
                      : 'bg-zenith-card text-zenith-secondary hover:bg-zenith-hover border border-zenith-border'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-zenith-primary mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-zenith-card border border-zenith-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zenith-hover transition-colors"
                >
                  <span className="font-semibold text-zenith-primary">{faq.question}</span>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-zenith-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zenith-muted" />
                  )}
                </button>
                
                {expandedFAQ === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-zenith-secondary leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zenith-muted text-lg">
                No results found for "{searchTerm}". Try a different search term or category.
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-zenith-section rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-zenith-primary mb-6 text-center">
            Need More Help?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/contact"
              className="bg-zenith-card border border-zenith-border rounded-xl p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <MessageSquare className="w-8 h-8 text-zenith-accent mx-auto mb-4" />
              <h3 className="font-semibold text-zenith-primary mb-2">Contact Us</h3>
              <p className="text-zenith-secondary text-sm">
                Get in touch with our support team
              </p>
            </Link>
            
            <Link
              href="/support"
              className="bg-zenith-card border border-zenith-border rounded-xl p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Settings className="w-8 h-8 text-zenith-accent mx-auto mb-4" />
              <h3 className="font-semibold text-zenith-primary mb-2">Support Center</h3>
              <p className="text-zenith-secondary text-sm">
                Submit a support ticket or request
              </p>
            </Link>
            
            <Link
              href="/terms"
              className="bg-zenith-card border border-zenith-border rounded-xl p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <FileText className="w-8 h-8 text-zenith-accent mx-auto mb-4" />
              <h3 className="font-semibold text-zenith-primary mb-2">Terms & Privacy</h3>
              <p className="text-zenith-secondary text-sm">
                Review our terms and privacy policy
              </p>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
