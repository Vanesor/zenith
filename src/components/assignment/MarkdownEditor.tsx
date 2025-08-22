'use client';

import { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Link,
  Eye,
  EyeOff,
  Type
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  label?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your text...", 
  height = "200px",
  label 
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const insertText = (before: string, after: string = '', placeholder: string = 'text') => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.slice(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.slice(0, start) + before + textToInsert + after + value.slice(end);
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length + after.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.focus();
    }, 0);
  };

  const renderPreview = (text: string) => {
    // Simple markdown renderer for preview
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-zenith-section dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-zenith-section dark:bg-gray-700 p-3 rounded mt-2 mb-2 overflow-x-auto"><code>$1</code></pre>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-zenith-primary pl-4 italic text-zenith-secondary dark:text-zenith-muted">$1</blockquote>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:no-underline">$1</a>');

    // Wrap lists
    html = html.replace(/(<li.*<\/li>)/g, '<ul class="list-disc ml-4">$1</ul>');
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**', 'bold text'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*', 'italic text'), title: 'Italic' },
    { icon: Code, action: () => insertText('`', '`', 'code'), title: 'Inline Code' },
    { icon: Quote, action: () => insertText('> ', '', 'quote'), title: 'Quote' },
    { icon: List, action: () => insertText('- ', '', 'list item'), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. ', '', 'list item'), title: 'Numbered List' },
    { icon: Link, action: () => insertText('[', '](url)', 'link text'), title: 'Link' },
    { icon: Type, action: () => insertText('# ', '', 'heading'), title: 'Heading' },
  ];

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zenith-secondary dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="border border-custom dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-zenith-section dark:bg-gray-700 border-b border-custom dark:border-gray-600 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={button.action}
                className="p-2 text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-primary hover:bg-zenith-section dark:hover:bg-zenith-secondary rounded transition-colors"
                title={button.title}
              >
                <button.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-zenith-secondary dark:text-zenith-muted hover:text-primary dark:hover:text-primary hover:bg-zenith-section dark:hover:bg-zenith-secondary rounded transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="relative">
          {showPreview ? (
            <div
              className="p-4 prose prose-sm max-w-none dark:prose-invert"
              style={{ minHeight: height }}
              dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
            />
          ) : (
            <textarea
              ref={setTextareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 border-none outline-none resize-none bg-card text-primary"
              style={{ height }}
            />
          )}
        </div>
      </div>
      
      {/* Help text */}
      <p className="text-xs text-zenith-muted dark:text-zenith-muted">
        Use **bold**, *italic*, `code`, {'>'}quotes, - lists, [links](url), # headings
      </p>
    </div>
  );
}
