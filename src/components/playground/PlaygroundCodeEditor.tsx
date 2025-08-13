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
  fontSize?: number;
}

export function PlaygroundCodeEditor({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  readOnly = false,
  showLineNumbers = true,
  className = '',
  fontSize = 14
}: PlaygroundCodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Define custom themes
    monaco.editor.defineTheme('vs-dark-plus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorCursor.foreground': '#AEAFAD',
        'editor.lineHighlightBackground': '#2D2D2D',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41'
      }
    });

    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715E' },
        { token: 'keyword', foreground: 'F92672' },
        { token: 'string', foreground: 'E6DB74' },
        { token: 'number', foreground: 'AE81FF' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#F8F8F2',
        'editorCursor.foreground': '#F8F8F0',
        'editor.lineHighlightBackground': '#3E3D32',
        'editorLineNumber.foreground': '#90908A',
        'editor.selectionBackground': '#49483E'
      }
    });

    monaco.editor.defineTheme('github', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6F42C1' },
        { token: 'keyword', foreground: 'D73A49' },
        { token: 'string', foreground: '032F62' },
        { token: 'number', foreground: '005CC5' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#24292E',
        'editorCursor.foreground': '#24292E',
        'editor.lineHighlightBackground': '#F6F8FA',
        'editorLineNumber.foreground': '#1B1F23',
        'editor.selectionBackground': '#0366D625'
      }
    });

    monaco.editor.defineTheme('solarized-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '586E75' },
        { token: 'keyword', foreground: '859900' },
        { token: 'string', foreground: '2AA198' },
        { token: 'number', foreground: 'D33682' },
      ],
      colors: {
        'editor.background': '#002B36',
        'editor.foreground': '#839496',
        'editorCursor.foreground': '#839496',
        'editor.lineHighlightBackground': '#073642',
        'editorLineNumber.foreground': '#586E75',
        'editor.selectionBackground': '#274642'
      }
    });

    monaco.editor.defineTheme('solarized-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '93A1A1' },
        { token: 'keyword', foreground: '859900' },
        { token: 'string', foreground: '2AA198' },
        { token: 'number', foreground: 'D33682' },
      ],
      colors: {
        'editor.background': '#FDF6E3',
        'editor.foreground': '#657B83',
        'editorCursor.foreground': '#657B83',
        'editor.lineHighlightBackground': '#EEE8D5',
        'editorLineNumber.foreground': '#93A1A1',
        'editor.selectionBackground': '#EEE8D5'
      }
    });
    
    // Configure editor options
    editor.updateOptions({
      fontSize: fontSize,
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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme);
    }
  }, [theme]);

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
