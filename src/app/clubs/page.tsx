"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  ArrowRight,
  Plus,
  BookOpen,
  Code,
  Cpu,
  Lightbulb,
  Music,
  Camera,
  Palette,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  long_description?: string;
  icon: string;
  color: string;
  logo_url?: string;
  banner_image_url?: string;
  member_count: number;
  coordinator?: string;
  co_coordinator?: string;
  is_joined?: boolean;
  created_at: string;
}

export default function ModernClubsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          setClubs(data.clubs || []);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const categories = [
    { id: 'all', name: 'All Clubs', icon: Globe },
    { id: 'technical', name: 'Technical', icon: Code },
    { id: 'cultural', name: 'Cultural', icon: Music },
    { id: 'sports', name: 'Sports', icon: Users },
    { id: 'academic', name: 'Academic', icon: BookOpen },
    { id: 'creative', name: 'Creative', icon: Palette }
  ];

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || club.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedClubs = [...filteredClubs].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.member_count || 0) - (a.member_count || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Explore Clubs</h1>
            <p className="text-secondary text-lg">
              Join clubs that match your interests and connect with like-minded peers
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/clubs/create">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Create Club</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search clubs, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-section border border-custom rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-3 bg-section border border-custom rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="events">Most Events</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center space-x-2 transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-section text-secondary hover:bg-hover border border-custom'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-secondary"
      >
        Found {sortedClubs.length} clubs
        {searchQuery && (
          <span> for "{searchQuery}"</span>
        )}
        {selectedCategory !== 'all' && (
          <span> in {categories.find(c => c.id === selectedCategory)?.name}</span>
        )}
      </motion.div>

      {/* Featured Clubs */}
      {selectedCategory === 'all' && !searchQuery && sortedClubs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-primary flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <span>Featured Clubs</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedClubs.slice(0, 2).map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${club.color || 'from-blue-500 to-cyan-500'} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {club.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">{club.name}</h3>
                      <p className="text-secondary">{club.coordinator || 'No coordinator assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600 font-medium text-sm">Featured</span>
                  </div>
                </div>

                <p className="text-secondary mb-4">{club.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-secondary">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{club.member_count || 0} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">
                        {club.type}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href={`/clubs/${club.id}`}>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Clubs Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-primary">
          {selectedCategory === 'all' && !searchQuery ? 'All Clubs' : 'Search Results'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${club.color || 'from-blue-500 to-cyan-500'} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                  {club.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary truncate">{club.name}</h3>
                  <p className="text-sm text-secondary truncate">{club.coordinator || 'No coordinator'}</p>
                </div>
              </div>

              <p className="text-secondary text-sm mb-4 line-clamp-2">{club.description}</p>

              <div className="flex items-center justify-between text-sm text-secondary mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{club.member_count || 0} members</span>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">
                  {club.type}
                </span>
              </div>

              <Link href={`/clubs/${club.id}`}>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        {sortedClubs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-section rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No clubs found</h3>
            <p className="text-secondary mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}