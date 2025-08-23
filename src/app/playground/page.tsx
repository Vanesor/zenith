'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Settings, 
  Download, 
  Copy, 
  Code2, 
  Terminal,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Save,
  Upload,
  Trash2,
  RotateCcw,
  Sparkles,
  Monitor
} from 'lucide-react';
import { PlaygroundCodeEditor } from '@/components/playground/PlaygroundCodeEditor';
import { MonacoThemeSwitch } from '@/components/playground/MonacoThemeSwitch';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useToast } from '@/contexts/ToastContext';
import { AnimatedPlaygroundIcon } from '@/components/icons/AnimatedPlaygroundIcon';

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  status: 'success' | 'error' | 'timeout';
}

interface Language {
  id: string;
  name: string;
  version: string;
  extension: string;
  template: string;
  icon: string;
  color: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'python',
    name: 'Python',
    version: '3.9',
    extension: 'py',
    template: `# Welcome to Zenith Code Playground! 🚀
# Write your Python code here

def main():
    print("Hello, Zenith! 🌟")
    
    # Example: Working with lists and comprehensions
    numbers = [1, 2, 3, 4, 5]
    squared = [x**2 for x in numbers]
    print(f"Original: {numbers}")
    print(f"Squared: {squared}")

if __name__ == "__main__":
    main()`,
    icon: '🐍',
    color: 'from-green-500 to-blue-500'
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js 18',
    extension: 'js',
    template: `// Welcome to Zenith Code Playground! 🚀
// Write your JavaScript code here

console.log("Hello, Zenith! 🌟");

// Example: Modern JavaScript features
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x * x);

console.log("Original:", numbers);
console.log("Squared:", squared);`,
    icon: '🟨',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'java',
    name: 'Java',
    version: '17',
    extension: 'java',
    template: `// Welcome to Zenith Code Playground! 🚀
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Zenith! 🌟");
        
        // Example: Working with arrays
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Squared: ");
        
        for (int i = 0; i < numbers.length; i++) {
            System.out.print(numbers[i] * numbers[i]);
            if (i < numbers.length - 1) System.out.print(", ");
        }
        System.out.println();
    }
}`,
    icon: '☕',
    color: 'from-red-500 to-pink-500'
  }
];

function PlaygroundPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [code, setCode] = useState<string>(SUPPORTED_LANGUAGES[0].template);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [monacoTheme, setMonacoTheme] = useState<string>('vs-dark');
  
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCode(selectedLanguage.template);
  }, [selectedLanguage]);

  // Set loading to false after initial render
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const executeCode = async () => {
    if (!code.trim()) {
      showToast({ 
        title: 'Warning', 
        message: 'Please enter some code to execute', 
        type: 'warning' 
      });
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/playground/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage.id,
          code,
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.status === 'success') {
        showToast({ 
          title: 'Success', 
          message: 'Code executed successfully!', 
          type: 'success' 
        });
      } else {
        showToast({ 
          title: 'Error', 
          message: 'Execution failed', 
          type: 'error' 
        });
      }
    } catch (error) {
      setResult({
        output: '',
        error: 'Failed to execute code. Please try again.',
        status: 'error',
      });
      showToast({ 
        title: 'Error', 
        message: 'Failed to execute code', 
        type: 'error' 
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ 
      title: 'Copied', 
      message: 'Copied to clipboard!', 
      type: 'success' 
    });
  };

  const resetCode = () => {
    setCode(selectedLanguage.template);
    setResult(null);
    showToast({ 
      title: 'Reset', 
      message: 'Code reset to template', 
      type: 'info' 
    });
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-primary">Loading playground...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-main ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border-b border-custom p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <AnimatedPlaygroundIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Code Playground
                </h1>
                <p className="text-sm text-secondary">
                  Write, execute, and experiment with code
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={selectedLanguage.id}
                onChange={(e) => {
                  const lang = SUPPORTED_LANGUAGES.find(l => l.id === e.target.value);
                  if (lang) setSelectedLanguage(lang);
                }}
                className="appearance-none bg-main border border-custom rounded-lg px-4 py-2 pr-8 text-primary focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.name} {lang.version}
                  </option>
                ))}
              </select>
            </div>

            {/* Monaco Theme Switcher - Moved next to language selector */}
            <MonacoThemeSwitch 
              currentTheme={monacoTheme}
              onThemeChange={setMonacoTheme}
            />

            {/* Controls */}
            <div className="flex items-center space-x-1 bg-card rounded-lg p-1">
              <button
                onClick={decreaseFontSize}
                className="p-2 rounded hover:bg-zenith-background dark:hover:bg-gray-600 transition-colors"
                title="Decrease font size"
              >
                <ZoomOut className="w-4 h-4 text-zenith-secondary" />
              </button>
              <span className="text-xs text-zenith-muted px-2">{fontSize}px</span>
              <button
                onClick={increaseFontSize}
                className="p-2 rounded hover:bg-zenith-background dark:hover:bg-gray-600 transition-colors"
                title="Increase font size"
              >
                <ZoomIn className="w-4 h-4 text-zenith-secondary" />
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-zenith-section rounded-lg hover:bg-zenith-background bg-main transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-zenith-secondary" />
              ) : (
                <Maximize2 className="w-4 h-4 text-zenith-secondary" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Code Editor */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-card border-b border-custom p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedLanguage.name} Editor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetCode}
                className="p-1.5 rounded hover:bg-zenith-section dark:hover:bg-gray-700 transition-colors"
                title="Reset to template"
              >
                <RotateCcw className="w-4 h-4 text-zenith-secondary" />
              </button>
              <button
                onClick={() => copyToClipboard(code)}
                className="p-1.5 rounded hover:bg-zenith-section dark:hover:bg-gray-700 transition-colors"
                title="Copy code"
              >
                <Copy className="w-4 h-4 text-zenith-secondary" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <PlaygroundCodeEditor
              value={code}
              onChange={setCode}
              language={selectedLanguage.id}
              theme={monacoTheme}
              fontSize={fontSize}
              className="h-full"
            />
          </div>
        </motion.div>

        {/* Output Panel */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-96 bg-card border-l border-custom flex flex-col"
        >
          <div className="p-3 border-b border-custom dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Output
              </span>
            </div>
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isExecuting
                  ? 'bg-gray-200 dark:bg-gray-700 text-zenith-muted cursor-not-allowed'
                  : 'bg-gradient-to-r ' + selectedLanguage.color + ' text-primary hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto" ref={outputRef}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      result.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.status === 'success' ? 'Execution Successful' : 'Execution Failed'}
                    </span>
                  </div>

                  {/* Output */}
                  {result.output && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zenith-muted uppercase tracking-wide">
                          Output
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.output)}
                          className="p-1 rounded hover:bg-zenith-section dark:hover:bg-gray-700 transition-colors"
                        >
                          <Copy className="w-3 h-3 text-zenith-muted" />
                        </button>
                      </div>
                      <pre className="bg-zenith-background dark:bg-gray-900 p-3 rounded-lg text-sm text-primary dark:text-gray-300 font-mono whitespace-pre-wrap border border-custom dark:border-gray-600">
                        {result.output}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {result.error && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                          Error
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.error!)}
                          className="p-1 rounded hover:bg-zenith-section dark:hover:bg-gray-700 transition-colors"
                        >
                          <Copy className="w-3 h-3 text-zenith-muted" />
                        </button>
                      </div>
                      <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap border border-red-200 dark:border-red-800">
                        {result.error}
                      </pre>
                    </div>
                  )}

                  {/* Execution Info */}
                  {(result.executionTime || result.memoryUsed) && (
                    <div className="pt-2 border-t border-custom dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {result.executionTime && (
                          <div>
                            <span className="text-zenith-muted">Execution Time</span>
                            <div className="font-mono text-primary">
                              {result.executionTime}ms
                            </div>
                          </div>
                        )}
                        {result.memoryUsed && (
                          <div>
                            <span className="text-zenith-muted">Memory Used</span>
                            <div className="font-mono text-primary">
                              {result.memoryUsed}KB
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-zenith-section rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Ready to Code!
                    </h3>
                    <p className="text-sm text-zenith-muted mb-4">
                      Write your {selectedLanguage.name} code and click "Run Code" to see the output.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-zenith-muted">
                      <Monitor className="w-4 h-4" />
                      <span>{selectedLanguage.name} {selectedLanguage.version}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Protected Playground Page
export default function ProtectedPlaygroundPage() {
  return (
    <ProtectedRoute>
      <PlaygroundPage />
    </ProtectedRoute>
  );
}
