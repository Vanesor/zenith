'use client';

import { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  Square, 
  Save, 
  Download, 
  Settings, 
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Info
} from 'lucide-react';

interface TestCase {
  input: string;
  output: string;
  isHidden?: boolean;
}

interface Question {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  language?: string;
  allowedLanguages?: string[];
  allowAnyLanguage?: boolean;
  starterCode?: string;
  testCases?: TestCase[];
}

interface EnhancedCodeEditorProps {
  question: Question;
  onSave: (code: string, language: string) => void;
  onRun: (code: string, language: string) => void;
  onSubmit: (code: string, language: string) => void;
  timeRemaining: number;
}

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript', ext: 'js' },
  { value: 'python', label: 'Python', ext: 'py' },
  { value: 'java', label: 'Java', ext: 'java' },
  { value: 'cpp', label: 'C++', ext: 'cpp' },
  { value: 'c', label: 'C', ext: 'c' },
  { value: 'typescript', label: 'TypeScript', ext: 'ts' },
  { value: 'go', label: 'Go', ext: 'go' },
  { value: 'rust', label: 'Rust', ext: 'rs' }
];

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg ${getToastStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-current hover:opacity-70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  question,
  onSave,
  onRun,
  onSubmit,
  timeRemaining
}) => {
  const [code, setCode] = useState(question.starterCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState(
    question.language || (question.allowedLanguages && question.allowedLanguages[0]) || 'javascript'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (code.trim()) {
        onSave(code, selectedLanguage);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [code, selectedLanguage, onSave]);

  // Fullscreen toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock test results
      const results = question.testCases?.filter(tc => !tc.isHidden).map((testCase, index) => ({
        index,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: testCase.output, // Mock - in real implementation, this would be actual execution result
        passed: true, // Mock - in real implementation, this would be comparison result
        executionTime: Math.random() * 100 + 50,
        memoryUsed: Math.random() * 1000 + 500
      })) || [];
      
      setTestResults(results);
      onRun(code, selectedLanguage);
      
      setToast({
        type: 'success',
        title: 'Code Executed',
        message: `${results.length} test cases completed`,
        onClose: () => setToast(null)
      });
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Execution Failed',
        message: 'An error occurred while running your code',
        onClose: () => setToast(null)
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCustomRun = async () => {
    setIsRunning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCustomOutput('Output from your custom input would appear here...');
      
      setToast({
        type: 'info',
        title: 'Custom Test Run',
        message: 'Custom input executed successfully',
        onClose: () => setToast(null)
      });
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Execution Failed',
        message: 'An error occurred while running custom input',
        onClose: () => setToast(null)
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      setToast({
        type: 'warning',
        title: 'Empty Code',
        message: 'Please write some code before submitting',
        onClose: () => setToast(null)
      });
      return;
    }

    onSubmit(code, selectedLanguage);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const availableLanguages = question.allowAnyLanguage 
    ? LANGUAGE_OPTIONS 
    : LANGUAGE_OPTIONS.filter(lang => 
        question.allowedLanguages?.includes(lang.value) || lang.value === question.language
      );

  return (
    <div ref={containerRef} className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {toast && <Toast {...toast} />}
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {question.title}
          </h1>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
            {question.points} points
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Statement Panel */}
        <div className="w-1/2 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Problem Statement</h2>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }} />
            </div>

            {/* Test Cases */}
            {question.testCases && question.testCases.some(tc => !tc.isHidden) && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Sample Test Cases</h3>
                {question.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                  <div key={index} className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</h4>
                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</h4>
                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                          {testCase.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="w-1/2 flex flex-col">
          {/* Editor Toolbar */}
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
              >
                {availableLanguages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                {theme === 'vs-dark' ? '☀️' : '🌙'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSave(code, selectedLanguage)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
              
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-green-400 flex items-center"
              >
                {isRunning ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isRunning ? 'Running...' : 'Run'}
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={selectedLanguage}
              value={code}
              onChange={(value: string | undefined) => setCode(value || '')}
              onMount={(editor: any) => {
                editorRef.current = editor;
              }}
              theme={theme}
              options={{
                fontSize,
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true }
              }}
            />
          </div>

          {/* Bottom Panel - Test Results / Custom Input */}
          <div className="h-64 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex h-full">
              {/* Test Results */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Test Results</h3>
                </div>
                <div className="p-3 overflow-auto h-full">
                  {testResults.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Run your code to see test results</p>
                  ) : (
                    <div className="space-y-2">
                      {testResults.map((result, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          result.passed 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Test Case {index + 1}</span>
                            <span className={result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {result.passed ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Time: {result.executionTime?.toFixed(2)}ms | Memory: {result.memoryUsed?.toFixed(0)}KB
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Input */}
              <div className="w-1/2">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Custom Input</h3>
                  <button
                    onClick={handleCustomRun}
                    disabled={isRunning}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    Run
                  </button>
                </div>
                <div className="h-full p-3 flex flex-col">
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter your custom input here..."
                    className="flex-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  {customOutput && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</h4>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
                        {customOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
