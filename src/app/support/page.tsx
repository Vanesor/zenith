"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Send, User } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form and show success message
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setIsSubmitting(false);
    setSubmitSuccess(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000);
  };
  
  return (
    <div className="min-h-screen bg-zenith-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Support & Contact
          </h1>
          <p className="text-xl text-zenith-secondary max-w-3xl mx-auto">
            Have questions or need assistance with Zenith? Our team is here to help you with any inquiries.
          </p>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <div className="bg-zenith-card rounded-2xl p-8 shadow-xl border border-zenith-border">
              <h2 className="text-3xl font-bold text-zenith-primary mb-8">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-zenith-primary">Email</h3>
                    <p className="text-zenith-secondary">zenith.forum@stvincentngp.edu.in</p>
                    <p className="text-zenith-muted text-sm mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-zenith-primary">Phone</h3>
                    <p className="text-zenith-secondary">+91 99999 88888</p>
                    <p className="text-zenith-muted text-sm mt-1">Mon-Fri from 9am to 5pm</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-zenith-primary">Address</h3>
                    <p className="text-zenith-secondary">St. Vincent Pallotti College of Engineering and Technology</p>
                    <p className="text-zenith-muted text-sm mt-1">Nagpur, Maharashtra, India</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-zenith-border">
                <h3 className="text-lg font-medium text-zenith-primary mb-4">Contact Us</h3>
                <div className="flex space-x-4">
                  <a href="mailto:zenith.forum@stvincentngp.edu.in" className="bg-zenith-hover hover:bg-zenith-section p-3 rounded-full text-zenith-secondary hover:text-blue-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                  <a href="https://github.com/zenith-forum" className="bg-zenith-hover hover:bg-zenith-section p-3 rounded-full text-zenith-secondary hover:text-blue-600 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-zenith-card rounded-2xl p-8 shadow-xl border border-zenith-border">
              <h2 className="text-3xl font-bold text-zenith-primary mb-8">Send Us a Message</h2>
              
              {submitSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 mb-4">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium text-green-800 dark:text-green-300 mb-2">Message Sent!</h3>
                  <p className="text-green-700 dark:text-green-400">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-zenith-secondary mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={contactForm.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-zenith-border bg-zenith-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-zenith-secondary mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-zenith-border bg-zenith-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-zenith-secondary mb-2">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-zenith-border bg-zenith-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-zenith-secondary mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-zenith-border bg-zenith-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Please describe your question or issue in detail..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* FAQs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 bg-zenith-card rounded-2xl p-8 shadow-xl border border-zenith-border"
        >
          <h2 className="text-3xl font-bold text-zenith-primary mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-6 bg-zenith-hover rounded-xl">
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">How do I join a club on Zenith?</h3>
              <p className="text-zenith-secondary">
                You can browse all available clubs on the Clubs page and request to join any club that interests you. 
                Club coordinators will review your request and approve it accordingly.
              </p>
            </div>
            
            <div className="p-6 bg-zenith-hover rounded-xl">
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">How can I create a new project?</h3>
              <p className="text-zenith-secondary">
                If you have the necessary permissions as a club coordinator or committee member, 
                you can create a new project from the Projects page by clicking on "Create Project".
              </p>
            </div>
            
            <div className="p-6 bg-zenith-hover rounded-xl">
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">How do I submit an assignment?</h3>
              <p className="text-zenith-secondary">
                Navigate to the Assignments page, find the assignment you need to submit, and click on it. 
                You'll find submission instructions and a submission form on the assignment details page.
              </p>
            </div>
            
            <div className="p-6 bg-zenith-hover rounded-xl">
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">How can I reset my password?</h3>
              <p className="text-zenith-secondary">
                Go to the login page and click on "Forgot Password". Follow the instructions sent to your email to reset your password.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
