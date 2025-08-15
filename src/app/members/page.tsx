'use client';

import { useEffect, useState } from 'react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  club_id: string | null;
  avatar: string | null;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Placeholder for now - will implement API call later
        setMembers([]);
      } catch (err) {
        console.error('Failed to fetch members:', err);
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
                <div className="bg-zenith-section border border-zenith-border text-zenith-primary px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Members</h1>
      
      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zenith-primary text-lg">No members found.</p>
          <p className="text-zenith-muted text-sm mt-2">Members will appear here once they register.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                                        <span className="text-zenith-primary font-medium">
                      {member.name}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-zenith-primary">{member.email}</p>
                  <p className="text-sm text-zenith-muted capitalize">{member.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}