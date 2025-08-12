'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  ZoomOut
} from 'lucide-react';
import { PlaygroundCodeEditor } from '@/components/playground/PlaygroundCodeEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/contexts/ToastContext';

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
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'python',
    name: 'Python',
    version: '3.9',
    extension: 'py',
    template: `# Welcome to Zenith Code Playground!
# Write your Python code here

def main():
    print("Hello, World!")
    
    # Your code here
    numbers = [1, 2, 3, 4, 5]
    squared = [x**2 for x in numbers]
    print(f"Squared numbers: {squared}")

if __name__ == "__main__":
    main()`,
    icon: '🐍'
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js 16',
    extension: 'js',
    template: `// Welcome to Zenith Code Playground!
// Write your JavaScript code here

console.log("Hello, World!");

// Your code here
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x * x);
console.log(\`Squared numbers: \${squared}\`);

// Example async function
async function example() {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log("Async operation completed!");
            resolve("Done");
        }, 1000);
    });
}

example().then(result => console.log(result));`,
    icon: '🟨'
  },
  {
    id: 'java',
    name: 'Java',
    version: '11',
    extension: 'java',
    template: `// Welcome to Zenith Code Playground!
// Write your Java code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Your code here
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Squared numbers: ");
        
        for (int i = 0; i < numbers.length; i++) {
            System.out.print(numbers[i] * numbers[i]);
            if (i < numbers.length - 1) System.out.print(", ");
        }
        System.out.println();
    }
}`,
    icon: '☕'
  },
  {
    id: 'cpp',
    name: 'C++',
    version: '17',
    extension: 'cpp',
    template: `// Welcome to Zenith Code Playground!
// Write your C++ code here

#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::cout << "Hello, World!" << std::endl;
    
    // Your code here
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::vector<int> squared;
    
    std::transform(numbers.begin(), numbers.end(), 
                   std::back_inserter(squared),
                   [](int x) { return x * x; });
    
    std::cout << "Squared numbers: ";
    for (size_t i = 0; i < squared.size(); ++i) {
        std::cout << squared[i];
        if (i < squared.size() - 1) std::cout << ", ";
    }
    std::cout << std::endl;
    
    return 0;
}`,
    icon: '⚙️'
  },
  {
    id: 'c',
    name: 'C',
    version: 'GCC 9.4',
    extension: 'c',
    template: `// Welcome to Zenith Code Playground!
// Write your C code here

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    // Your code here
    int numbers[] = {1, 2, 3, 4, 5};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    
    printf("Squared numbers: ");
    for (int i = 0; i < size; i++) {
        printf("%d", numbers[i] * numbers[i]);
        if (i < size - 1) printf(", ");
    }
    printf("\\n");
    
    return 0;
}`,
    icon: '🔧'
  }
];

export default function PlaygroundPage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated } = useAuthGuard({ 
    redirectReason: "Please sign in to use the interactive code playground",
    redirectOnClose: false, // Keep user on playground page
    requireAuth: true // Show modal initially for unauthenticated users
  });
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].template);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [editorZoom, setEditorZoom] = useState(14); // Font size for zoom
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Update code template when language changes
  useEffect(() => {
    setCode(selectedLanguage.template);
    setExecutionResult(null);
  }, [selectedLanguage]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [executionResult]);

  const executeCode = async () => {
    // Check authentication first
    if (!user) {
      openAuthModal("Please sign in to execute code in the playground", false); // Don't redirect, keep on playground
      showToast({
        title: 'Authentication Required',
        message: 'Please log in to execute code in the playground.',
        type: 'warning'
      });
      return;
    }

    if (!code.trim()) {
      showToast({
        title: 'No Code',
        message: 'Please write some code before executing.',
        type: 'warning'
      });
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage.id,
          code: code,
          input: '', // No input for playground
        }),
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const executionResult: ExecutionResult = {
        output: result.output || '',
        error: result.error || '',
        executionTime: executionTime,
        memoryUsed: result.memoryUsed || 0,
        status: result.error ? 'error' : 'success'
      };

      setExecutionResult(executionResult);
      setExecutionHistory(prev => [executionResult, ...prev.slice(0, 9)]); // Keep last 10 executions

      if (result.error) {
        showToast({
          title: 'Execution Error',
          message: 'Your code has some errors. Check the output panel.',
          type: 'error'
        });
      } else {
        showToast({
          title: 'Code Executed Successfully',
          message: `Execution completed in ${executionTime}ms`,
          type: 'success'
        });
      }

    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({
        output: '',
        error: `Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      });
      
      showToast({
        title: 'Execution Failed',
        message: 'Failed to execute your code. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
  };

  // Copy code to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast({
        title: 'Code Copied',
        message: 'Code has been copied to clipboard',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Copy Failed',
        message: 'Failed to copy code to clipboard',
        type: 'error'
      });
    }
  };

  // Zoom in editor
  const zoomIn = () => {
    setEditorZoom(prev => Math.min(prev + 2, 24));
  };

  // Zoom out editor
  const zoomOut = () => {
    setEditorZoom(prev => Math.max(prev - 2, 10));
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground.${selectedLanguage.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast({
      title: 'Code Downloaded',
      message: `File saved as playground.${selectedLanguage.extension}`,
      type: 'success'
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-zenith-main via-zenith-section to-zenith-main transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50' : 'pt-16'
    }`}>
      {/* Header */}
      <div className="bg-zenith-card/90 backdrop-blur-md border-b border-zenith-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code2 className="w-6 h-6 text-zenith-primary" />
                <h1 className="text-xl font-bold text-zenith-primary">Code Playground</h1>
              </div>
              <div className="text-sm text-zenith-muted">
                {user?.name ? `Welcome back, ${user.name}!` : 'Practice coding online'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadCode}
                className="p-2 text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover rounded-lg transition-all"
                title="Download code"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={copyCode}
                className="p-2 text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover rounded-lg transition-all"
                title="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={zoomIn}
                className="p-2 text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover rounded-lg transition-all"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover rounded-lg transition-all"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover rounded-lg transition-all"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Left Panel - Code Editor */}
          <div className="lg:col-span-2 flex flex-col">
            
            {/* Language Selector & Run Button */}
            <div className="bg-zenith-card rounded-t-xl border border-zenith-border border-b-0 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-zenith-muted" />
                  <select
                    value={selectedLanguage.id}
                    onChange={(e) => {
                      const lang = SUPPORTED_LANGUAGES.find(l => l.id === e.target.value);
                      if (lang) handleLanguageChange(lang);
                    }}
                    className="bg-zenith-section border border-zenith-border rounded-lg px-3 py-2 text-zenith-primary focus:outline-none focus:ring-2 focus:ring-zenith-primary"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.icon} {lang.name} ({lang.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={executeCode}
                disabled={isExecuting}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
                  isExecuting
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-200'
                }`}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 bg-zenith-card rounded-b-xl border border-zenith-border border-t-0">
              <PlaygroundCodeEditor
                value={code}
                onChange={setCode}
                language={selectedLanguage.id === 'cpp' ? 'cpp' : selectedLanguage.id}
                theme="vs-dark"
                readOnly={false}
                showLineNumbers={true}
                className="h-full rounded-b-xl"
              />
            </div>
          </div>

          {/* Right Panel - Output & Info */}
          <div className="flex flex-col space-y-6">
            
            {/* Execution Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zenith-card rounded-xl border border-zenith-border p-4"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Terminal className="w-5 h-5 text-zenith-primary" />
                <h3 className="font-semibold text-zenith-primary">Execution Info</h3>
              </div>
              
              {executionResult ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {executionResult.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      executionResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {executionResult.status === 'success' ? 'Success' : 'Error'}
                    </span>
                  </div>
                  
                  {executionResult.executionTime && (
                    <div className="text-sm text-zenith-muted">
                      <span className="font-medium">Execution Time:</span> {executionResult.executionTime}ms
                    </div>
                  )}
                  
                  {executionResult.memoryUsed && (
                    <div className="text-sm text-zenith-muted">
                      <span className="font-medium">Memory Used:</span> {executionResult.memoryUsed}KB
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-zenith-muted">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Ready to execute</span>
                </div>
              )}
            </motion.div>

            {/* Output Panel */}
            <div className="flex-1 bg-zenith-card rounded-xl border border-zenith-border flex flex-col">
              <div className="p-4 border-b border-zenith-border">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-zenith-primary" />
                  <h3 className="font-semibold text-zenith-primary">Output</h3>
                </div>
              </div>
              
              <div 
                ref={outputRef}
                className="flex-1 p-4 font-mono text-sm overflow-auto max-h-96"
              >
                {executionResult ? (
                  <div className="space-y-2">
                    {executionResult.output && (
                      <div className="text-zenith-primary whitespace-pre-wrap">
                        {executionResult.output}
                      </div>
                    )}
                    {executionResult.error && (
                      <div className="text-red-500 whitespace-pre-wrap">
                        <div className="font-semibold mb-1">Error:</div>
                        {executionResult.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zenith-muted italic">
                    Output will appear here after running your code...
                  </div>
                )}
              </div>
            </div>

            {/* Language Info Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-zenith-card to-zenith-section rounded-xl border border-zenith-border p-4"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{selectedLanguage.icon}</div>
                <h4 className="font-semibold text-zenith-primary">{selectedLanguage.name}</h4>
                <p className="text-sm text-zenith-muted">{selectedLanguage.version}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
