'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

interface PlaygroundCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

export function PlaygroundCodeEditor({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  readOnly = false,
  showLineNumbers = true,
  className = ''
}: PlaygroundCodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: showLineNumbers ? 'on' : 'off',
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      readOnly: readOnly,
    });

    // Set theme
    monaco.editor.setTheme(theme);
  };

  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  return (
    <div className={`h-full ${className}`}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          lineNumbers: showLineNumbers ? 'on' : 'off',
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          readOnly: readOnly,
          padding: { top: 16, bottom: 16 },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          accessibilitySupport: 'auto',
          autoIndent: 'full',
          contextmenu: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          dragAndDrop: false,
          links: true,
          mouseWheelZoom: true,
          multiCursorModifier: 'alt',
          overviewRulerBorder: false,
          renderLineHighlight: 'line',
          renderWhitespace: 'selection',
          selectOnLineNumbers: true,
          smoothScrolling: true,
          tabCompletion: 'on',
        }}
      />
    </div>
  );
}
