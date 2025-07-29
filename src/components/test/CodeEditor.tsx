'use client';

import { useState, useEffect } from 'react';
import { Play, RotateCcw, Eye, EyeOff, CheckCircle, XCircle, Clock, Code } from 'lucide-react';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface CodeEditorProps {
  language: string;
  starterCode: string;
  testCases: TestCase[];
  onSubmit: (code: string, results: TestResult[]) => void;
  timeLimit?: number;
  className?: string;
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  error?: string;
  executionTime: number;
}

export function CodeEditor({ 
  language, 
  starterCode, 
  testCases, 
  onSubmit, 
  timeLimit,
  className = '' 
}: CodeEditorProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'testcases'>('code');
  const [customInput, setCustomInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const runCode = async (withTestCases = false) => {
    setIsRunning(true);
    setOutput('');
    
    try {
      // Simulate code execution (in real implementation, this would call a backend service)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (withTestCases) {
        const results: TestResult[] = [];
        
        for (const testCase of testCases) {
          // Simulate test case execution
          const startTime = Date.now();
          const mockResult = await simulateCodeExecution(code, testCase.input, testCase.expectedOutput);
          const executionTime = Date.now() - startTime;
          
          results.push({
            testCaseId: testCase.id,
            passed: mockResult.passed,
            actualOutput: mockResult.output,
            error: mockResult.error,
            executionTime
          });
        }
        
        setTestResults(results);
        setActiveTab('testcases');
      } else {
        // Run with custom input
        const result = await simulateCodeExecution(code, customInput);
        setOutput(result.output);
        setActiveTab('output');
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setActiveTab('output');
    } finally {
      setIsRunning(false);
    }
  };

  const simulateCodeExecution = async (code: string, input: string, expectedOutput?: string) => {
    // This is a mock implementation. In real scenario, this would send code to a secure execution environment
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Simulate different outcomes
    if (code.includes('error') || code.includes('throw')) {
      return {
        passed: false,
        output: '',
        error: 'Runtime Error: Division by zero'
      };
    }
    
    if (code.includes('timeout') || code.includes('while True')) {
      return {
        passed: false,
        output: '',
        error: 'Time Limit Exceeded'
      };
    }
    
    // Mock output generation
    const mockOutput = generateMockOutput(code, input);
    
    return {
      passed: expectedOutput ? mockOutput.trim() === expectedOutput.trim() : true,
      output: mockOutput,
      error: undefined
    };
  };

  const generateMockOutput = (code: string, input: string) => {
    // Simple mock output generation based on code patterns
    if (code.includes('print') && code.includes('input')) {
      return input.split('\n').map(line => `Output: ${line}`).join('\n');
    }
    if (code.includes('sum') || code.includes('+')) {
      const numbers = input.split(' ').map(n => parseInt(n)).filter(n => !isNaN(n));
      return numbers.reduce((a, b) => a + b, 0).toString();
    }
    return 'Sample output based on input';
  };

  const handleSubmit = () => {
    onSubmit(code, testResults);
  };

  const resetCode = () => {
    setCode(starterCode);
    setOutput('');
    setTestResults([]);
    setActiveTab('code');
  };

  const getLanguageConfig = () => {
    const configs = {
      python: { extension: 'py', comment: '#', example: 'print("Hello, World!")' },
      java: { extension: 'java', comment: '//', example: 'System.out.println("Hello, World!");' },
      javascript: { extension: 'js', comment: '//', example: 'console.log("Hello, World!");' },
      c: { extension: 'c', comment: '//', example: 'printf("Hello, World!");' },
      cpp: { extension: 'cpp', comment: '//', example: 'cout << "Hello, World!";' }
    };
    return configs[language as keyof typeof configs] || configs.python;
  };

  const languageConfig = getLanguageConfig();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Code Editor ({language})
            </h3>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium">
              .{languageConfig.extension}
            </span>
          </div>
          
          {timeLeft !== null && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' : 
              timeLeft < 900 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
              'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Code Editor
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'output'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Output
        </button>
        <button
          onClick={() => setActiveTab('testcases')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'testcases'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Test Cases ({testResults.filter(r => r.passed).length}/{testCases.length})
        </button>
      </div>

      {/* Content */}
      <div className="h-96">
        {activeTab === 'code' && (
          <div className="h-full flex flex-col">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none resize-none focus:outline-none focus:ring-0"
              placeholder={`// Write your ${language} code here...\n${languageConfig.example}`}
              spellCheck={false}
            />
            <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Input (for testing)
                  </label>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    placeholder="Enter test input..."
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => runCode(false)}
                    disabled={isRunning}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isRunning ? 'Running...' : 'Run'}
                  </button>
                  <button
                    onClick={resetCode}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full p-4">
            <div className="h-full bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-auto">
              {output || 'No output yet. Run your code to see results.'}
            </div>
          </div>
        )}

        {activeTab === 'testcases' && (
          <div className="h-full overflow-auto p-4">
            {testCases.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No test cases available
              </div>
            ) : (
              <div className="space-y-4">
                {testCases.map((testCase, index) => {
                  const result = testResults.find(r => r.testCaseId === testCase.id);
                  return (
                    <div
                      key={testCase.id}
                      className={`border rounded-lg p-4 ${
                        result?.passed
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                          : result && !result.passed
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          Test Case {index + 1}
                          {testCase.isHidden && (
                            <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded">
                              Hidden
                            </span>
                          )}
                        </h4>
                        {result && (
                          <div className="flex items-center">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!testCase.isHidden && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</h5>
                            <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                              {testCase.input}
                            </pre>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</h5>
                            <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                              {testCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {result && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Your Output:</h5>
                              <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                                {result.actualOutput || 'No output'}
                              </pre>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status:</h5>
                              <div className={`p-2 rounded text-xs ${
                                result.passed 
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                              }`}>
                                {result.passed ? 'Passed' : result.error || 'Wrong Answer'}
                                <br />
                                <span className="text-gray-500">
                                  Executed in {result.executionTime}ms
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {testResults.length > 0 && (
              <span>
                {testResults.filter(r => r.passed).length} of {testCases.length} test cases passed
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => runCode(true)}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Testing...' : 'Run Tests'}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Submit Solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
