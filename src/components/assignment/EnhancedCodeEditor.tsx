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
import { useRouter } from 'next/navigation';

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
          <p className="text-sm mt-1">{message}</p>
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
  const router = useRouter();
  
  // Debug: Log question data to check test cases
  useEffect(() => {
    console.log('Question data:', question);
    console.log('Test cases:', question.testCases);
  }, [question]);
  
  const [code, setCode] = useState(question.starterCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState(
    question.language || (question.allowedLanguages && question.allowedLanguages[0]) || 'javascript'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customExpectedOutput, setCustomExpectedOutput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [customTestResult, setCustomTestResult] = useState<{passed: boolean, executionTime: number, hasExpectedOutput: boolean} | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'custom' | 'output'>('testcases');
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [isProctored, setIsProctored] = useState(false);
  const [focusLost, setFocusLost] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

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

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  // Fullscreen toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      
      // If user exits fullscreen during test, give warning
      if (testStarted && !document.fullscreenElement && isProctored) {
        handleProctorViolation('Exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [testStarted, isProctored]);

  // Proctoring - detect tab switches and focus loss
  useEffect(() => {
    if (!isProctored || !testStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLost(true);
        handleProctorViolation('Switched tabs or minimized window');
      } else {
        setFocusLost(false);
      }
    };

    const handleFocusOut = () => {
      if (testStarted) {
        setFocusLost(true);
        handleProctorViolation('Lost window focus');
      }
    };

    const handleFocusIn = () => {
      setFocusLost(false);
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        handleProctorViolation('Attempted to access developer tools');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusOut);
    window.addEventListener('focus', handleFocusIn);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusOut);
      window.removeEventListener('focus', handleFocusIn);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted, isProctored]);

  // Auto-enter fullscreen when test starts
  useEffect(() => {
    if (testStarted && isProctored && !document.fullscreenElement) {
      toggleFullscreen();
    }
  }, [testStarted, isProctored]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleProctorViolation = (violation: string) => {
    const newWarningCount = proctorWarnings + 1;
    setProctorWarnings(newWarningCount);

    if (newWarningCount === 1) {
      setToast({
        type: 'warning',
        title: 'Proctoring Warning',
        message: `${violation}. This is your first warning. Another violation will result in auto-submission.`,
        onClose: () => setToast(null)
      });
    } else if (newWarningCount >= 2) {
      setToast({
        type: 'error',
        title: 'Test Auto-Submitted',
        message: `Multiple proctoring violations detected. Your test has been auto-submitted and reported to authorities.`,
        onClose: () => setToast(null)
      });
      
      // Auto-submit after 3 seconds
      setTimeout(() => {
        onSubmit(code, selectedLanguage);
        router.push('/assignments');
      }, 3000);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setIsProctored(true);
    
    setToast({
      type: 'info',
      title: 'Proctored Test Started',
      message: 'Test is now being monitored. Do not switch tabs, exit fullscreen, or minimize the window.',
      onClose: () => setToast(null)
    });
  };

  const handleSubmit = () => {
    if (timeRemaining <= 0) {
      setToast({
        type: 'warning',
        title: 'Time Up!',
        message: 'Assignment auto-submitted due to time limit. Redirecting to assignments page...',
        onClose: () => setToast(null)
      });
      
      // Auto-submit and redirect after 2 seconds
      setTimeout(() => {
        onSubmit(code, selectedLanguage);
        router.push('/assignments');
      }, 2000);
    } else {
      onSubmit(code, selectedLanguage);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveBottomTab('testcases');
    try {
      const testCases = question.testCases?.filter(tc => !tc.isHidden).map(tc => ({
        input: tc.input,
        expectedOutput: tc.output
      })) || [];

      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          testCases
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      if (result.success) {
        // Enhanced response handling for detailed test results
        if (result.testResults && result.testResults.length > 0) {
          setTestResults(result.testResults);
          const passedCount = result.passedTests || result.testResults.filter((tr: any) => tr.passed).length;
          const totalCount = result.totalTests || result.testResults.length;
          
          setToast({
            type: passedCount === totalCount ? 'success' : passedCount === 0 ? 'error' : 'warning',
            title: 'Code Executed',
            message: `${passedCount}/${totalCount} test cases passed. Execution time: ${(result.executionTime || 0).toFixed(2)}ms`,
            onClose: () => setToast(null)
          });
        } else if (result.results) {
          // Fallback for older response format
          setTestResults(result.results);
          const passedCount = result.passedTests || result.results.filter((tr: any) => tr.passed).length;
          const totalCount = result.totalTests || result.results.length;
          
          setToast({
            type: passedCount === totalCount ? 'success' : passedCount === 0 ? 'error' : 'warning',
            title: 'Code Executed',
            message: `${passedCount}/${totalCount} test cases passed`,
            onClose: () => setToast(null)
          });
        } else {
          // No test cases, just output
          setTestResults([]);
          setToast({
            type: 'success',
            title: 'Code Executed',
            message: `Completed in ${(result.executionTime || 0).toFixed(2)}ms`,
            onClose: () => setToast(null)
          });
        }
        
        onRun(code, selectedLanguage);
      } else {
        // Compilation or runtime error
        setTestResults([]);
        setToast({
          type: 'error',
          title: result.error || 'Execution Failed',
          message: result.details || result.output || 'An error occurred while running your code',
          onClose: () => setToast(null)
        });
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setTestResults([]);
      setToast({
        type: 'error',
        title: 'Execution Failed',
        message: error instanceof Error ? error.message : 'An error occurred while running your code',
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
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          input: customInput
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      if (result.success) {
        const output = result.output || 'No output';
        const executionTime = result.executionTime || result.execution_time || 0;
        
        setCustomOutput(output);
        
        // Check if it matches expected output (only if expected output is provided)
        let passed = false;
        let hasExpectedOutput = customExpectedOutput.trim().length > 0;
        
        if (hasExpectedOutput) {
          passed = output.trim() === customExpectedOutput.trim();
        }
        
        setCustomTestResult({ 
          passed: hasExpectedOutput ? passed : true, 
          executionTime,
          hasExpectedOutput 
        });
        
        setToast({
          type: hasExpectedOutput ? (passed ? 'success' : 'warning') : 'info',
          title: 'Custom Test Run',
          message: hasExpectedOutput 
            ? (passed ? 'Output matches expected result!' : 'Output differs from expected result')
            : `Executed successfully in ${executionTime.toFixed(2)}ms`,
          onClose: () => setToast(null)
        });
      } else {
        const errorOutput = `Error: ${result.error}\n${result.details || result.output || ''}`;
        setCustomOutput(errorOutput);
        setCustomTestResult(null);
        setToast({
          type: 'error',
          title: result.error || 'Execution Failed',
          message: result.details || 'An error occurred while running custom input',
          onClose: () => setToast(null)
        });
      }
    } catch (error) {
      console.error('Custom execution error:', error);
      setCustomOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setCustomTestResult(null);
      setToast({
        type: 'error',
        title: 'Execution Failed',
        message: error instanceof Error ? error.message : 'An error occurred while running custom input',
        onClose: () => setToast(null)
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Get available languages based on question constraints
  const availableLanguages = question.allowAnyLanguage 
    ? LANGUAGE_OPTIONS 
    : question.allowedLanguages && question.allowedLanguages.length > 0
      ? LANGUAGE_OPTIONS.filter(lang => question.allowedLanguages?.includes(lang.value))
      : LANGUAGE_OPTIONS;

  return (
    <div ref={containerRef} className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {toast && <Toast {...toast} />}
      
      {/* Proctoring Warning Banner */}
      {focusLost && testStarted && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center max-w-md mx-4">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Focus Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please return to the test window. Your activity is being monitored.
            </p>
            <div className="text-sm text-red-600 dark:text-red-400">
              Warnings: {proctorWarnings}/2
            </div>
          </div>
        </div>
      )}

      {/* Start Test Button */}
      {!testStarted && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center max-w-lg mx-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start?
            </h2>
            <div className="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <p>This is a proctored coding test. Please note:</p>
              <ul className="text-left space-y-1 mt-3">
                <li>• The test will automatically enter fullscreen mode</li>
                <li>• Do not switch tabs or minimize the window</li>
                <li>• Do not exit fullscreen mode</li>
                <li>• Your activity is being monitored</li>
                <li>• 2 violations will result in auto-submission</li>
              </ul>
            </div>
            <button
              onClick={startTest}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Start Proctored Test
            </button>
          </div>
        </div>
      )}
      
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
            <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`}>
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
            {question.testCases && question.testCases.length > 0 && question.testCases.some(tc => !tc.isHidden) && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Sample Test Cases</h3>
                <div className="space-y-3">
                  {question.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Example {index + 1}
                        </span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Input</div>
                          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{testCase.input || 'No input'}</pre>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Output</div>
                          <div className="bg-gray-900 text-blue-400 p-3 rounded font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{testCase.output || 'No output specified'}</pre>
                          </div>
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
                <div>• Time Limit: 5 seconds per test case</div>
                <div>• Memory Limit: 128 MB</div>
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
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeBottomTab === 'testcases'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Test Results {testResults.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    testResults.every(r => r.passed) 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {testResults.filter(r => r.passed).length}/{testResults.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveBottomTab('custom')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeBottomTab === 'custom'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Custom Test
              </button>
              <button
                onClick={() => setActiveBottomTab('output')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeBottomTab === 'output'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Summary
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {/* Test Results Tab */}
              {activeBottomTab === 'testcases' && (
                <div className="p-4">
                  {testResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">No test results yet</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Click "Run" to execute your code against sample test cases
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Overall Results Summary */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Test Results</h3>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              testResults.every(r => r.passed) 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : testResults.some(r => r.passed)
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {testResults.filter(r => r.passed).length}/{testResults.length} Passed
                            </span>
                            <span className="text-sm text-gray-500">
                              Avg: {(testResults.reduce((acc, r) => acc + (r.executionTime || 0), 0) / testResults.length).toFixed(2)}ms
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              testResults.every(r => r.passed) 
                                ? 'bg-green-500' 
                                : testResults.some(r => r.passed) 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(testResults.filter(r => r.passed).length / testResults.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Individual Test Cases */}
                      <div className="space-y-3">
                        {testResults.map((result, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <div className={`px-4 py-3 flex items-center justify-between ${
                              result.passed 
                                ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  Test Case {index + 1}
                                </span>
                                {result.passed ? (
                                  <div className="flex items-center space-x-1 text-green-700 dark:text-green-300">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">PASSED</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-red-700 dark:text-red-300">
                                    <X className="w-4 h-4" />
                                    <span className="text-sm font-medium">FAILED</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {(result.executionTime || 0).toFixed(2)}ms
                                {result.memoryUsed && ` • ${result.memoryUsed}KB`}
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Input</div>
                                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono overflow-x-auto max-h-32">
                                    <pre className="whitespace-pre-wrap">{result.input || 'No input'}</pre>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Expected</div>
                                  <div className="bg-gray-900 text-blue-400 p-3 rounded text-sm font-mono overflow-x-auto max-h-32">
                                    <pre className="whitespace-pre-wrap">{result.expectedOutput || 'No expected output'}</pre>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Your Output</div>
                                  <div className={`p-3 rounded text-sm font-mono overflow-x-auto max-h-32 ${
                                    result.passed 
                                      ? 'bg-gray-900 text-green-400' 
                                      : 'bg-gray-900 text-red-400'
                                  }`}>
                                    <pre className="whitespace-pre-wrap">{result.actualOutput || 'No output'}</pre>
                                  </div>
                                </div>
                              </div>
                              
                              {result.error && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded">
                                  <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Error Details</div>
                                  <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap">{result.error}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Test Tab */}
              {activeBottomTab === 'custom' && (
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Test Case</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setCustomInput('');
                          setCustomExpectedOutput('');
                          setCustomOutput('');
                          setCustomTestResult(null);
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={handleCustomRun}
                        disabled={isRunning}
                        className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400 flex items-center transition-colors"
                      >
                        {isRunning ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {isRunning ? 'Running...' : 'Run Test'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Input Section */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input</label>
                        <button
                          onClick={() => setCustomInput('')}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter your test input here...&#10;Each line will be treated as a separate input line."
                        className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Expected Output Section */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Output (Optional)</label>
                        <button
                          onClick={() => setCustomExpectedOutput('')}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      <textarea
                        value={customExpectedOutput}
                        onChange={(e) => setCustomExpectedOutput(e.target.value)}
                        placeholder="Enter expected output to validate your solution...&#10;Leave empty for output-only testing."
                        className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {/* Output Section */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actual Output</label>
                        <div className="flex items-center space-x-2">
                          {customTestResult && customTestResult.hasExpectedOutput && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              customTestResult.passed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {customTestResult.passed ? '✓ Match' : '✗ Different'}
                            </span>
                          )}
                          {customTestResult && !customTestResult.hasExpectedOutput && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              ✓ Executed
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCustomOutput('');
                              setCustomTestResult(null);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className={`flex-1 w-full p-3 border rounded-lg text-sm font-mono overflow-auto ${
                        customOutput 
                          ? customTestResult?.passed 
                            ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                            : customTestResult?.passed === false
                            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                            : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
                          : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
                      }`}>
                        {customOutput ? (
                          <pre className="text-gray-900 dark:text-white whitespace-pre-wrap">{customOutput}</pre>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="mb-2">Output will appear here after running your code</div>
                            <div className="text-xs">
                              💡 Add expected output to validate your solution automatically
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Execution details */}
                      {customTestResult && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Executed in {customTestResult.executionTime.toFixed(2)}ms
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Tab */}
              {activeBottomTab === 'output' && (
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Execution Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete overview of your code execution results
                    </p>
                  </div>
                  
                  {testResults.length === 0 && !customTestResult ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Info className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">No execution results</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Run your code using "Run" button or test with custom input to see detailed execution results and performance metrics here.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Statistics */}
                      {testResults.length > 0 && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results Overview</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {testResults.filter(r => r.passed).length}
                              </div>
                              <div className="text-xs text-green-800 dark:text-green-300 font-medium">Tests Passed</div>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {testResults.filter(r => !r.passed).length}
                              </div>
                              <div className="text-xs text-red-800 dark:text-red-300 font-medium">Tests Failed</div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {(testResults.reduce((acc, r) => acc + (r.executionTime || 0), 0) / testResults.length).toFixed(1)}ms
                              </div>
                              <div className="text-xs text-blue-800 dark:text-blue-300 font-medium">Avg Execution</div>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {testResults.length > 0 && testResults[0].memoryUsed ? 
                                  `${Math.max(...testResults.map(r => r.memoryUsed || 0))}KB` : 'N/A'}
                              </div>
                              <div className="text-xs text-purple-800 dark:text-purple-300 font-medium">Peak Memory</div>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                {((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Success Rate</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Test Result */}
                      {customTestResult && (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Test Result</h4>
                          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-3">
                              {customTestResult.passed ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <X className="w-6 h-6 text-red-500" />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {customExpectedOutput.trim() 
                                    ? (customTestResult.passed ? 'Output matches expected result' : 'Output differs from expected')
                                    : 'Custom test executed successfully'
                                  }
                                </div>
                                <div className="text-sm text-gray-500">
                                  Execution time: {customTestResult.executionTime.toFixed(2)}ms
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              customTestResult.passed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : customExpectedOutput.trim()
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {customExpectedOutput.trim() 
                                ? (customTestResult.passed ? 'PASSED' : 'FAILED')
                                : 'EXECUTED'
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Information */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution Details</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Programming Language:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {availableLanguages.find(l => l.value === selectedLanguage)?.label}
                            </span>
                          </div>
                          
                          {testResults.length > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total test cases:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{testResults.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tests passed:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {testResults.filter(r => r.passed).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tests failed:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                  {testResults.filter(r => !r.passed).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total execution time:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {testResults.reduce((acc, r) => acc + (r.executionTime || 0), 0).toFixed(2)}ms
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Fastest execution:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {Math.min(...testResults.map(r => r.executionTime || 0)).toFixed(2)}ms
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Slowest execution:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {Math.max(...testResults.map(r => r.executionTime || 0)).toFixed(2)}ms
                                </span>
                              </div>
                              {testResults.some(r => r.memoryUsed) && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Memory usage range:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {Math.min(...testResults.map(r => r.memoryUsed || 0))}KB - {Math.max(...testResults.map(r => r.memoryUsed || 0))}KB
                                    </span>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                          
                          {customTestResult && (
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Custom test execution:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {customTestResult.executionTime.toFixed(2)}ms
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Overall status:</span>
                              <span className={`font-medium ${
                                testResults.length > 0 
                                  ? testResults.every(r => r.passed) 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {testResults.length > 0 
                                  ? testResults.every(r => r.passed) 
                                    ? '✅ All tests passed' 
                                    : '❌ Some tests failed'
                                  : customTestResult
                                    ? '🧪 Custom test completed'
                                    : '⏳ No tests run yet'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
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
