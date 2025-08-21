"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Eye, Edit3, Upload, X, Check, 
  Bold, Italic, Code, Link, Image, Video, List, Quote, 
  Heading, Hash, Type, FileText, Sparkles, Zap,
  Globe, Lock, Calendar, User, BookOpen, Target,
  Layers, Palette, Settings, MessageSquare, Heart,
  Wand2, Users, ChevronDown, Star
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Club {
  id: string;
  name: string;
  description: string;
  avatar: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  // Enhanced refs for better UX
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'published' as 'draft' | 'published',
    featured_image_url: '',
    category: 'general'
  });
  
  const [club, setClub] = useState<Club | null>(null);
  const [uiState, setUiState] = useState({
    loading: false,
    error: '',
    isPreview: false,
    isSaving: false,
    focusedField: '',
    showAdvanced: false,
    showSuccess: false,
    showAiModal: false,
    aiLoading: false
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Real-time content metrics (simplified)
  const contentMetrics = useMemo(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = formData.content.length;
    return { words, chars };
  }, [formData.content]);

  // Fetch club info
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const token = localStorage.getItem('zenith-token');
        const response = await fetch(`/api/clubs/${clubId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClub(data.club);
        }
      } catch (error) {
        console.error('Error fetching club:', error);
      }
    };

    if (clubId) {
      fetchClub();
    }
  }, [clubId]);

  // Rich text formatting functions
  const insertText = (before: string, after = '', placeholder = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = before + textToInsert + after;
    
    const newContent = 
      formData.content.substring(0, start) + 
      newText + 
      formData.content.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const formatBold = () => insertText('**', '**', 'bold text');
  const formatItalic = () => insertText('*', '*', 'italic text');
  const formatCode = () => insertText('`', '`', 'code');
  const formatHeading = () => insertText('## ', '', 'Heading');
  const formatQuote = () => insertText('> ', '', 'Quote');
  const formatList = () => insertText('- ', '', 'List item');
  const formatLink = () => insertText('[', '](https://example.com)', 'link text');
  const formatImage = () => insertText('![', '](https://example.com/image.jpg)', 'alt text');
  const formatVideo = () => insertText('\n\n[![', '](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)\n\n', 'Video Title');
  const formatCodeBlock = () => insertText('\n```javascript\n', '\n```\n', 'your code here');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const token = localStorage.getItem('zenith-token');
      
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200).replace(/[#*`]/g, '') + '...',
        slug,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        status: formData.status,
        featured_image_url: formData.featured_image_url || null,
        category: formData.category
      };

      const response = await fetch(`/api/clubs/${clubId}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        setUiState(prev => ({ ...prev, showSuccess: true }));
        setTimeout(() => {
          router.push(`/clubs/${clubId}`);
        }, 2000);
      } else {
        const data = await response.json();
        setUiState(prev => ({ ...prev, error: data.error || 'Failed to create post' }));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setUiState(prev => ({ ...prev, error: 'Failed to create post' }));
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate excerpt from content
    if (name === 'content' && !formData.excerpt) {
      const excerpt = value.substring(0, 200).replace(/[#*`]/g, '') + '...';
      setFormData(prev => ({ ...prev, excerpt }));
    }
  };

  // AI Assistant function with Google Gemini
  const getAiSuggestion = async (userPrompt: string) => {
    try {
      setUiState(prev => ({ ...prev, aiLoading: true }));
      
      // Check for API key - try different environment variable names
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                     process.env.GEMINI_API_KEY || 
                     process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
      }      // Import Google Generative AI
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Create comprehensive RAG prompt
      const ragContext = {
        clubName: club?.name || 'Student Club',
        clubDescription: club?.description || 'A vibrant student community',
        currentTitle: formData.title,
        currentContent: formData.content,
        category: formData.category,
        tags: formData.tags,
        contentMetrics: contentMetrics
      };
      
      const systemPrompt = `You are an expert content writer and blog assistant for "${ragContext.clubName}", ${ragContext.clubDescription}. 
      
CONTEXT:
- Club: ${ragContext.clubName}
- Current Title: "${ragContext.currentTitle}"
- Category: ${ragContext.category}
- Current Content Length: ${ragContext.contentMetrics.words} words
- Tags: ${ragContext.tags}

WRITING GUIDELINES:
1. Write engaging, informative content that resonates with students
2. Use a friendly, professional tone appropriate for academic communities
3. Include actionable insights and practical examples
4. Structure content with clear headings and bullet points
5. Make it relevant to student life and learning
6. Use markdown formatting for better readability
7. Keep paragraphs concise and scannable

CURRENT CONTENT:
"${ragContext.currentContent}"

USER REQUEST: ${userPrompt}

Please provide helpful, relevant content that enhances the blog post. If the user wants you to generate new content, make it engaging and valuable. If they want you to improve existing content, provide constructive suggestions and improvements.`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const generatedContent = response.text();
      
      // Insert AI suggestion into content intelligently
      if (userPrompt.toLowerCase().includes('title') || userPrompt.toLowerCase().includes('heading')) {
        // If it's about title, suggest title improvements
        setFormData(prev => ({ 
          ...prev, 
          title: generatedContent.replace(/[#*]/g, '').trim()
        }));
      } else {
        // Insert content with proper spacing
        const separator = formData.content ? '\n\n' : '';
        setFormData(prev => ({ 
          ...prev, 
          content: prev.content + separator + generatedContent 
        }));
      }
      
    } catch (error) {
      console.error('AI suggestion error:', error);
      setUiState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate Zen suggestion. Please check your API key configuration.' 
      }));
    } finally {
      setUiState(prev => ({ ...prev, aiLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Success Animation */}
      <AnimatePresence>
        {uiState.showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Post Created Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Redirecting to club page...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {uiState.showAiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setUiState(prev => ({ ...prev, showAiModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Zen Writing Assistant
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by Google Gemini • Enhanced with RAG
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      getAiSuggestion("Generate a compelling introduction paragraph that hooks readers and sets the context for this blog post");
                      setUiState(prev => ({ ...prev, showAiModal: false }));
                    }}
                    disabled={uiState.aiLoading}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all border border-blue-200 dark:border-gray-600 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Generate Introduction</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create an engaging opening</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      getAiSuggestion("Expand and enhance the current content with more detailed explanations, examples, and insights");
                      setUiState(prev => ({ ...prev, showAiModal: false }));
                    }}
                    disabled={uiState.aiLoading}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 hover:from-green-100 hover:to-blue-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all border border-green-200 dark:border-gray-600 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Expand Content</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Add depth and details</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      getAiSuggestion("Write a strong conclusion that summarizes key points and provides actionable next steps for readers");
                      setUiState(prev => ({ ...prev, showAiModal: false }));
                    }}
                    disabled={uiState.aiLoading}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600 hover:from-orange-100 hover:to-red-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all border border-orange-200 dark:border-gray-600 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Write Conclusion</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create a strong ending</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      getAiSuggestion("Improve the writing style, tone, and readability. Make it more engaging and professional");
                      setUiState(prev => ({ ...prev, showAiModal: false }));
                    }}
                    disabled={uiState.aiLoading}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 hover:from-purple-100 hover:to-pink-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all border border-purple-200 dark:border-gray-600 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">Improve Style</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Enhance tone and flow</p>
                  </button>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Custom Request</h4>
                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want me to help you with... 

Examples:
• 'Write about the benefits of joining our coding club'
• 'Create a section about upcoming events'
• 'Help me explain complex technical concepts'
• 'Generate ideas for engaging student activities'
• 'Improve the title to be more catchy'"
                    className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {aiPrompt.length}/500
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setUiState(prev => ({ ...prev, showAiModal: false }))}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (aiPrompt.trim()) {
                        getAiSuggestion(aiPrompt);
                        setAiPrompt('');
                        setUiState(prev => ({ ...prev, showAiModal: false }));
                      }
                    }}
                    disabled={!aiPrompt.trim() || uiState.aiLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {uiState.aiLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate with Zen
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Context Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Context Awareness</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Club:</span> {club?.name || 'Loading...'}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {formData.category}
                  </div>
                  <div>
                    <span className="font-medium">Current Words:</span> {contentMetrics.words}
                  </div>
                  <div>
                    <span className="font-medium">Characters:</span> {contentMetrics.chars}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Zen understands your club context and current content to provide relevant suggestions
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - Made sticky */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 bg-gradient-to-br from-blue-50/95 via-white/95 to-purple-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 mb-8"
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.back()}
                  className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Post
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {club ? `Share your thoughts with ${club.name}` : 'Loading club...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {club?.name || 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {uiState.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                {uiState.error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <label className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Type className="w-5 h-5 text-white" />
                </div>
                Post Title
              </label>
              <input
                ref={titleRef}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onFocus={() => setUiState(prev => ({ ...prev, focusedField: 'title' }))}
                onBlur={() => setUiState(prev => ({ ...prev, focusedField: '' }))}
                placeholder="Write an engaging title that captures attention..."
                className={`
                  w-full px-6 py-4 text-xl font-semibold 
                  bg-white/80 dark:bg-gray-700/80 
                  rounded-xl border-2 transition-all duration-300
                  placeholder-gray-400 dark:placeholder-gray-500
                  text-gray-900 dark:text-white
                  ${uiState.focusedField === 'title' 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 transform scale-[1.01]' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }
                  focus:outline-none
                `}
                required
              />
            </motion.div>

            {/* Content Editor */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  Content
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{contentMetrics.words} words</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUiState(prev => ({ ...prev, isPreview: !prev.isPreview }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      uiState.isPreview
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shadow-md'
                        : 'bg-white/80 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50'
                    }`}
                  >
                    {uiState.isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {uiState.isPreview ? 'Edit' : 'Preview'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setUiState(prev => ({ ...prev, showAiModal: true }))}
                    disabled={uiState.aiLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zen Writing Assistant"
                  >
                    {uiState.aiLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Zen Working...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Zen Assistant
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {!uiState.isPreview && (
                <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: Bold, action: formatBold, title: "Bold", shortcut: "⌘B" },
                      { icon: Italic, action: formatItalic, title: "Italic", shortcut: "⌘I" },
                      { icon: Code, action: formatCode, title: "Inline Code" },
                      { icon: Heading, action: formatHeading, title: "Heading" },
                      { icon: Quote, action: formatQuote, title: "Quote" },
                      { icon: List, action: formatList, title: "List" },
                      { icon: Link, action: formatLink, title: "Link" },
                      { icon: Image, action: formatImage, title: "Image" },
                      { icon: Video, action: formatVideo, title: "Video" },
                    ].map(({ icon: Icon, action, title, shortcut }) => (
                      <motion.button
                        key={title}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={action}
                        className="group relative flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200"
                        title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
                      >
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                          {title}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {uiState.isPreview ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[500px] p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-900/80 rounded-2xl border-2 border-blue-200/50 dark:border-blue-700/30 shadow-2xl backdrop-blur-sm relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                      <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Preview Mode</span>
                    </div>
                    
                    <div className="prose prose-lg prose-blue dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <SyntaxHighlighter
                                style={atomDark as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {formData.content || '*Start writing to see the preview...*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="relative">
                  <textarea
                    ref={contentRef}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    onFocus={() => setUiState(prev => ({ ...prev, focusedField: 'content' }))}
                    onBlur={() => setUiState(prev => ({ ...prev, focusedField: '' }))}
                    placeholder="Share your thoughts, ideas, and insights with the community... Use the toolbar above for formatting!"
                    rows={20}
                    className={`
                      w-full px-6 py-4 
                      bg-white/80 dark:bg-gray-700/80 
                      rounded-xl border-2 transition-all duration-300
                      placeholder-gray-400 dark:placeholder-gray-500
                      text-gray-900 dark:text-white
                      font-mono text-sm leading-relaxed
                      resize-none
                      ${uiState.focusedField === 'content' 
                        ? 'border-green-500 shadow-lg shadow-green-500/20 ring-4 ring-green-500/10' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
                      }
                      focus:outline-none
                    `}
                    required
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                Post Settings
              </h3>

              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Publication Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="published">📢 Publish Now</option>
                    <option value="draft">📝 Save as Draft</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="general">⭐ General</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="tutorial">📚 Tutorial</option>
                    <option value="discussion">💬 Discussion</option>
                    <option value="project">🚀 Project</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Featured Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <Image className="w-5 h-5 text-white" />
                </div>
                Featured Image
              </h3>
              <input
                type="url"
                name="featured_image_url"
                value={formData.featured_image_url}
                onChange={handleChange}
                onFocus={() => setUiState(prev => ({ ...prev, focusedField: 'image' }))}
                onBlur={() => setUiState(prev => ({ ...prev, focusedField: '' }))}
                placeholder="https://example.com/image.jpg"
                className={`
                  w-full px-4 py-3 
                  bg-white/80 dark:bg-gray-700/80 
                  border-2 rounded-lg transition-all duration-300
                  placeholder-gray-400 dark:placeholder-gray-500
                  text-gray-900 dark:text-white
                  ${uiState.focusedField === 'image' 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500'
                  }
                  focus:outline-none
                `}
              />
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                Tags
              </h3>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                onFocus={() => setUiState(prev => ({ ...prev, focusedField: 'tags' }))}
                onBlur={() => setUiState(prev => ({ ...prev, focusedField: '' }))}
                placeholder="technology, innovation, tutorial"
                className={`
                  w-full px-4 py-3 
                  bg-white/80 dark:bg-gray-700/80 
                  border-2 rounded-lg transition-all duration-300
                  placeholder-gray-400 dark:placeholder-gray-500
                  text-gray-900 dark:text-white
                  ${uiState.focusedField === 'tags' 
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }
                  focus:outline-none
                `}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Separate tags with commas
              </p>
            </motion.div>

            {/* Excerpt */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Excerpt
              </h3>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                onFocus={() => setUiState(prev => ({ ...prev, focusedField: 'excerpt' }))}
                onBlur={() => setUiState(prev => ({ ...prev, focusedField: '' }))}
                placeholder="A brief description of your post..."
                rows={4}
                className={`
                  w-full px-4 py-3 
                  bg-white/80 dark:bg-gray-700/80 
                  border-2 rounded-lg transition-all duration-300
                  placeholder-gray-400 dark:placeholder-gray-500
                  text-gray-900 dark:text-white
                  resize-none
                  ${uiState.focusedField === 'excerpt' 
                    ? 'border-green-500 shadow-lg shadow-green-500/20 ring-4 ring-green-500/10' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
                  }
                  focus:outline-none
                `}
              />
            </motion.div>

            {/* Content Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-white mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Content Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Words</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {contentMetrics.words}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Characters</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {contentMetrics.chars}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Action Bar */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  💡 Tip: Use Markdown syntax for rich formatting
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={uiState.loading || !formData.title.trim() || !formData.content.trim()}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-3">
                      {uiState.loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Save className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {uiState.loading ? 'Creating Post...' : 'Create Post'}
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}