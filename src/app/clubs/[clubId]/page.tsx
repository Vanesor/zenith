"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Crown,
  Shield,
  Edit,
  Star,
  Code,
  GraduationCap,
  Heart,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import ClubLogo from "@/components/ClubLogo";

interface ClubData {
  club: {
    id: string;
    name: string;
    type: string;
    description: string;
    long_description: string;
    icon: string;
    color: string;
    memberCount: number;
    leadership: {
      coordinator: { name: string } | null;
      coCoordinator: { name: string } | null;
      secretary: { name: string } | null;
      media: { name: string } | null;
    };
  };
  events: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    attendeeCount: number;
  }>;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    author: { name: string } | null;
    likeCount: number;
    commentCount: number;
    created_at: string;
  }>;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "Code":
      return Code;
    case "MessageSquare":
      return MessageSquare;
    case "GraduationCap":
      return GraduationCap;
    case "Heart":
      return Heart;
    default:
      return Code;
  }
};
const getClubTextColor = (clubName: string) => {
  const clubColors: Record<string, string> = {
    'Ascend': 'text-zenith-primary',    // Blue for ASCEND
    'Aster': 'stat-posts',     // Pink for ASTER  
    'Achievers': 'stat-events', // Purple for ACHIEVERS
    'Altogether': 'stat-members', // Green for ALTOGETHER
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

export default function ClubPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clubId = params?.clubId as string;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("zenith-token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/clubs/${clubId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch club data");
        }

        const data = await response.json();
        setClubData(data);
      } catch (err) {
        setError("Failed to load club data");
        console.error("Error fetching club data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && clubId) {
      setIsJoined(user.club_id === clubId);
      fetchData();
    }
  }, [user, clubId, router]);

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !clubData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zenith-primary mb-4">
            {error || "Club Not Found"}
          </h1>
          <Link
            href="/dashboard"
            className="text-zenith-accent hover:no-underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { club, events, posts } = clubData;
  const Icon = getIconComponent(club.icon);

  const handleJoinClub = () => {
    setIsJoined(!isJoined);
  };

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Club Header */}
        <div className="bg-zenith-card rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${club.color} p-8 text-white`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <div className="w-20 h-20 bg-zenith-card/20 rounded-2xl flex items-center justify-center">
                  <ClubLogo 
                    clubId={club.id}
                    clubName={club.name}
                    size="xl"
                    fallbackIcon={club.icon}
                    className="text-white"
                  />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold mb-2 ${getClubTextColor(club.name)}`}>{club.name}</h1>
                  <p className={`text-xl opacity-90 ${getClubTextColor(club.type)}`}>{club.type}</p>
                  <p className={`text-lg opacity-80 mt-2 ${getClubTextColor(club.description)}`}>{club.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleJoinClub}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    isJoined
                      ? "bg-zenith-card/20 text-white border border-white/30 hover:bg-zenith-card/30"
                      : "bg-zenith-card text-zenith-primary hover:bg-zenith-section"
                  }`}
                >
                  {isJoined ? "Joined" : "Join Club"}
                </button>
                <Link
                  href={`/clubs/${clubId}/discussions`}
                  className="px-6 py-3 bg-zenith-card/20 text-white rounded-lg border border-white/30 hover:bg-zenith-card/30 transition-all inline-flex items-center"
                >
                  <MessageSquare size={20} className="mr-2" />
                  Discussions
                </Link>
              </div>
            </div>
          </div>

          {/* Club Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Users className="w-8 h-8 text-zenith-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-zenith-primary">
                  {club.memberCount}
                </p>
                <p className="text-sm text-zenith-muted">
                  Members
                </p>
              </div>
              <div className="text-center">
                <Calendar className="w-8 h-8 stat-events mx-auto mb-2" />
                <p className="text-2xl font-bold text-zenith-primary">
                  {events.length}
                </p>
                <p className="text-sm text-zenith-muted">
                  Events
                </p>
              </div>
              <div className="text-center">
                <MessageSquare className="w-8 h-8 stat-posts mx-auto mb-2" />
                <p className="text-2xl font-bold text-zenith-primary">
                  {posts.length}
                </p>
                <p className="text-sm text-zenith-muted">
                  Recent Posts
                </p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-zenith-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-zenith-primary">
                  4.8
                </p>
                <p className="text-sm text-zenith-muted">
                  Rating
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-zenith-primary mb-4">
                About {club.name}
              </h2>
              <p className="text-zenith-muted leading-relaxed">
                {club.long_description}
              </p>
            </div>

            {/* Recent Posts */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-zenith-primary mb-6">
                Recent Posts
              </h2>
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 border border-zenith-border rounded-lg hover:border-zenith-primary transition-colors"
                    >
                      <h3 className="font-semibold text-zenith-primary mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-zenith-muted">
                        <span>By {post.author?.name || "Unknown"}</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-zenith-muted">
                        <span className="flex items-center">
                          <Star size={16} className="mr-1" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare size={16} className="mr-1" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zenith-muted text-center py-8">
                    No posts yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Club Leadership */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zenith-primary mb-4">
                Leadership Team
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.leadership.coordinator?.name}
                    size="sm"
                  />
                  <Crown className="w-5 h-5 text-zenith-secondary" />
                  <div>
                    <p className="font-medium text-zenith-primary">
                      {club.leadership.coordinator?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-zenith-muted">
                      Coordinator
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.leadership.coCoordinator?.name}
                    size="sm"
                  />
                  <Shield className="w-5 h-5 text-zenith-primary" />
                  <div>
                    <p className="font-medium text-zenith-primary">
                      {club.leadership.coCoordinator?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-zenith-muted">
                      Co-Coordinator
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.leadership.secretary?.name}
                    size="sm"
                  />
                  <FileText className="w-5 h-5 stat-members" />
                  <div>
                    <p className="font-medium text-zenith-primary">
                      {club.leadership.secretary?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-zenith-muted">
                      Secretary
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    name={club.leadership.media?.name}
                    size="sm"
                  />
                  <Edit className="w-5 h-5 stat-events" />
                  <div>
                    <p className="font-medium text-zenith-primary">
                      {club.leadership.media?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-zenith-muted">
                      Media Head
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zenith-primary mb-4">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 border-zenith-primary pl-4"
                    >
                      <h3 className="font-medium text-zenith-primary text-sm">
                        {event.title}
                      </h3>
                      <p className="text-xs text-zenith-muted mt-1">
                        {new Date(event.date).toLocaleDateString()} at{" "}
                        {event.time}
                      </p>
                      <p className="text-xs text-zenith-muted">
                        {event.location}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-zenith-muted text-center py-4">
                    No upcoming events
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zenith-primary mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <Calendar size={16} className="text-zenith-primary" />
                  <span className="text-sm text-zenith-primary">
                    View Events
                  </span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <MessageSquare size={16} className="stat-members" />
                  <span className="text-sm text-zenith-primary">
                    Join Discussion
                  </span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <FileText size={16} className="stat-posts" />
                  <span className="text-sm text-zenith-primary">
                    View Resources
                  </span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <Settings size={16} className="text-zenith-secondary" />
                  <span className="text-sm text-zenith-primary">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
