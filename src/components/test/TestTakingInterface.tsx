'use client';

import { useState, useEffect } from 'react';
import { Clock, Calculator as CalcIcon, Flag, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff, BookOpen } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { Calculator } from './Calculator';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  timeLimit?: number;
  language?: string;
  starterCode?: string;
  testCases?: Array<{ id: string; input: string; expectedOutput: string; isHidden?: boolean }>;
}

interface TestTakingInterfaceProps {
  assignment: {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    allowNavigation: boolean;
    isProctored: boolean;
    shuffleQuestions: boolean;
    questions: Question[];
  };
  onSubmit: (answers: Record<string, any>) => void;
  allowCalculator?: boolean;
}

export function TestTakingInterface({ assignment, onSubmit, allowCalculator = true }: TestTakingInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(assignment.timeLimit * 60); // Convert to seconds
  const [showCalculator, setShowCalculator] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const currentQuestion = assignment.questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Proctoring effects
  useEffect(() => {
    if (!assignment.isProctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('Tab switch detected');
      }
    };

    const handleBlur = () => {
      addWarning('Window lost focus');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        e.preventDefault();
        addWarning('Copy/paste attempt detected');
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        addWarning('Developer tools access attempt');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [assignment.isProctored]);

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const addWarning = (warning: string) => {
    setWarnings(prev => [...prev, `${new Date().toLocaleTimeString()}: ${warning}`]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const navigateToQuestion = (index: number) => {
    if (!assignment.allowNavigation && index > currentQuestionIndex) {
      addWarning('Forward navigation attempted (not allowed)');
      return;
    }
    setCurrentQuestionIndex(index);
    setShowQuestionNav(false);
  };

  const handleNext = () => {
    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (assignment.allowNavigation && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAutoSubmit = () => {
    onSubmit(answers);
  };

  const handleManualSubmit = () => {
    if (confirm('Are you sure you want to submit your test? This action cannot be undone.')) {
      onSubmit(answers);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const getQuestionStatus = (index: number) => {
    const question = assignment.questions[index];
    const hasAnswer = answers[question.id] !== undefined && answers[question.id] !== '' && answers[question.id] !== null;
    const isFlagged = flaggedQuestions.has(question.id);
    const isCurrent = index === currentQuestionIndex;

    if (isCurrent) return 'current';
    if (isFlagged) return 'flagged';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-blue-600 text-white';
      case 'answered': return 'bg-green-600 text-white';
      case 'flagged': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
    }
  };

  const renderQuestion = () => {
    const question = currentQuestion;
    const answer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }}
            />
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answer === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index}
                    checked={answer === index}
                    onChange={() => handleAnswerChange(question.id, index)}
                    className="mt-1 mr-3 text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: option.replace(/\n/g, '<br>') }} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }}
            />
            <div className="flex space-x-6">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                answer === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer === true}
                  onChange={() => handleAnswerChange(question.id, true)}
                  className="mr-3 text-green-600"
                />
                <span className="font-semibold text-green-600 dark:text-green-400">True</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                answer === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer === false}
                  onChange={() => handleAnswerChange(question.id, false)}
                  className="mr-3 text-red-600"
                />
                <span className="font-semibold text-red-600 dark:text-red-400">False</span>
              </label>
            </div>
          </div>
        );

      case 'short-answer':
        return (
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }}
            />
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder="Enter your answer here..."
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }}
            />
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Word count: {(answer || '').split(/\s+/).filter((word: string) => word.length > 0).length}</span>
                  <span>Characters: {(answer || '').length}</span>
                </div>
              </div>
              <textarea
                value={answer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full p-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-none resize-none focus:outline-none"
                rows={12}
                placeholder="Write your essay here. Take your time to organize your thoughts and provide a comprehensive answer..."
              />
            </div>
          </div>
        );

      case 'coding':
        return (
          <div className="space-y-4">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br>') }}
            />
            <CodeEditor
              language={question.language || 'python'}
              starterCode={question.starterCode || ''}
              testCases={question.testCases || []}
              onSubmit={(code, results) => {
                handleAnswerChange(question.id, { code, results });
              }}
              timeLimit={question.timeLimit}
            />
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {assignment.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {assignment.questions.length}
                {currentQuestion.points && ` • ${currentQuestion.points} points`}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className={`flex items-center px-4 py-2 rounded-lg font-mono font-bold ${
                timeLeft < 300 ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                timeLeft < 900 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              }`}>
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </div>

              {/* Calculator */}
              {allowCalculator && (
                <button
                  onClick={() => setShowCalculator(true)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  title="Open Calculator"
                >
                  <CalcIcon className="w-5 h-5" />
                </button>
              )}

              {/* Question Navigator */}
              <button
                onClick={() => setShowQuestionNav(!showQuestionNav)}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                title="Question Navigator"
              >
                <BookOpen className="w-5 h-5" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      {showQuestionNav && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="container mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Question Navigator
            </h3>
            <div className="grid grid-cols-10 gap-2">
              {assignment.questions.map((q, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${getStatusColor(status)} ${
                      !assignment.allowNavigation && index > currentQuestionIndex
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:opacity-80'
                    }`}
                    disabled={!assignment.allowNavigation && index > currentQuestionIndex}
                  >
                    {index + 1}
                    {flaggedQuestions.has(q.id) && (
                      <Flag className="w-3 h-3 absolute -top-1 -right-1" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-6 mt-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-600 rounded mr-2"></div>
                <span>Flagged</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && assignment.isProctored && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
          <div className="container mx-auto">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-800 dark:text-red-400 font-medium">
                Proctoring Warnings: {warnings.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentQuestion.title}
              </h2>
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Flag for review"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            {renderQuestion()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={!assignment.allowNavigation || currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex space-x-4">
              {currentQuestionIndex === assignment.questions.length - 1 ? (
                <button
                  onClick={handleManualSubmit}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Modal */}
      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
}
