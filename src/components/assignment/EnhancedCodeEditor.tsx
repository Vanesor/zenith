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
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'custom' | 'output'>('testcases');

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
    setActiveBottomTab('output');
    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock test results
      const results = question.testCases?.filter(tc => !tc.isHidden).map((testCase, index) => ({
        index,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: testCase.output, // Mock - in real implementation, this would be actual execution result
        passed: Math.random() > 0.3, // Mock some failures for demo
        executionTime: Math.random() * 100 + 50,
        memoryUsed: Math.random() * 1000 + 500
      })) || [];
      
      setTestResults(results);
      onRun(code, selectedLanguage);
      
      const passedCount = results.filter(r => r.passed).length;
      setToast({
        type: passedCount === results.length ? 'success' : 'warning',
        title: 'Code Executed',
        message: `${passedCount}/${results.length} test cases passed`,
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
    setActiveBottomTab('custom');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Mock custom output based on input
      const mockOutputs = [
        'Hello World!',
        '42',
        'Error: Invalid input',
        'Processing complete',
        customInput ? `Processed: ${customInput}` : 'No input provided'
      ];
      setCustomOutput(mockOutputs[Math.floor(Math.random() * mockOutputs.length)]);
      
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

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Statement */}
        <div className="w-2/5 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Problem Statement</h2>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Problem Description */}
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }} />
            </div>

            {/* Sample Test Cases */}
            {question.testCases && question.testCases.some(tc => !tc.isHidden) && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Sample Test Cases</h3>
                <div className="space-y-4">
                  {question.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sample {index + 1}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Input:</div>
                          <pre className="text-sm bg-white dark:bg-gray-800 p-3 rounded border font-mono overflow-x-auto">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Output:</div>
                          <pre className="text-sm bg-white dark:bg-gray-800 p-3 rounded border font-mono overflow-x-auto">
                            {testCase.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Constraints</h4>
              <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <div>• Time Limit: 2 seconds</div>
                <div>• Memory Limit: 256 MB</div>
                <div>• Input/Output: Standard I/O</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor and Output */}
        <div className="w-3/5 flex flex-col">
          {/* Code Editor Section */}
          <div className="h-3/5 flex flex-col">
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

            {/* Code Editor */}
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
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  tabCompletion: 'on'
                }}
              />
            </div>
          </div>

          {/* Bottom Panel - Output Section */}
          <div className="h-2/5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setActiveBottomTab('testcases')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeBottomTab === 'testcases'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setActiveBottomTab('custom')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeBottomTab === 'custom'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Custom Input
              </button>
              <button
                onClick={() => setActiveBottomTab('output')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeBottomTab === 'output'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Output {testResults.length > 0 && `(${testResults.filter(r => r.passed).length}/${testResults.length})`}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {/* Test Cases Tab */}
              {activeBottomTab === 'testcases' && (
                <div className="p-4">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">No test results yet</div>
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        Click "Run" to execute your code against sample test cases
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                          result.passed 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Test Case {index + 1}</span>
                            <div className="flex items-center space-x-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                result.passed 
                                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                              }`}>
                                {result.passed ? 'PASSED' : 'FAILED'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {result.executionTime?.toFixed(2)}ms
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                                {result.input}
                              </pre>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Expected:</div>
                              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                                {result.expectedOutput}
                              </pre>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Your Output:</div>
                              <pre className={`p-2 rounded font-mono overflow-x-auto ${
                                result.passed 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {result.actualOutput}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Input Tab */}
              {activeBottomTab === 'custom' && (
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Custom Input</h3>
                    <button
                      onClick={handleCustomRun}
                      disabled={isRunning}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
                    >
                      {isRunning ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                      Run
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Input:</label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter your custom input here..."
                        className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none font-mono"
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Output:</label>
                      <div className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-50 dark:bg-gray-800 font-mono overflow-auto">
                        {customOutput ? (
                          <pre className="text-gray-900 dark:text-white whitespace-pre-wrap">{customOutput}</pre>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400">
                            Output will appear here after running your code
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Tab */}
              {activeBottomTab === 'output' && (
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Execution Summary</h3>
                  </div>
                  
                  {testResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">No execution results</div>
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        Run your code to see detailed execution results
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {testResults.filter(r => r.passed).length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Passed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {testResults.filter(r => !r.passed).length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {(testResults.reduce((acc, r) => acc + (r.executionTime || 0), 0) / testResults.length).toFixed(2)}ms
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Time</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {(testResults.reduce((acc, r) => acc + (r.memoryUsed || 0), 0) / testResults.length).toFixed(0)}KB
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Memory</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>• Total test cases executed: {testResults.length}</div>
                        <div>• Success rate: {((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(1)}%</div>
                        <div>• Language: {availableLanguages.find(l => l.value === selectedLanguage)?.label}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
