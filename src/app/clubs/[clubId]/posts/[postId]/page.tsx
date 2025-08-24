"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  MessageSquare,
  Eye,
  ArrowLeft,
  Send,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import ClubLogo from "@/components/ClubLogo";
import { SectionLoader } from "@/components/UniversalLoader";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ZenChatbot from "@/components/ZenChatbot";

interface PostData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    profile_image_url?: string;
    role: string;
    clubRole?: string;
    club?: {
      name: string;
      color: string;
    } | null;
  };
  club: {
    id: string;
    name: string;
    icon: string;
    logo_url?: string;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    profile_image_url?: string;
    role?: string;
    clubRole?: string;
    club?: {
      name: string;
      color: string;
    } | null;
  };
  likeCount: number;
  isLiked: boolean;
  created_at: string;
  updated_at?: string;
  replies?: Comment[];
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clubId = params.clubId as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Edit/Delete states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.documentElement.classList.contains('dark')
      );
    };
    
    checkDarkMode();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  useEffect(() => {
    if (clubId && postId) {
      fetchPost();
      fetchComments();
    }
  }, [clubId, postId]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/clubs/${clubId}/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else {
        setError('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/clubs/${clubId}/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLikePost = async () => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/clubs/${clubId}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPost(prev => prev ? {
          ...prev,
          isLiked: !prev.isLiked,
          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/clubs/${clubId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(); // Refresh comments
        // Update comment count
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/clubs/${clubId}/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  // Edit comment functions
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || actionLoading) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/comments/${editingCommentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === editingCommentId
            ? { ...comment, content: data.comment.content, updated_at: data.comment.updated_at }
            : comment
        ));
        setEditingCommentId(null);
        setEditContent('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to edit comment');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete comment functions
  const handleDeleteComment = async (commentId: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('zenith-token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setPost(prev => prev ? { ...prev, commentCount: prev.commentCount - 1 } : null);
        setShowDeleteModal(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to format user role display
  const formatUserRole = (role: string, clubRole?: string) => {
    if (role === 'zenith_committee') return 'Zenith Committee';
    if (role === 'coordinator') return 'Coordinator';
    if (role === 'co_coordinator') return 'Co-Coordinator';
    if (clubRole === 'club_coordinator') return 'Club Coordinator';
    if (clubRole === 'coordinator') return 'Club Coordinator';
    if (clubRole === 'co_coordinator') return 'Club Co-Coordinator';
    if (clubRole === 'secretary') return 'Club Secretary';
    if (clubRole === 'treasurer') return 'Club Treasurer';
    if (clubRole === 'member') return 'Club Member';
    if (clubRole === 'visitor') return 'Visitor';
    return 'Student';
  };

  // Permission check functions
  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    const isCreator = comment.author.id === user.id;
    const createdAt = new Date(comment.created_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return isCreator && createdAt > twoHoursAgo;
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    const isCreator = comment.author.id === user.id;
    const isZenithCommittee = user.role === 'zenith_committee';
    const isClubModerator = user.role === 'coordinator' || user.role === 'co_coordinator';
    
    const createdAt = new Date(comment.created_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (isCreator && createdAt > twoHoursAgo) return true;
    if ((isZenithCommittee || isClubModerator) && createdAt > sevenDaysAgo) return true;
    
    return false;
  };

  if (loading) {
    return <SectionLoader message="Loading post..." />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {error || "Post Not Found"}
          </h1>
          <button
            onClick={() => router.push(`/clubs/${clubId}`)}
            className="text-zenith-accent hover:no-underline"
          >
            Back to Club
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/clubs/${clubId}`)}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to {post.club.name}
          </button>
        </div>

        {/* Post Header with Club Logo */}
        <div className="bg-card rounded-xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-4">
            <ClubLogo 
              clubId={post.club.id}
              clubName={post.club.name}
              size="lg"
              fallbackIcon={post.club.icon}
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-primary">{post.club.name}</h2>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span>by {post.author.name}</span>
                <span>•</span>
                <span>{formatUserRole(post.author.role, post.author.clubRole)}</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-lg overflow-hidden mb-6"
        >
          {/* Post Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={post.author.name}
                  avatar={post.author.avatar}
                  profile_image_url={post.author.profile_image_url}
                  size="md"
                />
                <div>
                  <h3 className="font-medium text-primary">{post.author.name}</h3>
                  <p className="text-sm text-secondary">{formatUserRole(post.author.role, post.author.clubRole)}</p>
                  {post.author.club && (
                    <p className="text-xs text-accent">from {post.author.club.name}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-secondary">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-primary mb-4">{post.title}</h1>
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="p-6">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={isDarkMode ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }: any) => (
                    <h1 className="text-3xl font-bold text-primary mb-4 border-b border-border pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }: any) => (
                    <h2 className="text-2xl font-semibold text-primary mb-3 mt-6">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }: any) => (
                    <h3 className="text-xl font-medium text-primary mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }: any) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 italic text-secondary bg-purple-50 dark:bg-purple-900/20 py-2 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  img: ({ src, alt }: any) => (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="rounded-lg shadow-lg max-w-full h-auto mx-auto" 
                    />
                  ),
                  a: ({ href, children }: any) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Post Actions */}
          <div className="p-6 border-t border-border bg-gradient-to-r from-muted/30 to-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLikePost}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    post.isLiked
                      ? 'text-red-600 bg-red-50 dark:bg-red-900/20 shadow-lg'
                      : 'text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-md'
                  }`}
                >
                  <motion.div
                    animate={post.isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <span className="font-medium">{post.likeCount}</span>
                </motion.button>

                <div className="flex items-center gap-2 text-secondary px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.commentCount}</span>
                </div>

                <div className="flex items-center gap-2 text-secondary px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20">
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">{post.viewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <div className="bg-card rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-primary mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Input */}
          {user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6"
            >
              <div className="flex gap-4">
                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  profile_image_url={user.profile_image_url}
                  size="md"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-sm"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-muted">
                      {newComment.length}/500 characters
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submittingComment || newComment.length > 500}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <Send className="w-4 h-4" />
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <UserAvatar
                      name={comment.author.name}
                      avatar={comment.author.avatar}
                      profile_image_url={comment.author.profile_image_url}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold text-primary">{comment.author.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full font-medium">
                                {formatUserRole(comment.author.role || 'student', comment.author.clubRole)}
                              </span>
                              {comment.author.club && (
                                <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                                  from {comment.author.club.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-secondary">
                            {new Date(comment.created_at).toLocaleDateString()}
                            {comment.updated_at && comment.updated_at !== comment.created_at && (
                              <span className="ml-1 text-xs text-muted">(edited)</span>
                            )}
                          </span>
                        </div>
                        
                        {/* Comment Actions Dropdown */}
                        {(canEditComment(comment) || canDeleteComment(comment)) && (
                          <div className="relative">
                            <button 
                              className="dropdown-trigger p-2 text-muted hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => setOpenDropdownId(openDropdownId === comment.id ? null : comment.id)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openDropdownId === comment.id && (
                              <div className="dropdown-menu absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                                {canEditComment(comment) && (
                                  <button
                                    onClick={() => {
                                      handleEditComment(comment);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-t-lg"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Comment
                                  </button>
                                )}
                                {canDeleteComment(comment) && (
                                  <button
                                    onClick={() => {
                                      setShowDeleteModal(comment.id);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Comment
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Content - Edit Mode */}
                      {editingCommentId === comment.id ? (
                        <div className="mb-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            rows={3}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-muted">
                              {editContent.length}/500 characters
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={!editContent.trim() || actionLoading || editContent.length > 500}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                {actionLoading ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-secondary mb-4 leading-relaxed">{comment.content}</p>
                      )}
                      
                      {/* Comment Actions */}
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                            comment.isLiked
                              ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                              : 'text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <motion.div
                            animate={comment.isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                          </motion.div>
                          <span className="font-medium">{comment.likeCount}</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl"
              >
                <MessageSquare className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">No comments yet</h3>
                <p className="text-secondary">Be the first to share your thoughts on this post!</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 modal-backdrop-gradient"
              onClick={() => setShowDeleteModal(null)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 mx-4 max-w-md w-full modal-border-gradient"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold gradient-text-primary">
                  Delete Comment
                </h3>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete this comment? This action cannot be undone.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteComment(showDeleteModal)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ZenChatbot />
    </div>
  );
}
