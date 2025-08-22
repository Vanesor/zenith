"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Edit3, Eye, Hash, Type, FileText, Save, Loader, 
  Bold, Italic, Code, Link, Image, Video, List, 
  Quote, Heading, Upload, Plus, Minus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CreatePostModalProps {
  clubId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostModal({ clubId, onClose, onSuccess }: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'published' as 'draft' | 'published',
    featured_image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Rich text formatting functions
  const insertText = (before: string, after = '', placeholder = '') => {
    const textarea = document.querySelector('[name="content"]') as HTMLTextAreaElement;
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
      textarea.focus();
      const newPosition = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newPosition, newPosition);
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
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zenith-token');
      
      // Generate slug from title
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
        featured_image_url: formData.featured_image_url || null
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
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-h-[95vh] overflow-hidden flex flex-col zenith-bg-card">
      {/* Header */}
      <div className="border-b zenith-border px-6 py-4 flex items-center justify-between zenith-bg-section">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold zenith-text-primary">
              Create New Post
            </h2>
            <p className="text-sm zenith-text-secondary">
              Share your thoughts and insights with the community
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isPreview 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shadow-md'
                : 'zenith-bg-card zenith-text-secondary hover:zenith-bg-hover border zenith-border'
            }`}
          >
            {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:zenith-bg-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 zenith-text-muted" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title Section */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                  <Type className="w-4 h-4 text-blue-500" />
                  Post Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter an engaging title for your post..."
                  className="w-full px-4 py-3 text-lg border zenith-border rounded-xl zenith-bg-input zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                  <Image className="w-4 h-4 text-purple-500" />
                  Featured Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border zenith-border rounded-xl zenith-bg-input zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="technology, innovation, tutorial (comma-separated)"
                  className="w-full px-4 py-3 border zenith-border rounded-xl zenith-bg-input zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                  <FileText className="w-4 h-4 text-green-500" />
                  Brief Description
                </label>
                <input
                  type="text"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  placeholder="A short description that will appear in the post preview..."
                  className="w-full px-4 py-3 border zenith-border rounded-xl zenith-bg-input zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                <Edit3 className="w-4 h-4 text-blue-500" />
                Content
              </label>
              
              {!isPreview && (
                <div className="mb-3 p-3 zenith-bg-section rounded-lg border zenith-border">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={formatBold}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatItalic}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatCode}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Inline Code"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatHeading}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Heading"
                    >
                      <Heading className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatQuote}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Quote"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatList}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatLink}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Link"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatImage}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Image"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatVideo}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="YouTube Video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={formatCodeBlock}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm zenith-bg-card border zenith-border rounded-lg hover:zenith-bg-hover transition-colors zenith-text-secondary"
                      title="Code Block"
                    >
                      <Code className="w-4 h-4" />
                      <span className="text-xs">Block</span>
                    </button>
                  </div>
                </div>
              )}
              
              {isPreview ? (
                <div className="min-h-[400px] p-6 border zenith-border rounded-xl zenith-bg-section">
                  <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
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
                            <code className="px-1.5 py-0.5 zenith-bg-section rounded text-sm zenith-text-secondary" {...props}>
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
              ) : (
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your post content here... Use the toolbar above for formatting options!"
                  rows={16}
                  className="w-full px-4 py-4 border zenith-border rounded-xl zenith-bg-input zenith-text-primary placeholder:zenith-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all font-mono text-sm leading-relaxed"
                  required
                />
              )}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold zenith-text-primary mb-3">
                Publication Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border zenith-border rounded-xl zenith-bg-input zenith-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="published">📢 Publish immediately</option>
                <option value="draft">📝 Save as draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t zenith-border px-6 py-4 zenith-bg-section">
          <div className="flex items-center justify-between">
            <div className="text-sm zenith-text-muted">
              💡 Tip: Use Markdown syntax for rich formatting
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 zenith-text-secondary hover:zenith-text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
