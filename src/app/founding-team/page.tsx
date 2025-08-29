"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Users, 
  Calendar,
  MapPin,
  Mail,
  ExternalLink,
  Github,
  Linkedin,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UniversalLoader } from '@/components/UniversalLoader';
import SafeAvatar from '@/components/SafeAvatar';

interface FoundingMember {
  id: string;
  name: string;
  email: string;
  position: string;
  club_id: string;
  club_name: string;
  club_color: string;
  year: string;
  bio?: string;
  profile_image_url?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  joined_date: string;
  achievements?: string[];
}

interface Committee {
  id: string;
  name: string;
  description: string;
  members: FoundingMember[];
}

interface Club {
  id: string;
  name: string;
  color: string;
  members: FoundingMember[];
}

export default function FoundingTeamPage() {
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedView, setSelectedView] = useState<'all' | 'committee' | string>('all');

  useEffect(() => {
    fetchFoundingTeamData();
  }, []);

  const fetchFoundingTeamData = async () => {
    try {
      // Fetch 2024 founding members from database
      const response = await fetch('/api/founding-team');
      if (response.ok) {
        const data = await response.json();
        setCommittee(data.committee);
        setClubs(data.clubs);
      }
    } catch (error) {
      console.error('Error fetching founding team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UniversalLoader 
        fullScreen={true}
        message="Loading founding team..."
      />
    );
  }

  const filteredMembers = selectedView === 'all' 
    ? [...(committee?.members || []), ...clubs.flatMap(club => club.members)]
    : selectedView === 'committee' 
    ? committee?.members || []
    : clubs.find(club => club.id === selectedView)?.members || [];

  return (
    <div className="min-h-screen zenith-bg-main">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 via-purple-800/20 to-pink-800/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href="/">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <Crown className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
            <h1 className="text-5xl font-bold mb-6">
              Founding Team 2024-2025
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Meet the visionary pioneers who laid the foundation of Zenith. These exceptional 
              individuals dedicated their time, passion, and expertise to create the thriving 
              community we know today during the founding period of 2024-2025.
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="text-2xl font-bold">{filteredMembers.length}</div>
                <div className="text-sm opacity-80">Team Members</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="text-2xl font-bold">{clubs.length}</div>
                <div className="text-sm opacity-80">Clubs Established</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="text-2xl font-bold">2024-25</div>
                <div className="text-sm opacity-80">Founding Period</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Button
            variant={selectedView === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedView('all')}
            className={selectedView === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <Users className="w-4 h-4 mr-2" />
            All Members
          </Button>
          
          {committee && (
            <Button
              variant={selectedView === 'committee' ? 'default' : 'outline'}
              onClick={() => setSelectedView('committee')}
              className={selectedView === 'committee' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Crown className="w-4 h-4 mr-2" />
              Committee
            </Button>
          )}
          
          {clubs.map(club => (
            <Button
              key={club.id}
              variant={selectedView === club.id ? 'default' : 'outline'}
              onClick={() => setSelectedView(club.id)}
              className={selectedView === club.id ? `bg-${club.color}-600 hover:bg-${club.color}-700` : ''}
            >
              <div className={`w-3 h-3 rounded-full bg-${club.color}-500 mr-2`} />
              {club.name}
            </Button>
          ))}
        </motion.div>
      </div>

      {/* Committee Section (if viewing committee or all) */}
      {committee && (selectedView === 'all' || selectedView === 'committee') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold zenith-text-primary mb-4 flex items-center justify-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                Core Leadership
              </h2>
              <p className="text-lg zenith-text-secondary max-w-2xl mx-auto">
                The executive leadership that guides Zenith's vision and strategic direction
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {committee.members.map((member, index) => (
                <MemberCard key={member.id} member={member} index={index} isCommittee={true} />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Clubs Section */}
      {clubs.map(club => {
        if (selectedView !== 'all' && selectedView !== club.id) return null;
        
        return (
          <div key={club.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold zenith-text-primary mb-4 flex items-center justify-center gap-3">
                  <div className={`w-6 h-6 rounded-full bg-${club.color}-500`} />
                  {club.name}
                </h2>
                <p className="text-lg zenith-text-secondary max-w-2xl mx-auto">
                  Leadership team and founding members of this club
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {club.members.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} clubColor={club.color} />
                ))}
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* ZenChatbot */}
    </div>
  );
}

interface MemberCardProps {
  member: FoundingMember;
  index: number;
  isCommittee?: boolean;
  clubColor?: string;
}

function MemberCard({ member, index, isCommittee = false, clubColor }: MemberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="zenith-bg-card zenith-border hover:shadow-xl transition-all duration-300 group">
        <CardContent className="p-6">
          {/* Profile Header */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <SafeAvatar
                src={member.profile_image_url}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto border-4 border-white shadow-lg"
                fallbackName={member.name}
              />
              {isCommittee && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold zenith-text-primary mb-1">{member.name}</h3>
            <p className="text-sm font-medium text-blue-600 mb-2">{member.position}</p>
            
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge 
                className={`bg-${clubColor || 'blue'}-100 text-${clubColor || 'blue'}-700 border-${clubColor || 'blue'}-200`}
              >
                {member.club_name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Class of {member.year}
              </Badge>
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <p className="text-sm zenith-text-secondary mb-4 line-clamp-3">
              {member.bio}
            </p>
          )}

          {/* Achievements */}
          {member.achievements && member.achievements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold zenith-text-primary mb-2">Key Contributions</h4>
              <div className="space-y-1">
                {member.achievements.slice(0, 2).map((achievement, idx) => (
                  <div key={idx} className="text-xs zenith-text-secondary flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t zenith-border">
            <Button variant="outline" size="sm" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              Contact
            </Button>
            
            {member.social_links?.linkedin && (
              <Button variant="outline" size="sm" className="text-xs">
                <Linkedin className="w-3 h-3" />
              </Button>
            )}
            
            {member.social_links?.github && (
              <Button variant="outline" size="sm" className="text-xs">
                <Github className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
