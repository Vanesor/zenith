'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Save, Maximize, AlertTriangle, Clock, Settings, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  question: {
    id: string;
    title: string;
    description: string;
    language?: string;
    allowedLanguages?: string[];
    allowAnyLanguage?: boolean;
    starterCode?: string;
    testCases?: Array<{ input: string; output: string; isHidden?: boolean }>;
  };
  onSave: (code: string, language: string) => void;
  onRun: (code: string, language: string) => void;
  onSubmit: (code: string, language: string) => void;
  timeRemaining: number;
}

const SUPPORTED_LANGUAGES = {
  python: { name: 'Python', extension: 'py', defaultCode: '# Write your Python code here\n\ndef solution():\n    pass\n\n# Test your solution\nprint(solution())' },
  java: { name: 'Java', extension: 'java', defaultCode: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your Java code here\n        \n    }\n}' },
  javascript: { name: 'JavaScript', extension: 'js', defaultCode: '// Write your JavaScript code here\n\nfunction solution() {\n    // Your code here\n}\n\nconsole.log(solution());' },
  typescript: { name: 'TypeScript', extension: 'ts', defaultCode: '// Write your TypeScript code here\n\nfunction solution(): any {\n    // Your code here\n}\n\nconsole.log(solution());' },
  c: { name: 'C', extension: 'c', defaultCode: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    \n    return 0;\n}' },
  cpp: { name: 'C++', extension: 'cpp', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    \n    return 0;\n}' },
  csharp: { name: 'C#', extension: 'cs', defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your C# code here\n        \n    }\n}' },
  go: { name: 'Go', extension: 'go', defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go code here\n    \n}' },
  rust: { name: 'Rust', extension: 'rs', defaultCode: 'fn main() {\n    // Write your Rust code here\n    \n}' },
  php: { name: 'PHP', extension: 'php', defaultCode: '<?php\n// Write your PHP code here\n\n?>' }
};

export function CodeEditor({ question, onSave, onRun, onSubmit, timeRemaining }: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize language and code
  useEffect(() => {
    if (question.language) {
      // Fixed language
      setSelectedLanguage(question.language);
      setCode(question.starterCode || SUPPORTED_LANGUAGES[question.language as keyof typeof SUPPORTED_LANGUAGES]?.defaultCode || '');
    } else if (question.allowedLanguages && question.allowedLanguages.length > 0) {
      // Multiple allowed languages - default to first one
      setSelectedLanguage(question.allowedLanguages[0]);
      setCode(question.starterCode || SUPPORTED_LANGUAGES[question.allowedLanguages[0] as keyof typeof SUPPORTED_LANGUAGES]?.defaultCode || '');
    } else if (question.allowAnyLanguage) {
      // Any language - default to Python
      setSelectedLanguage('python');
      setCode(question.starterCode || SUPPORTED_LANGUAGES.python.defaultCode);
    }
  }, [question]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (code.trim()) {
      onSave(code, selectedLanguage);
      setLastSaved(new Date());
    }
  }, [code, selectedLanguage, onSave]);

  // Set up auto-save
  useEffect(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    autoSaveRef.current = setTimeout(autoSave, 30000); // Auto-save every 30 seconds
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [code, autoSave]);

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    if (!code.trim() || code === SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES]?.defaultCode) {
      setCode(question.starterCode || SUPPORTED_LANGUAGES[newLanguage as keyof typeof SUPPORTED_LANGUAGES]?.defaultCode || '');
    }
  };

  // Handle code execution
  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setError('');
    
    try {
      // Simulate code execution - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock output
      setOutput('Code executed successfully!\nOutput: Hello, World!');
      onRun(code, selectedLanguage);
    } catch (err) {
      setError('Execution failed: ' + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle manual save
  const handleSave = () => {
    autoSave();
  };

  // Handle submission
  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your solution? This action cannot be undone.')) {
      onSubmit(code, selectedLanguage);
    }
  };

  // Reset code to starter code
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your code? All changes will be lost.')) {
      setCode(question.starterCode || SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES]?.defaultCode || '');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get available languages
  const getAvailableLanguages = () => {
    if (question.language) {
      return [question.language];
    } else if (question.allowedLanguages && question.allowedLanguages.length > 0) {
      return question.allowedLanguages;
    } else if (question.allowAnyLanguage) {
      return Object.keys(SUPPORTED_LANGUAGES);
    }
    return ['python'];
  };

  const availableLanguages = getAvailableLanguages();

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full'} bg-white dark:bg-gray-900 flex flex-col h-full min-h-[600px]`}>
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            
            {/* Language Selector */}
            {availableLanguages.length > 1 && (
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>
                    {SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]?.name || lang}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Time Remaining */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeRemaining)}
            </div>

            {/* Last Saved */}
            {lastSaved && (
              <div className="text-xs text-green-600 dark:text-green-400">
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Font Size:</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
                >
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Theme:</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full h-full p-4 resize-none focus:outline-none font-mono ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-gray-100' 
                  : 'bg-white text-gray-900'
              }`}
              style={{ fontSize: `${fontSize}px` }}
              placeholder="Start coding..."
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded font-medium"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>

              <button
                onClick={handleSubmit}
                className="flex items-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                Submit Solution
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Output</h4>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            {isRunning && (
              <div className="text-blue-600 dark:text-blue-400">
                Executing code...
              </div>
            )}
            
            {output && (
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {output}
              </pre>
            )}
            
            {error && (
              <div className="text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {!isRunning && !output && !error && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Click "Run Code" to see output here
              </div>
            )}
          </div>

          {/* Test Cases */}
          {question.testCases && question.testCases.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Cases</h5>
              <div className="space-y-2">
                {question.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                  <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <div><strong>Input:</strong> {testCase.input}</div>
                    <div><strong>Expected:</strong> {testCase.output}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
