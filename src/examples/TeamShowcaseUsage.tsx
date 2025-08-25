// Example: How to integrate TeamShowcase into your club home page
// File: src/app/homeclub/[clubId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TeamShowcase from '@/components/showcase/TeamShowcase';
import { ArrowLeft, Users, Calendar, Award } from 'lucide-react';
import Link from 'next/link';

export default function EnhancedClubPage() {
  const params = useParams();
  const [clubData, setClubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clubs/${params.clubId}/public`);
        if (response.ok) {
          const data = await response.json();
          setClubData(data);
        }
      } catch (error) {
        console.error('Failed to fetch club data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.clubId) {
      fetchClubData();
    }
  }, [params.clubId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zenith-main">
      {/* Header */}
      <header className="shadow-sm border-b border-zenith-border bg-zenith-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-zenith-muted hover:text-zenith-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Club Hero Section */}
      <section className="bg-zenith-section py-16 border-b border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-zenith-primary mb-4">
            {clubData?.club.name}
          </h1>
          <p className="text-xl text-zenith-secondary max-w-3xl mx-auto">
            {clubData?.club.description}
          </p>
        </div>
      </section>

      {/* Team Showcase - This is the new component */}
      <TeamShowcase 
        teamType="club" 
        teamId={params.clubId as string}
        autoPlay={true}
        showYearNavigation={true}
        className="py-16"
      />

      {/* Optional: Committee Team Showcase if club has committees */}
      <section className="py-16 bg-zenith-main border-t border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-zenith-primary text-center mb-12">
            Committee Structure
          </h2>
          
          {/* You can show multiple committees */}
          <div className="space-y-16">
            {/* Example: Technical Committee */}
            <TeamShowcase 
              teamType="committee" 
              teamId="tech-committee-id"
              autoPlay={false}
              showYearNavigation={true}
              className=""
            />
            
            {/* Example: Event Management Committee */}
            <TeamShowcase 
              teamType="committee" 
              teamId="event-committee-id"
              autoPlay={false}
              showYearNavigation={true}
              className=""
            />
          </div>
        </div>
      </section>

      {/* Rest of your existing club content... */}
      {/* Events, Posts, Gallery, etc. */}
    </div>
  );
}
