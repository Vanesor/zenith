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
import { useOptionalAuth, useClubManagementGuard } from "@/hooks/useAuthGuard";
import UserAvatar from "@/components/UserAvatar";
import ClubLogo from "@/components/ClubLogo";
import { ProtectedContent } from "@/components/ProtectedContent";
import { AuthButton, JoinEventButton, CreatePostButton } from "@/components/AuthButton";
import { SectionLoader } from "@/components/UniversalLoader";

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
    'Ascend': 'text-primary',    // Blue for ASCEND
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
  const auth = useOptionalAuth();
  const currentClubId = params.clubId as string;
  const clubGuard = useClubManagementGuard(currentClubId);
  const [isJoined, setIsJoined] = useState(false);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/clubs/${currentClubId}`, {
          credentials: 'include', // Include cookies for authentication
          headers: {
            "Content-Type": "application/json",
            ...(auth.user && localStorage.getItem("zenith-token") && {
              Authorization: `Bearer ${localStorage.getItem("zenith-token")}`
            })
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

    if (currentClubId) {
      if (auth.user) {
        setIsJoined(auth.user.club_id === currentClubId);
      }
      fetchData();
    }
  }, [auth.user, currentClubId]);

  if (auth.isLoading || loading) {
    return <SectionLoader message="Loading club information..." />;
  }

  if (error || !clubData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
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
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${club.color} p-8 text-primary`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <div className="w-20 h-20 bg-card/20 rounded-2xl flex items-center justify-center">
                  <ClubLogo 
                    clubId={club.id}
                    clubName={club.name}
                    size="xl"
                    fallbackIcon={club.icon}
                    className="text-primary"
                  />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold mb-2 ${getClubTextColor(club.name)}`}>{club.name}</h1>
                  <p className={`text-xl opacity-90 ${getClubTextColor(club.type)}`}>{club.type}</p>
                  <p className={`text-lg opacity-80 mt-2 ${getClubTextColor(club.description)}`}>{club.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <AuthButton
                  onClick={handleJoinClub}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    isJoined
                      ? "bg-card/20 text-primary border border-white/30 hover:bg-card/30"
                      : "bg-card text-primary hover:bg-zenith-section"
                  }`}
                  requireAuth={true}
                  authPrompt={`Please sign in to ${isJoined ? 'manage your membership in' : 'join'} ${club.name}`}
                  fallbackText={isJoined ? "Member" : "Sign In to Join"}
                  variant="secondary"
                >
                  {isJoined ? "Joined" : "Join Club"}
                </AuthButton>
                
                <AuthButton
                  onClick={() => router.push(`/clubs/${currentClubId}/discussions`)}
                  className="px-6 py-3 bg-card/20 text-primary rounded-lg border border-white/30 hover:bg-card/30 transition-all inline-flex items-center"
                  requireAuth={true}
                  authPrompt="Please sign in to access discussions"
                  fallbackText="Sign In for Discussions"
                  variant="ghost"
                  icon={<MessageSquare size={20} className="mr-2" />}
                >
                  Discussions
                </AuthButton>
              </div>
            </div>
          </div>

          {/* Club Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">
                  {club.memberCount}
                </p>
                <p className="text-sm text-zenith-muted">
                  Members
                </p>
              </div>
              <div className="text-center">
                <Calendar className="w-8 h-8 stat-events mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">
                  {events.length}
                </p>
                <p className="text-sm text-zenith-muted">
                  Events
                </p>
              </div>
              <div className="text-center">
                <MessageSquare className="w-8 h-8 stat-posts mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">
                  {posts.length}
                </p>
                <p className="text-sm text-zenith-muted">
                  Recent Posts
                </p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-zenith-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">
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
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-primary mb-4">
                About {club.name}
              </h2>
              <p className="text-zenith-muted leading-relaxed">
                {club.long_description}
              </p>
            </div>

            {/* Recent Posts */}
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-primary">
                  Recent Posts
                </h2>
                <ProtectedContent
                  requiredRoles={['admin', 'coordinator', 'co_coordinator', 'committee_member', 'student']}
                  fallback={null}
                  showAuthButton={false}
                >
                  <CreatePostButton 
                    onCreate={() => router.push(`/clubs/${currentClubId}/posts/create`)}
                    className="px-4 py-2"
                  />
                </ProtectedContent>
              </div>
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 border border-custom rounded-lg hover:border-zenith-primary transition-colors"
                    >
                      <h3 className="font-semibold text-primary mb-2">
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
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-primary mb-4">
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
                    <p className="font-medium text-primary">
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
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-primary">
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
                    <p className="font-medium text-primary">
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
                    <p className="font-medium text-primary">
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
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-primary">
                  Upcoming Events
                </h2>
                <ProtectedContent
                  requiredRoles={['admin', 'coordinator', 'co_coordinator', 'committee_member']}
                  fallback={null}
                  showAuthButton={false}
                >
                  <AuthButton
                    onClick={() => router.push(`/clubs/${currentClubId}/events/create`)}
                    className="px-3 py-1 text-sm"
                    size="sm"
                    authPrompt="Please sign in to create events"
                    fallbackText="Sign In to Create"
                  >
                    Create Event
                  </AuthButton>
                </ProtectedContent>
              </div>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 border-zenith-primary pl-4 pr-2 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-primary text-sm">
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
                      <JoinEventButton
                        onJoin={() => console.log(`Joining event ${event.id}`)}
                        className="px-2 py-1 text-xs ml-2"
                        eventTitle={event.title}
                      />
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
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-sm text-primary">
                    View Events
                  </span>
                </button>
                
                <AuthButton
                  onClick={() => router.push(`/clubs/${currentClubId}/discussions`)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left bg-transparent border-0 shadow-none"
                  variant="ghost"
                  requireAuth={true}
                  authPrompt="Please sign in to join discussions"
                  fallbackText="Sign In to Join Discussion"
                >
                  <MessageSquare size={16} className="stat-members" />
                  <span className="text-sm text-primary">
                    Join Discussion
                  </span>
                </AuthButton>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left">
                  <FileText size={16} className="stat-posts" />
                  <span className="text-sm text-primary">
                    View Resources
                  </span>
                </button>
                
                <ProtectedContent
                  requiredRoles={['admin', 'coordinator', 'co_coordinator']}
                  fallback={
                    <div className="w-full flex items-center space-x-3 p-3 rounded-lg opacity-50">
                      <Settings size={16} className="text-zenith-secondary" />
                      <span className="text-sm text-gray-400">
                        Settings (Management Only)
                      </span>
                    </div>
                  }
                >
                  <button 
                    onClick={() => router.push(`/clubs/${currentClubId}/settings`)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors text-left"
                  >
                    <Settings size={16} className="text-zenith-secondary" />
                    <span className="text-sm text-primary">
                      Settings
                    </span>
                  </button>
                </ProtectedContent>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
