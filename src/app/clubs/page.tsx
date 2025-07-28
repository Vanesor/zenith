"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code,
  MessageSquare,
  GraduationCap,
  Heart,
  ArrowRight,
  Search,
  Filter,
  Star,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";

const clubs = [
  {
    id: "ascend",
    name: "Ascend",
    type: "Coding Club",
    description:
      "Programming challenges, hackathons, and tech innovation. Join us to enhance your coding skills and build amazing projects.",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    members: 156,
    rating: 4.8,
    recentActivity: "Hackathon 2025 registration open",
    upcomingEvent: "Tech Talk on AI - Jan 30",
    tags: ["Programming", "Hackathons", "Tech Talks", "Projects"],
  },
  {
    id: "aster",
    name: "Aster",
    type: "Soft Skills Club",
    description:
      "Communication workshops, leadership training, and interpersonal skill development. Perfect for enhancing your professional presence.",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    members: 89,
    rating: 4.6,
    recentActivity: "Public speaking workshop completed",
    upcomingEvent: "Leadership seminar - Feb 2",
    tags: ["Communication", "Leadership", "Networking", "Presentation"],
  },
  {
    id: "achievers",
    name: "Achievers",
    type: "Higher Studies Club",
    description:
      "Graduate school preparation, competitive exam guidance, and research opportunities. Your pathway to academic excellence.",
    icon: GraduationCap,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    members: 67,
    rating: 4.9,
    recentActivity: "GRE prep session conducted",
    upcomingEvent: "University application workshop - Feb 5",
    tags: ["GRE", "GMAT", "Research", "Graduate School"],
  },
  {
    id: "altogether",
    name: "Altogether",
    type: "Holistic Growth",
    description:
      "Wellness, life skills, and personality development. Focus on overall well-being and personal growth for a balanced life.",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800",
    members: 134,
    rating: 4.7,
    recentActivity: "Mindfulness session held",
    upcomingEvent: "Wellness workshop - Feb 8",
    tags: ["Wellness", "Life Skills", "Mindfulness", "Personal Growth"],
  },
];

export default function ClubsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (selectedFilter === "all") return matchesSearch;
    return (
      matchesSearch &&
      club.type.toLowerCase().includes(selectedFilter.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300 pt-16">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Our{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Clubs
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover four specialized clubs designed to enhance your skills,
            expand your network, and accelerate your personal and professional
            growth.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clubs, skills, or activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Clubs</option>
              <option value="coding">Coding</option>
              <option value="soft">Soft Skills</option>
              <option value="higher">Higher Studies</option>
              <option value="holistic">Holistic Growth</option>
            </select>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              4
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Specialized Clubs
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              446
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Members
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              50+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Monthly Events
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              4.7
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Rating
            </div>
          </div>
        </motion.div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredClubs.map((club, index) => {
            const IconComponent = club.icon;

            return (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 ${club.borderColor} p-8 hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-xl ${club.bgColor}`}>
                    <IconComponent className={`w-8 h-8 ${club.textColor}`} />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {club.rating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {club.members} members
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {club.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {club.type}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {club.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {club.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Recent: {club.recentActivity}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Upcoming: {club.upcomingEvent}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Link
                    href={`/clubs/${club.id}`}
                    className={`flex-1 bg-gradient-to-r ${club.color} text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity font-semibold text-center`}
                  >
                    Join Club
                  </Link>
                  <Link
                    href={`/clubs/${club.id}/preview`}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Preview
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredClubs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No clubs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters.
            </p>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mt-12"
        >
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join multiple clubs to maximize your learning experience. Each club
            offers unique opportunities for growth and networking.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </main>

      <ZenChatbot />
    </div>
  );
}
