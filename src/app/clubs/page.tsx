"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Heart, 
  Eye, 
  Share2, 
  MoreVertical,
  Plus,
  Edit3,
  Trash2,
  Clock,
  User,
  Star,
  TrendingUp,
  Award,
  Code,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  MapPin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import ZenChatbot from '@/components/ZenChatbot';
import { useRouter } from 'next/navigation';

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

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  author_name: string;
  author_role: string;
  club_id: string;
  club_name: string;
  status: string;
  featured_image?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  reading_time: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  parent_id?: string;
  replies?: Comment[];
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

interface ClubMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  joined_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  attendees_count: number;
  status: string;
}

interface ClubStats {
  total_members: number;
  total_posts: number;
  total_events: number;
  total_likes: number;
  engagement_rate: number;
  growth_rate: number;
}

export default function ClubsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  // State management
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [activeTab, setActiveTab] = useState<'blogs' | 'team' | 'events' | 'stats'>('blogs');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [clubStats, setClubStats] = useState<ClubStats | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [newComment, setNewComment] = useState('');
  const [permissions, setPermissions] = useState<any>(null);

  // Check user permissions (similar to project permissions)
  useEffect(() => {
    checkPermissions();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/clubs/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  // Load initial data
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

  const loadClubData = async (clubId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      
      // Load blog posts
      const postsResponse = await fetch(`/api/clubs/${clubId}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setBlogPosts(postsData.posts || []);
      }

      // Load club members
      const membersResponse = await fetch(`/api/clubs/${clubId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setClubMembers(membersData.members || []);
      }

      // Load club events
      const eventsResponse = await fetch(`/api/clubs/${clubId}/events`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setClubEvents(eventsData.events || []);
      }

      // Load club statistics
      const statsResponse = await fetch(`/api/clubs/${clubId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setClubStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
    }
  };

  // Handle club selection
  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setActiveTab('blogs');
    loadClubData(club.id);
  };

  // Handle like/unlike post
  const handleLikePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBlogPosts(posts => posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle bookmark post
  const handleBookmarkPost = async (postId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBlogPosts(posts => posts.map(post => 
          post.id === postId 
            ? { ...post, is_bookmarked: !post.is_bookmarked }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Load comments for a post
  const loadComments = async (postId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        loadComments(postId);
        setBlogPosts(posts => posts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Custom markdown components
  const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-accent px-1 py-0.5 rounded text-sm`} {...props}>
          {children}
        </code>
      );
    },
    // Handle YouTube embeds
    p: ({ children }: any) => {
      const text = children?.toString() || '';
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = text.match(youtubeRegex);
      
      if (match) {
        const videoId = match[1];
        return (
          <div className="my-4">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                className="absolute inset-0 w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
      
      return <p>{children}</p>;
    },
    img: ({ src, alt }: any) => (
      <div className="my-4">
        <img 
          src={src} 
          alt={alt} 
          className="rounded-lg max-w-full h-auto mx-auto shadow-lg"
        />
      </div>
    ),
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    ),
  };

  // Filter clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           club.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || club.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [clubs, searchTerm, filterType]);

  // Check if user can create/edit/delete posts (similar to project permissions)
  const canCreatePost = permissions?.canCreatePost || false;
  const canEditPost = (post: BlogPost) => {
    return permissions?.canEditPost || post.author_id === user?.id;
  };
  const canDeletePost = (post: BlogPost) => {
    return permissions?.canDeletePost || post.author_id === user?.id;
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-main">
        <div className="container mx-auto px-4 py-8">
          {!selectedClub ? (
            // Club Discovery View
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-primary">
                  Discover Clubs
                </h1>
                <p className="text-lg text-secondary max-w-2xl mx-auto">
                  Explore vibrant communities, connect with like-minded individuals, and dive into exciting projects and discussions.
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
                    className="w-full pl-10 pr-4 py-3 border border-custom rounded-xl bg-card backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-primary"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-custom rounded-xl bg-card backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-primary"
                >
                  <option value="all">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="academic">Academic</option>
                </select>
              </div>

              {/* Clubs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => handleClubSelect(club)}
                    className="cursor-pointer group"
                  >
                    <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-custom shadow-lg hover:shadow-xl transition-all duration-300">
                      {/* Club Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-primary font-bold text-lg">
                          {club.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-primary group-hover:text-purple-600 transition-colors">
                            {club.name}
                          </h3>
                          <p className="text-sm text-secondary capitalize">
                            {club.type}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted group-hover:text-purple-500 transition-colors" />
                      </div>

                      {/* Club Description */}
                      <p className="text-secondary mb-4 line-clamp-2">
                        {club.description}
                      </p>

                      {/* Club Stats */}
                      <div className="flex items-center justify-between text-sm text-secondary">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{club.member_count} members</span>
                        </div>
                        <span className="text-xs">
                          Since {new Date(club.created_at).getFullYear()}
                        </span>
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
          ) : (
            // Club Detail View
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Club Header */}
              <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-custom">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="flex items-center gap-2 text-secondary hover:text-purple-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Back to Clubs
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-primary font-bold text-2xl">
                    {selectedClub.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-primary mb-2">
                      {selectedClub.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {selectedClub.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{selectedClub.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Coordinated by {selectedClub.coordinator_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="card rounded-xl p-1">
                <div className="flex space-x-1">
                  {[
                    { id: 'blogs', label: 'Recent Blogs', icon: MessageSquare },
                    { id: 'team', label: 'Club Team', icon: Users },
                    { id: 'events', label: 'Recent Events', icon: Calendar },
                    { id: 'stats', label: 'Stats', icon: BarChart3 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-primary shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'blogs' && (
                  <motion.div
                    key="blogs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Create Post Button */}
                    {canCreatePost && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => router.push(`/clubs/${selectedClub.id}/posts/create`)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-primary rounded-lg hover:shadow-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Create Post
                        </button>
                      </div>
                    )}

                    {/* Blog Posts */}
                    <div className="space-y-6">
                      {blogPosts.map((post) => (
                        <motion.article
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="card rounded-2xl overflow-hidden"
                        >
                          {/* Post Header */}
                          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-primary font-medium">
                                  {post.author_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 dark:text-primary">
                                      {post.author_name}
                                    </h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {post.author_role}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{post.reading_time} min read</span>
                                  </div>
                                </div>
                              </div>

                              {/* Post Actions */}
                              {(canEditPost(post) || canDeletePost(post)) && (
                                <div className="relative">
                                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 dark:text-primary mb-2">
                              {post.title}
                            </h2>
                            
                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Post Content */}
                          <div className="p-6">
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                              <ReactMarkdown components={markdownComponents}>
                                {post.content}
                              </ReactMarkdown>
                            </div>
                          </div>

                          {/* Post Footer */}
                          <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                {/* Like Button */}
                                <button
                                  onClick={() => handleLikePost(post.id)}
                                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                                    post.is_liked
                                      ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                      : 'text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                  <span>{post.likes_count}</span>
                                </button>

                                {/* Comments Button */}
                                <button
                                  onClick={() => {
                                    setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                                    if (!comments[post.id]) {
                                      loadComments(post.id);
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{post.comments_count}</span>
                                </button>

                                {/* Views */}
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                  <Eye className="w-4 h-4" />
                                  <span>{post.views_count}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Bookmark Button */}
                                <button
                                  onClick={() => handleBookmarkPost(post.id)}
                                  className={`p-2 rounded-lg transition-all ${
                                    post.is_bookmarked
                                      ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                                      : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                  }`}
                                >
                                  {post.is_bookmarked ? (
                                    <BookmarkCheck className="w-4 h-4 fill-current" />
                                  ) : (
                                    <Bookmark className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Share Button */}
                                <button className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {showComments[post.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
                              >
                                {/* Add Comment */}
                                <div className="flex gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-primary text-sm font-medium">
                                    {user?.name?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Write a comment..."
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      className="flex-1 px-3 py-2 border-custom rounded-lg bg-main focus:outline-none focus:ring-2 focus:ring-purple-500 text-primary"
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    />
                                    <button
                                      onClick={() => handleAddComment(post.id)}
                                      disabled={!newComment.trim()}
                                      className="px-4 py-2 bg-purple-500 text-primary rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      Post
                                    </button>
                                  </div>
                                </div>

                                {/* Comments List */}
                                {comments[post.id] && (
                                  <div className="space-y-3">
                                    {comments[post.id].map((comment) => (
                                      <div key={comment.id} className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-primary text-xs font-medium">
                                          {comment.author_name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                                            <div className="font-medium text-sm text-gray-900 dark:text-primary mb-1">
                                              {comment.author_name}
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                              {comment.content}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                            <button className="hover:text-purple-600">Like</button>
                                            <button className="hover:text-purple-600">Reply</button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.article>
                      ))}
                    </div>

                    {blogPosts.length === 0 && (
                      <div className="text-center py-12 card rounded-2xl">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-primary mb-2">
                          No blog posts yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Be the first to share something interesting!
                        </p>
                        {canCreatePost && (
                          <button
                            onClick={() => router.push(`/clubs/${selectedClub.id}/posts/create`)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-primary rounded-lg hover:shadow-lg transition-all"
                          >
                            Create First Post
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'team' && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {clubMembers.map((member) => (
                      <div
                        key={member.id}
                        className="card rounded-xl p-6"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-primary font-bold text-xl">
                            {member.name.charAt(0)}
                          </div>
                          <h3 className="font-semibold text-primary mb-1">
                            {member.name}
                          </h3>
                          <p className="text-sm text-purple-600 dark:text-purple-400 capitalize mb-2">
                            {member.role}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}

                    {clubMembers.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-primary mb-2">
                          No team members listed
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Member information will appear here once available.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'events' && (
                  <motion.div
                    key="events"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {clubEvents.map((event) => (
                      <div
                        key={event.id}
                        className="card rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-primary mb-2">
                              {event.title}
                            </h3>
                            <p className="text-secondary mb-3">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(event.event_date).toLocaleDateString()}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{event.attendees_count} attendees</span>
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.status === 'upcoming' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : event.status === 'ongoing'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {event.status}
                          </div>
                        </div>
                      </div>
                    ))}

                    {clubEvents.length === 0 && (
                      <div className="text-center py-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-primary mb-2">
                          No events yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Check back later for upcoming events and activities.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'stats' && clubStats && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {[
                      { label: 'Total Members', value: clubStats.total_members, icon: Users, color: 'text-blue-600' },
                      { label: 'Blog Posts', value: clubStats.total_posts, icon: MessageSquare, color: 'text-purple-600' },
                      { label: 'Events Hosted', value: clubStats.total_events, icon: Calendar, color: 'text-green-600' },
                      { label: 'Total Likes', value: clubStats.total_likes, icon: Heart, color: 'text-red-600' },
                      { label: 'Engagement Rate', value: `${clubStats.engagement_rate}%`, icon: TrendingUp, color: 'text-orange-600' },
                      { label: 'Growth Rate', value: `${clubStats.growth_rate}%`, icon: Award, color: 'text-yellow-600' },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <stat.icon className={`w-8 h-8 ${stat.color}`} />
                          <span className={`text-2xl font-bold ${stat.color}`}>
                            {stat.value}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-primary">
                          {stat.label}
                        </h3>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
        
        <ZenChatbot />
      </div>
    </LayoutWrapper>
  );
}
