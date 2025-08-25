'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Crown,
  Star,
  Clipboard,
  Camera,
  User,
  Play,
  Pause,
  Calendar,
  Award,
  Mail,
  ExternalLink
} from 'lucide-react';

// Types
interface TeamMember {
  user_id: string;
  user_name: string;
  email: string;
  profile_image_url: string;
  bio: string;
  achievements: string[];
  display_order: number;
  is_current_term: boolean;
  term_start?: string;
  term_end?: string;
}

interface Role {
  role_name: string;
  hierarchy: number;
  role_color: string;
  role_icon: string;
  is_privileged: boolean;
  members: TeamMember[];
}

interface YearData {
  academic_year: string;
  is_current_term: boolean;
  roles: Role[];
}

interface TeamShowcaseProps {
  teamType: 'committee' | 'club';
  teamId: string;
  className?: string;
  autoPlay?: boolean;
  showYearNavigation?: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  star: Star,
  clipboard: Clipboard,
  camera: Camera,
  user: User,
  users: Users,
};

// Theme-aware role colors
const getRoleColors = (roleColor: string, isDark: boolean) => {
  const baseColors = {
    '#dc2626': isDark ? 'from-red-600 to-red-800' : 'from-red-500 to-red-700',
    '#ea580c': isDark ? 'from-orange-600 to-orange-800' : 'from-orange-500 to-orange-700',
    '#ca8a04': isDark ? 'from-yellow-600 to-yellow-800' : 'from-yellow-500 to-yellow-700',
    '#16a34a': isDark ? 'from-green-600 to-green-800' : 'from-green-500 to-green-700',
    '#2563eb': isDark ? 'from-blue-600 to-blue-800' : 'from-blue-500 to-blue-700',
    '#7c3aed': isDark ? 'from-purple-600 to-purple-800' : 'from-purple-500 to-purple-700',
    '#6b7280': isDark ? 'from-gray-600 to-gray-800' : 'from-gray-500 to-gray-700',
  };
  return baseColors[roleColor as keyof typeof baseColors] || (isDark ? 'from-gray-600 to-gray-800' : 'from-gray-500 to-gray-700');
};

export default function TeamShowcase({ 
  teamType, 
  teamId, 
  className = '', 
  autoPlay = true,
  showYearNavigation = true 
}: TeamShowcaseProps) {
  const [teamData, setTeamData] = useState<{
    team_info: {
      team_type: string;
      team_id: string;
      team_name: string;
      team_description: string;
    };
    available_years: Array<{ academic_year: string; member_count: number }>;
    current_year_data: YearData;
    all_years_data: YearData[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isDark, setIsDark] = useState(false);

  // Check theme
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const url = selectedYear 
          ? `/api/teams/${teamType}/${teamId}?year=${selectedYear}`
          : `/api/teams/${teamType}/${teamId}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch team data');
        }

        setTeamData(result.data);
        
        // Set default year if not selected
        if (!selectedYear && result.data.available_years.length > 0) {
          setSelectedYear(result.data.available_years[0].academic_year);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
        console.error('Team showcase error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (teamType && teamId) {
      fetchTeamData();
    }
  }, [teamType, teamId, selectedYear]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !teamData?.current_year_data?.roles) return;

    const totalSlides = teamData.current_year_data.roles.reduce(
      (total, role) => total + Math.ceil(role.members.length / 3), 
      0
    );

    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, teamData]);

  // Navigation functions
  const nextSlide = () => {
    if (!teamData?.current_year_data?.roles) return;
    const totalSlides = teamData.current_year_data.roles.reduce(
      (total, role) => total + Math.ceil(role.members.length / 3), 
      0
    );
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (!teamData?.current_year_data?.roles) return;
    const totalSlides = teamData.current_year_data.roles.reduce(
      (total, role) => total + Math.ceil(role.members.length / 3), 
      0
    );
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Render member card
  const renderMemberCard = (member: TeamMember, role: Role) => {
    const IconComponent = iconMap[role.role_icon] || User;
    
    return (
      <motion.div
        key={member.user_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gradient-to-br ${getRoleColors(role.role_color, isDark)} 
                   rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl 
                   transform hover:scale-105 transition-all duration-300`}
      >
        <div className="text-center">
          {/* Profile Image */}
          <div className="relative mb-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm 
                           flex items-center justify-center overflow-hidden">
              {member.profile_image_url ? (
                <img 
                  src={member.profile_image_url} 
                  alt={member.user_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white/80" />
              )}
            </div>
            {/* Role icon badge */}
            <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2 
                           bg-white/30 backdrop-blur-sm rounded-full p-2">
              <IconComponent className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Member Info */}
          <h3 className="text-xl font-bold mb-2">{member.user_name}</h3>
          <p className="text-white/80 font-medium mb-3 capitalize">
            {role.role_name.replace('_', ' ')}
          </p>

          {/* Bio */}
          {member.bio && (
            <p className="text-white/90 text-sm mb-4 line-clamp-3">
              {member.bio}
            </p>
          )}

          {/* Achievements */}
          {member.achievements && member.achievements.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Achievements</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {member.achievements.slice(0, 3).map((achievement, idx) => (
                  <span 
                    key={idx}
                    className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs"
                  >
                    {achievement}
                  </span>
                ))}
                {member.achievements.length > 3 && (
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                    +{member.achievements.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="flex justify-center space-x-2">
            <button 
              onClick={() => window.open(`mailto:${member.email}`, '_blank')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 
                       transition-colors p-2 rounded-full"
              title={`Email ${member.user_name}`}
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Create slides from roles and members
  const createSlides = () => {
    if (!teamData?.current_year_data?.roles) return [];

    const slides: Array<{ role: Role; members: TeamMember[] }> = [];
    
    teamData.current_year_data.roles.forEach(role => {
      // Group members by 3 per slide
      for (let i = 0; i < role.members.length; i += 3) {
        slides.push({
          role,
          members: role.members.slice(i, i + 3)
        });
      }
    });

    return slides;
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center py-16`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-zenith-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zenith-secondary">Loading team showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className={`${className} text-center py-16`}>
        <div className="text-red-600 dark:text-red-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Failed to Load Team</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const slides = createSlides();
  const totalSlides = slides.length;

  return (
    <div className={`${className} bg-zenith-section py-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-zenith-primary mb-4">
            {teamData.team_info.team_name} Team
          </h2>
          <p className="text-xl text-zenith-secondary max-w-3xl mx-auto">
            {teamData.team_info.team_description}
          </p>
        </motion.div>

        {/* Year Navigation */}
        {showYearNavigation && teamData.available_years.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {teamData.available_years.map((yearInfo) => (
              <button
                key={yearInfo.academic_year}
                onClick={() => setSelectedYear(yearInfo.academic_year)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 
                          ${selectedYear === yearInfo.academic_year
                            ? 'bg-zenith-primary text-white shadow-lg'
                            : 'bg-zenith-card text-zenith-secondary hover:bg-zenith-primary hover:text-white'
                          }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{yearInfo.academic_year}</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {yearInfo.member_count}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Carousel */}
        {slides.length > 0 && (
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center p-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                    {slides[currentSlide]?.members.map((member) => 
                      renderMemberCard(member, slides[currentSlide].role)
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            {totalSlides > 1 && (
              <>
                {/* Previous/Next Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 
                           bg-white/20 backdrop-blur-sm hover:bg-white/30 text-zenith-primary 
                           p-3 rounded-full transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 
                           bg-white/20 backdrop-blur-sm hover:bg-white/30 text-zenith-primary 
                           p-3 rounded-full transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Auto-play Toggle */}
                <button
                  onClick={toggleAutoPlay}
                  className="absolute top-4 right-4 z-20 
                           bg-white/20 backdrop-blur-sm hover:bg-white/30 text-zenith-primary 
                           p-2 rounded-full transition-colors"
                  aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                >
                  {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide 
                          ? 'bg-zenith-primary' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Current Role Info */}
        {slides.length > 0 && slides[currentSlide] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <div className="bg-zenith-card rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-zenith-primary mb-2 capitalize">
                {slides[currentSlide].role.role_name.replace('_', ' ')} Team
              </h3>
              <div className="flex items-center justify-center space-x-4 text-zenith-secondary">
                <span>{slides[currentSlide].members.length} members</span>
                {slides[currentSlide].role.is_privileged && (
                  <>
                    <span>•</span>
                    <span className="text-zenith-primary font-medium">Privileged Role</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
