"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Clock,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { ZenithLogo } from "@/components/ZenithLogo";
import ClubLogo from "@/components/ClubLogo";
import { UnifiedHeader } from "@/components/UnifiedHeader";

// Icon mapping for clubs
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code: Code,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Heart: Heart,
};

// Club color mapping for text display
const getClubTextColor = (clubName: string) => {
  const clubColors: Record<string, string> = {
    'Ascend': 'text-zenith-primary',    // Blue for ASCEND
    'Aster': 'text-pink-500',     // Pink for ASTER  
    'Achievers': 'text-purple-500', // Purple for ACHIEVERS
    'Altogether': 'text-green-500', // Green for ALTOGETHER
  };
  
  // Find the club by checking if the name contains the key
  for (const [key, color] of Object.entries(clubColors)) {
    if (clubName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Default to brand color if not found
  return 'text-zenith-brand';
};

interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string;
  icon: string;
  member_count: number;
  upcoming_events: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  event_date: string;
  event_time: string;
  location: string;
  club_name: string;
  club_color: string;
  organizer_name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  club_name: string;
  club_color: string;
  author_name: string;
}

interface HomeStats {
  totalClubs: number;
  totalMembers: number;
  upcomingEvents: number;
  totalPosts: number;
}

interface HomeData {
  stats: HomeStats;
  clubs: Club[];
  upcomingEvents: Event[];
}

export default function HomePage() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetch("/api/home/stats");
        if (!response.ok) throw new Error("Failed to fetch home data");
        const data = await response.json();
        setHomeData(data);
      } catch (err) {
        setError("Failed to load data");
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zenith-accent mx-auto mb-4"></div>
          <p className="text-zenith-secondary">
            Loading Zenith Forum...
          </p>
        </div>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zenith-primary mb-4">
            Unable to load data
          </h1>
          <p className="text-zenith-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zenith-accent text-white rounded-lg hover:bg-zenith-accent transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, clubs, upcomingEvents } = homeData;

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <ZenChatbot />

      {/* Unified Header */}
      <UnifiedHeader showNavigation={true} />

      {/* Main Content with proper spacing for fixed header */}
      <div className="pt-44">{/* Increased even more for college banner + nav bar */}

      {/* Hero Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">{/* Further reduced since parent has more padding */}
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-zenith-primary mb-6">
              Welcome to{" "}
              <span className="text-zenith-brand">
                ZENITH
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zenith-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              DRIVEN BY PASSION, BUILT FOR EXCELLENCE
            </p>
            <p className="text-lg text-zenith-muted mb-12 max-w-2xl mx-auto">
              Join our vibrant college forum community where students connect,
              learn, and grow together through specialized clubs and activities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-zenith-accent hover:bg-zenith-accent text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
              >
                Get Started
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#clubs"
                className="bg-zenith-card text-zenith-primary border border-zenith hover:bg-zenith-section px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Explore Clubs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold stat-clubs">
                {stats.totalClubs}
              </div>
              <div className="text-sm text-zenith-muted">
                Specialized Clubs
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-members">
                {stats.totalMembers}
              </div>
              <div className="text-sm text-zenith-muted">
                Active Members
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-events">
                {stats.upcomingEvents}
              </div>
              <div className="text-sm text-zenith-muted">
                Upcoming Events
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold stat-posts">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-zenith-muted">
                Forum Posts
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Clubs Section */}
      <section
        id="clubs"
        className="py-20 bg-zenith-main"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-zenith-brand mb-4">
              Our Specialized Clubs
            </h2>
            <p className="text-xl text-zenith-secondary max-w-2xl mx-auto">
              Choose your path and join like-minded peers in your area of
              interest
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {clubs.map((club, index) => {
              const IconComponent = iconMap[club.icon] || Code;
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="bg-zenith-card rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div
                    className={`bg-gradient-to-r ${club.color} p-6 text-white`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-zenith-card/20 rounded-xl flex items-center justify-center">
                          <ClubLogo 
                            clubId={club.id}
                            clubName={club.name}
                            size="lg"
                            fallbackIcon={club.icon}
                            className="text-white"
                          />
                        </div>
                        <div>
                          <h3 className={`text-2xl font-bold ${getClubTextColor(club.name)}`}>{club.name}</h3>
                          <p className={`text-white/80 ${getClubTextColor(club.name)}`}>{club.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getClubTextColor(club.name)}`}>
                          {club.member_count}
                        </p>
                        <p className={`text-sm font-bold ${getClubTextColor(club.name)}`}>members</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* <h3 className={`text-2xl font-bold mb-3 ${getClubTextColor(club.name)}`}>
                      {club.name}
                    </h3> */}
                    <p className="text-zenith-secondary mb-6 leading-relaxed">
                      {club.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-zenith-muted">
                        {club.upcoming_events} upcoming events
                      </div>
                      <Link
                        href={`/clubs/${club.id}`}
                        className="inline-flex items-center text-zenith-accent hover:text-zenith-accent font-semibold transition-colors"
                      >
                        Learn More
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="py-20 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-zenith-brand mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-zenith-secondary">
              Don&apos;t miss out on these exciting opportunities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-zenith-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-zenith"
              >
                <div className={`bg-gradient-to-r ${event.club_color} p-4`}>
                  <div className="flex justify-between items-center text-white">
                    <span className="text-sm font-medium">
                      {event.club_name}
                    </span>
                    <span className="text-xs bg-zenith-card/20 px-2 py-1 rounded">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                    {event.title}
                  </h3>
                  <p className="text-zenith-secondary mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-zenith-muted">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.event_time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Organized by {event.organizer_name}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/events"
              className="inline-flex items-center text-zenith-accent hover:text-zenith-accent font-semibold text-lg"
            >
              View All Events
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is Zenith */}
      <section className="py-20 bg-zenith-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold text-zenith-brand mb-6">
                What is Zenith?
              </h2>
              <p className="text-lg text-zenith-secondary mb-6 leading-relaxed">
                Zenith is more than just a college forum - it&apos;s a thriving
                ecosystem where passionate students come together to learn,
                grow, and excel. Our platform connects like-minded individuals
                through specialized clubs, each designed to nurture specific
                skills and interests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-zenith-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Community Driven
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Built by students, for students
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Skill Development
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Learn and grow with expert guidance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Innovation Hub
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Where ideas come to life
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zenith-primary">
                      Regular Events
                    </h3>
                    <p className="text-sm text-zenith-muted">
                      Workshops, competitions, and more
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <ZenithLogo size="xl" className="mb-6" />
                  <p className="text-lg opacity-90 mb-6">
                    &quot;Excellence is not a destination, it&apos;s a journey
                    of continuous growth and learning.&quot;
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.totalMembers}+
                      </div>
                      <div className="text-sm opacity-80">Active Members</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.upcomingEvents}+
                      </div>
                      <div className="text-sm opacity-80">Monthly Events</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-zenith-accent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Reach Your Zenith?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of students who are already part of our growing
              community. Your journey to excellence starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-zenith-card text-zenith-accent hover:bg-zenith-section px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Join Zenith Today
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#clubs"
                className="border-2 border-white text-white hover:bg-zenith-card hover:text-zenith-accent px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Explore Clubs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      </div> {/* End of main content with proper spacing */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <ZenithLogo size="lg" className="mb-4" />
              <p className="text-zenith-muted mb-4 max-w-md">
                A vibrant college forum community where students connect, learn,
                and grow together through specialized clubs and activities.
              </p>
              <p className="text-sm text-zenith-muted">
                St. Vincent College, Nagpur • Made with ❤️ by students
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-zenith-muted">
                <li>
                  <Link
                    href="#clubs"
                    className="hover:text-white transition-colors"
                  >
                    Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    href="#events"
                    className="hover:text-white transition-colors"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forums"
                    className="hover:text-white transition-colors"
                  >
                    Forums
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-zenith-muted">
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
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-zenith-muted">
            <p>&copy; 2025 Zenith Forum. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
