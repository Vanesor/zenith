"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  User, 
  MessageSquare, 
  Clock,
  ArrowLeft,
  Home,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset form and show success message
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      type: 'general'
    });
    setIsSubmitting(false);
    setSubmitSuccess(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email and we\'ll respond within 24 hours',
      contact: 'support@zenithforum.edu',
      action: 'mailto:support@zenithforum.edu'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our support team',
      contact: '+91 (555) 123-4567',
      action: 'tel:+915551234567'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'St. Vincent Pallotti College of Engineering and Technology',
      contact: 'Nagpur, Maharashtra, India',
      action: 'https://maps.google.com'
    }
  ];

  const officeHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' }
  ];

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
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zenith-primary mb-4">Contact Us</h1>
          <p className="text-xl text-zenith-secondary max-w-2xl mx-auto">
            Get in touch with us. We're here to help and answer any questions you might have.
          </p>
        </motion.div>

        {/* Success Message */}
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 max-w-2xl mx-auto"
          >
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Send className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Message sent successfully! We'll get back to you soon.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-zenith-card border border-zenith-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-zenith-primary mb-6">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zenith-primary mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted w-5 h-5" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={contactForm.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-zenith-main border border-zenith-border rounded-lg text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zenith-primary mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={contactForm.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-zenith-main border border-zenith-border rounded-lg text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-zenith-primary mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={contactForm.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zenith-main border border-zenith-border rounded-lg text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="club">Club Related</option>
                    <option value="events">Events & Activities</option>
                    <option value="account">Account Issues</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-zenith-primary mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={contactForm.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zenith-main border border-zenith-border rounded-lg text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
                    placeholder="Brief description of your inquiry"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zenith-primary mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={contactForm.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zenith-main border border-zenith-border rounded-lg text-zenith-primary placeholder-zenith-muted focus:outline-none focus:ring-2 focus:ring-zenith-accent focus:border-transparent"
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zenith-accent hover:bg-zenith-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Contact Methods */}
            <div className="bg-zenith-card border border-zenith-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-zenith-primary mb-6">Get in touch</h2>
              <div className="space-y-6">
                {contactMethods.map((method, index) => {
                  const IconComponent = method.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-zenith-accent/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-zenith-accent" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-zenith-primary">{method.title}</h3>
                        <p className="text-zenith-secondary text-sm mb-2">{method.description}</p>
                        <a
                          href={method.action}
                          className="text-zenith-accent hover:text-zenith-accent/80 font-medium inline-flex items-center"
                          target={method.action.startsWith('http') ? '_blank' : undefined}
                          rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {method.contact}
                          {method.action.startsWith('http') && (
                            <ExternalLink className="w-4 h-4 ml-1" />
                          )}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-zenith-card border border-zenith-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-zenith-primary mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Office Hours
              </h2>
              <div className="space-y-3">
                {officeHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zenith-border last:border-b-0">
                    <span className="font-medium text-zenith-primary">{schedule.day}</span>
                    <span className="text-zenith-secondary">{schedule.hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-zenith-main rounded-lg">
                <p className="text-sm text-zenith-secondary">
                  <strong>Note:</strong> For urgent technical issues outside office hours, 
                  please email us and we'll respond as soon as possible.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-zenith-card border border-zenith-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-zenith-primary mb-6">Quick Links</h2>
              <div className="space-y-3">
                <Link href="/help" className="block text-zenith-accent hover:text-zenith-accent/80 transition-colors">
                  → Help & FAQ
                </Link>
                <Link href="/support" className="block text-zenith-accent hover:text-zenith-accent/80 transition-colors">
                  → Support Center
                </Link>
                <Link href="/terms" className="block text-zenith-accent hover:text-zenith-accent/80 transition-colors">
                  → Terms of Service
                </Link>
                <Link href="/privacy" className="block text-zenith-accent hover:text-zenith-accent/80 transition-colors">
                  → Privacy Policy
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
