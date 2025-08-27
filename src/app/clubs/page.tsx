"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ZenChatbot from '@/components/ZenChatbot';
import { useRouter } from 'next/navigation';
import { getClubLogoUrl } from '@/lib/assetUtils';

interface Club {
  id: string;
  name: string;
  description: string;
  type: string;
  member_count: number;
  coordinator_id: string;
  coordinator_name: string;
  logo_url?: string;
  banner_url?: string;
  created_at: string;
  updated_at: string;
}

// Hardcoded club logo mapping
const getClubLogo = (clubName: string) => {
  // Use the utility function for proper URL handling
  return getClubLogoUrl(clubName);
};export default function ClubsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Load clubs data
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/clubs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Clubs API response:', data);
        
        // Handle both old and new API response formats
        if (data.success && Array.isArray(data.clubs)) {
          setClubs(data.clubs);
          console.log(`✅ Loaded ${data.clubs.length} clubs`);
        } else if (Array.isArray(data)) {
          setClubs(data);
          console.log(`✅ Loaded ${data.length} clubs (legacy format)`);
        } else {
          console.error('❌ Unexpected API response format:', data);
          setClubs([]);
        }
      } else {
        console.error('❌ Failed to fetch clubs:', response.status, response.statusText);
        setClubs([]);
      }
    } catch (error) {
      console.error('❌ Error loading clubs:', error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle club selection - Navigate to individual club page
  const handleClubSelect = (club: Club) => {
    router.push(`/clubs/${club.id}`);
  };

  // Filter clubs based on search and type
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || club.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
        <div className="min-h-screen bg-zenith-main flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading clubs...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-zenith-main transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Student Clubs
              </h1>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Discover and join our vibrant student clubs. Connect with like-minded peers and explore your interests.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-custom rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-card border border-custom rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
            </div>

            {/* Show only first 4 clubs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {filteredClubs.slice(0, 4).map((club) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleClubSelect(club)}
                  className="cursor-pointer group"
                >
                  <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-custom shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                    {/* Club Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {/* Using hardcoded SVG logos from public/uploads/club-logos */}
                        {(() => {
                          const logoPath = getClubLogo(club.name);
                          return logoPath ? (
                            <img 
                              src={logoPath}
                              alt={`${club.name} logo`}
                              className="w-12 h-12 object-contain filter brightness-0 invert"
                              onError={(e) => {
                                // Fallback to first letter if logo not found
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<span class="text-white font-bold text-2xl">${club.name.charAt(0)}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-white font-bold text-2xl">{club.name.charAt(0)}</span>
                          );
                        })()}
                        
                        {/* Commented out database logo_url code */}
                        {/* {club.logo_url ? (
                          <img 
                            src={club.logo_url}
                            alt={`${club.name} logo`}
                            className="w-12 h-12 object-contain filter brightness-0 invert"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<span class="text-white font-bold text-2xl">${club.name.charAt(0)}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-white font-bold text-2xl">{club.name.charAt(0)}</span>
                        )} */}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-xl text-primary group-hover:text-purple-600 transition-colors">
                          {club.name}
                        </h3>
                        <p className="text-sm text-zenith-secondary capitalize px-3 py-1 bg-purple-100 rounded-full">
                          {club.type}
                        </p>
                      </div>
                    </div>

                    {/* Club Description */}
                    <p className="text-secondary mt-4 text-center line-clamp-3 text-sm">
                      {club.description}
                    </p>

                    {/* Club Stats */}
                    <div className="flex items-center justify-center mt-6 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Users className="w-4 h-4" />
                        <span>{club.member_count} members</span>
                      </div>
                    </div>

                    {/* View Club Arrow */}
                    <div className="flex justify-center mt-4">
                      <ChevronRight className="w-5 h-5 text-muted group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredClubs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  No clubs found
                </h3>
                <p className="text-secondary">
                  Try adjusting your search criteria or filter options.
                </p>
              </div>
            )}
          </motion.div>
        </div>
        
        <ZenChatbot />
      </div>
  );
}
