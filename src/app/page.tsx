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
  TrendingUp,
  Award,
  Star,
  Zap
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { ZenithLogo } from "@/components/ZenithLogo";
import ClubLogo from "@/components/ClubLogo";
import { UniversalLoader } from "@/components/UniversalLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
    'Ascend': 'text-primary',    // Blue for ASCEND
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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

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

  // Show loading while checking auth or fetching data
  if (isLoading || loading) {
    return <UniversalLoader message="Loading Zenith community..." />;
  }

  // If user is authenticated, don't show landing page (will redirect)
  if (user) {
    return null;
  }

  if (error || !homeData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Unable to load data
          </h1>
          <p className="text-zenith-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zenith-accent text-primary rounded-lg hover:bg-zenith-accent transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, clubs, upcomingEvents } = homeData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <ZenChatbot />

      {/* Hero Section with built-in header */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-400/30 dark:to-pink-400/30 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-400/30 dark:to-cyan-400/30 blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative z-20 max-w-7xl mx-auto mb-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-primary">Zenith</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">CS Department Forum</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-primary hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary text-sm font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-primary mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZENITH
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              DRIVEN BY PASSION, BUILT FOR EXCELLENCE
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Join our vibrant college forum community where students connect,
              learn, and grow together through specialized clubs and activities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-flex items-center justify-center"
              >
                Get Started
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#clubs"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-primary border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
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
                  className="bg-card rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div
                    className={`bg-gradient-to-r ${club.color} p-6 text-primary`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-card/20 rounded-xl flex items-center justify-center">
                          <ClubLogo 
                            clubId={club.id}
                            clubName={club.name}
                            size="lg"
                            fallbackIcon={club.icon}
                            className="text-primary"
                          />
                        </div>
                        <div>
                          <h3 className={`text-2xl font-bold ${getClubTextColor(club.name)}`}>{club.name}</h3>
                          <p className={`text-primary/80 ${getClubTextColor(club.name)}`}>{club.type}</p>
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
                className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-zenith"
              >
                <div className={`bg-gradient-to-r ${event.club_color} p-4`}>
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-sm font-medium">
                      {event.club_name}
                    </span>
                    <span className="text-xs bg-card/20 px-2 py-1 rounded">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">
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
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
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
                    <h3 className="font-semibold text-primary">
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
                    <h3 className="font-semibold text-primary">
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
                    <h3 className="font-semibold text-primary">
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
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-primary">
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
            <h2 className="text-4xl font-bold text-primary mb-6">
              Ready to Reach Your Zenith?
            </h2>
            <p className="text-xl text-primary/90 mb-8">
              Join thousands of students who are already part of our growing
              community. Your journey to excellence starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-card text-zenith-accent hover:bg-zenith-section px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Join Zenith Today
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#clubs"
                className="border-2 border-white text-primary hover:bg-card hover:text-zenith-accent px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Explore Clubs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-primary">
                {stats.totalClubs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Specialized Clubs
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-primary">
                {stats.totalMembers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Members
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-primary">
                {stats.upcomingEvents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Upcoming Events
              </div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-primary">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Discussions
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-primary py-12">
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
                    className="hover:text-primary transition-colors"
                  >
                    Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    href="#events"
                    className="hover:text-primary transition-colors"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forums"
                    className="hover:text-primary transition-colors"
                  >
                    Forums
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors"
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
                    className="hover:text-primary transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guidelines"
                    className="hover:text-primary transition-colors"
                  >
                    Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors"
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
