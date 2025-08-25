'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Crown,
  Shield,
  UserCheck,
  Users,
  Play,
  Pause,
  Star,
  Award,
  Briefcase,
  User,
  FileText,
  Megaphone
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  academic_year: string;
  is_current_term: boolean;
  is_privileged?: boolean;
  role_permissions?: {
    can_create_projects: boolean;
    can_manage_events: boolean;
    can_approve_content: boolean;
    is_privileged: boolean;
  };
}

interface TeamShowcaseProps {
  teamType: 'committee' | 'club';
  teamId: string;
  title?: string;
  showYearNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  cardClassName?: string;
  titleClassName?: string;
}

const TeamShowcase: React.FC<TeamShowcaseProps> = ({
  teamType,
  teamId,
  title,
  showYearNavigation = true,
  autoPlay = true,
  autoPlayInterval = 5000,
  className = '',
  cardClassName = '',
  titleClassName = ''
}) => {
  const [teamData, setTeamData] = useState<{
    team: any;
    members: TeamMember[];
    availableYears: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Load team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamType}/${teamId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url: `/api/teams/${teamType}/${teamId}`
          });
          throw new Error(`Failed to fetch team data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        setTeamData(data);
        setSelectedYear(data.availableYears[0] || 'all');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamType, teamId]);

  // Filter and sort members by selected year (API already filters leadership positions for clubs)
  const filteredMembers = (teamData?.members.filter(member => {
    if (selectedYear === 'all') return true;
    return member.academic_year === selectedYear;
  }) || [])
  .sort((a, b) => {
    // Define hierarchy ordering for committees only (clubs already sorted by hierarchy in API)
    if (teamType === 'committee') {
      const getHierarchyOrder = (role: string) => {
        const roleLC = role.toLowerCase();
        if (roleLC.includes('president')) return 1;
        if (roleLC.includes('vice president')) return 2;
        if (roleLC.includes('innovation head')) return 3;
        if (roleLC.includes('treasurer')) return 4;
        if (roleLC.includes('secretary')) return 5;
        if (roleLC.includes('media')) return 6;
        return 999; // Other roles
      };
      return getHierarchyOrder(a.role) - getHierarchyOrder(b.role);
    }
    // Clubs already sorted by hierarchy in API, no need to sort again
    return 0;
  });

  // Dynamic members per slide - 2 rows with 4 members each (max 8 per slide)
  const getMembersPerSlide = () => {
    const memberCount = filteredMembers.length;
    if (memberCount <= 4) return memberCount; // Single row if 4 or fewer
    if (memberCount <= 8) return 8; // Two rows (4x2) for 5-8 members
    return 8; // Always show 8 per slide for larger groups
  };

  const membersPerSlide = getMembersPerSlide();
  const totalSlides = Math.ceil(filteredMembers.length / membersPerSlide);
  const slides = Array.from({ length: totalSlides }, (_, index) => {
    const start = index * membersPerSlide;
    return filteredMembers.slice(start, start + membersPerSlide);
  });

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, totalSlides, autoPlayInterval]);

  // Navigation handlers
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const getRoleIcon = (member: TeamMember) => {
    const role = member.role.toLowerCase();
    
    if (role.includes('president')) {
      return <Crown className="w-4 h-4 text-amber-600" />;
    }
    if (role.includes('vice president')) {
      return <Award className="w-4 h-4 text-blue-600" />;
    }
    if (role.includes('coordinator') && !role.includes('co')) {
      return <Crown className="w-4 h-4 text-amber-600" />;
    }
    if (role.includes('co_coordinator') || role.includes('co-coordinator')) {
      return <Award className="w-4 h-4 text-blue-600" />;
    }
    if (role.includes('innovation')) {
      return <Star className="w-4 h-4 text-purple-600" />;
    }
    if (role.includes('treasurer')) {
      return <Briefcase className="w-4 h-4 text-green-600" />;
    }
    if (role.includes('secretary')) {
      return <FileText className="w-4 h-4 text-indigo-600" />;
    }
    if (role.includes('media')) {
      return <Megaphone className="w-4 h-4 text-pink-600" />;
    }
    if (member.is_privileged || member.role_permissions?.is_privileged) {
      return <Shield className="w-4 h-4 text-emerald-600" />;
    }
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getRoleColor = (member: TeamMember) => {
    const role = member.role.toLowerCase();
    
    if (role.includes('president')) {
      return 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-200';
    }
    if (role.includes('vice president')) {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-blue-200';
    }
    if (role.includes('coordinator') && !role.includes('co')) {
      return 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-200';
    }
    if (role.includes('co_coordinator') || role.includes('co-coordinator')) {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-blue-200';
    }
    if (role.includes('innovation')) {
      return 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-900 border-purple-200';
    }
    if (role.includes('treasurer')) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 border-green-200';
    }
    if (role.includes('secretary')) {
      return 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 border-indigo-200';
    }
    if (role.includes('media')) {
      return 'bg-gradient-to-r from-pink-50 to-rose-50 text-pink-900 border-pink-200';
    }
    if (member.is_privileged || member.role_permissions?.is_privileged) {
      return 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-200';
    }
    return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-900 border-gray-200';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Team data not available</p>
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No team members found for the selected year</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {title && (
        <h3 className={`text-2xl font-bold text-center mb-6 ${titleClassName}`}>
          {title}
        </h3>
      )}

      {/* Year Navigation */}
      {showYearNavigation && teamData.availableYears.length > 1 && (
        <div className="flex items-center justify-center mb-8">
          <div className="relative inline-flex items-center bg-zenith-card rounded-xl shadow-lg border border-zenith-border p-1">
            <Calendar className="w-5 h-5 text-zenith-muted ml-3 mr-2" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentSlide(0); // Reset to first slide when year changes
              }}
              className="appearance-none bg-transparent border-none px-4 py-3 pr-8 focus:outline-none focus:ring-0 text-zenith-primary font-medium cursor-pointer"
            >
              <option value="all">All Academic Years</option>
              {teamData.availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-zenith-muted absolute right-3 pointer-events-none rotate-90" />
          </div>
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative overflow-hidden px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedYear}-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Dynamic Grid Layout - 2 rows max, 4 columns each */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {slides[currentSlide]?.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ scale: 0.8, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group relative bg-zenith-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-zenith-border hover:border-zenith-hover ${cardClassName}`}
                >
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zenith-section via-zenith-card to-zenith-section opacity-60"></div>
                  
                  {/* Card Content */}
                  <div className="relative p-6 text-center">
                    {/* Avatar Container */}
                    <div className="relative mb-4">
                      <div className="w-28 h-32 mx-auto relative">
                        {/* Avatar Ring - Removed border styling */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 p-1">
                          <div className="w-full h-full rounded-xl bg-zenith-card">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Role Icon Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-zenith-card rounded-full p-2 shadow-lg border border-zenith-border">
                          {getRoleIcon(member)}
                        </div>
                      </div>
                    </div>

                    {/* Member Name */}
                    <h4 className="font-bold text-zenith-primary mb-2 text-lg group-hover:text-blue-600 transition-colors duration-300">
                      {member.name}
                    </h4>
                    
                    {/* Role Badge */}
                    <div className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full border-2 mb-3 ${getRoleColor(member)} shadow-sm`}>
                      {getRoleIcon(member)}
                      <span className="ml-2">{member.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>

                    {/* Academic Year */}
                    <div className="flex items-center justify-center text-sm text-zenith-secondary mb-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="font-medium">{member.academic_year}</span>
                    </div>

                    {/* Current Term Badge */}
                    {member.is_current_term && (
                      <div className="inline-flex items-center px-3 py-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-medium shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        Active Term
                      </div>
                    )}

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-zenith-card rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 border border-zenith-border hover:border-blue-300 group"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 text-zenith-secondary group-hover:text-blue-600 transition-colors duration-300" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-zenith-card rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 border border-zenith-border hover:border-blue-300 group"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 text-zenith-secondary group-hover:text-blue-600 transition-colors duration-300" />
            </button>
          </>
        )}        </div>

      {/* Slide Indicators and Controls */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center mt-8 space-x-6">
          {/* Slide Indicators */}
          <div className="flex space-x-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-8 h-3 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                    : 'w-3 h-3 bg-zenith-border hover:bg-zenith-muted hover:scale-110'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play Toggle */}
          <div className="flex items-center bg-zenith-card rounded-full px-4 py-2 shadow-lg border border-zenith-border">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-2 text-sm text-zenith-secondary hover:text-blue-600 transition-colors duration-300"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center bg-zenith-card rounded-full px-6 py-3 text-sm text-zenith-secondary border border-zenith-border">
          <Users className="w-4 h-4 mr-2 text-zenith-muted" />
          <span className="font-medium">
            Showing {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            {selectedYear !== 'all' && ` from ${selectedYear}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TeamShowcase;
