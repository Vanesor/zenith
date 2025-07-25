"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Calendar,
  Users,
  BookOpen,
  Lightbulb,
  Code,
  MessageSquare,
  GraduationCap,
  Heart,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";

const clubs = [
  {
    name: "Ascend",
    type: "Coding Club",
    description: "Programming challenges, hackathons, and tech innovation",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    members: 156,
  },
  {
    name: "Aster",
    type: "Soft Skills Club",
    description: "Communication, leadership, and interpersonal development",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-500",
    members: 89,
  },
  {
    name: "Achievers",
    type: "Higher Studies Club",
    description: "Graduate preparation and competitive exam guidance",
    icon: GraduationCap,
    color: "from-purple-500 to-violet-500",
    members: 67,
  },
  {
    name: "Altogether",
    type: "Holistic Growth",
    description: "Wellness, life skills, and personality development",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    members: 134,
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Tech Talk: AI in Education",
    club: "Ascend",
    date: "2025-01-30",
    time: "2:00 PM",
    location: "Auditorium A",
    attendees: 45,
  },
  {
    id: 2,
    title: "Leadership Workshop",
    club: "Aster",
    date: "2025-02-02",
    time: "10:00 AM",
    location: "Conference Room B",
    attendees: 28,
  },
  {
    id: 3,
    title: "GRE Prep Session",
    club: "Achievers",
    date: "2025-02-05",
    time: "4:00 PM",
    location: "Study Hall",
    attendees: 23,
  },
];

export default function HomePage() {
  const [isLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Zenith
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#about"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                About
              </Link>
              <Link
                href="#clubs"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Clubs
              </Link>
              <Link
                href="#events"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Events
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Zenith
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join our vibrant college community where learning meets growth.
                Connect with four specialized clubs designed to enhance your
                skills, expand your network, and prepare you for the future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/login"}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Join Zenith"}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="#clubs"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-semibold"
                >
                  Explore Clubs
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">500+</h3>
                    <p className="text-gray-600">Active Members</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">50+</h3>
                    <p className="text-gray-600">Monthly Events</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">100+</h3>
                    <p className="text-gray-600">Projects</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-pink-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">4</h3>
                    <p className="text-gray-600">Specialized Clubs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Zenith */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What is Zenith?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Zenith is more than just a forum&mdash;it&apos;s a comprehensive
              platform designed to foster academic excellence, personal growth,
              and professional development. Our four specialized clubs work
              together to provide a holistic educational experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Code,
                title: "Technical Skills",
                description:
                  "Master programming, development, and cutting-edge technologies",
              },
              {
                icon: MessageSquare,
                title: "Communication",
                description:
                  "Develop leadership, presentation, and interpersonal abilities",
              },
              {
                icon: GraduationCap,
                title: "Academic Excellence",
                description:
                  "Prepare for higher studies and competitive examinations",
              },
              {
                icon: Heart,
                title: "Personal Growth",
                description:
                  "Focus on wellness, life skills, and holistic development",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs Section */}
      <section
        id="clubs"
        className="py-20 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Four Specialized Clubs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each club is designed to focus on specific aspects of your
              development, ensuring comprehensive growth in all areas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clubs.map((club, index) => (
              <motion.div
                key={club.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className={`h-2 bg-gradient-to-r ${club.color}`}></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${club.color} rounded-xl flex items-center justify-center`}
                      >
                        <club.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {club.name}
                        </h3>
                        <p className="text-gray-600">{club.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {club.members}
                      </p>
                      <p className="text-sm text-gray-600">members</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {club.description}
                  </p>
                  <Link
                    href={`/clubs/${club.name.toLowerCase()}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Learn More
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with the latest events, workshops, and activities
              across all clubs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {event.club}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.attendees} attending
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.date).toLocaleDateString()} at{" "}
                      {event.time}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                  Register Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">Z</span>
                </div>
                <span className="text-xl font-bold">Zenith</span>
              </div>
              <p className="text-gray-400">
                Empowering students through community, learning, and growth.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Clubs</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/clubs/ascend"
                    className="hover:text-white transition-colors"
                  >
                    Ascend
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs/aster"
                    className="hover:text-white transition-colors"
                  >
                    Aster
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs/achievers"
                    className="hover:text-white transition-colors"
                  >
                    Achievers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs/altogether"
                    className="hover:text-white transition-colors"
                  >
                    Altogether
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/events"
                    className="hover:text-white transition-colors"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/discussions"
                    className="hover:text-white transition-colors"
                  >
                    Discussions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/assignments"
                    className="hover:text-white transition-colors"
                  >
                    Assignments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/announcements"
                    className="hover:text-white transition-colors"
                  >
                    Announcements
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guidelines"
                    className="hover:text-white transition-colors"
                  >
                    Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zenith Forum. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Zen Chatbot */}
      <ZenChatbot />
    </div>
  );
}
