'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle, BookOpen, CheckCircle } from 'lucide-react';
import { EnhancedCodeEditor } from '../assignment/EnhancedCodeEditor';
import { ProctoringProvider, useProctoring, EnhancedProctoringSetup } from '../proctoring/UnifiedProctoringProvider';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'multi-select' | 'integer' | 'multi_select';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean | Array<number>;
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
    requireCamera?: boolean;
    requireMicrophone?: boolean;
    requireFaceVerification?: boolean;
    requireFullscreen?: boolean;
    shuffleQuestions: boolean;
    questions: Question[];
    maxViolations?: number;
    autoSubmitOnViolation?: boolean;
    showResults?: boolean;
  };
  onSubmit: (data: Record<string, unknown> | {
    answers: Record<string, unknown>;
    violations?: any[];
    violationCount?: number;
    proctoringData?: any;
    browserInfo?: any;
    timeSpent?: number;
    autoSubmitted?: boolean;
  }) => void;
  allowCalculator?: boolean;
}

export function TestTakingInterface({ assignment, onSubmit, allowCalculator = true }: TestTakingInterfaceProps) {
  return (
    <ProctoringProvider
      onAutoSubmit={() => onSubmit({})}
      onViolation={(violation, count) => {
        console.log(`Proctoring violation: ${violation}, Count: ${count}`);
      }}
    >
      <TestTakingInterfaceInner 
        assignment={assignment} 
        onSubmit={onSubmit} 
        allowCalculator={allowCalculator} 
      />
    </ProctoringProvider>
  );
}

function TestTakingInterfaceInner({ assignment, onSubmit, allowCalculator = true }: TestTakingInterfaceProps) {
  const proctoring = useProctoring();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [timeLeft, setTimeLeft] = useState(assignment.timeLimit * 60);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState<{
    totalQuestions: number;
    questionsAttempted: number;
    timeSpent: string;
  } | null>(null);

  const currentQuestion = assignment.questions[currentQuestionIndex];

  // Integration with UnifiedProctoringProvider
  const { 
    state,
    showSetup,
    handleSetupComplete,
    handleSetupCancel,
    startProctoring
  } = useProctoring();

  // Memoized functions
  const addViolation = useCallback((violationType: string) => {
    console.log('Violation recorded:', violationType);
  }, []);

  const handleManualSubmit = useCallback(() => {
    if (submitting || submissionSuccessful) return;
    
    setSubmitting(true);
    
    try {
      const questionsAttempted = Object.keys(answers).length;
      const totalMinutes = Math.floor((assignment.timeLimit * 60 - timeLeft) / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      setSubmissionSummary({
        totalQuestions: assignment.questions.length,
        questionsAttempted,
        timeSpent
      });
      
      setTimeout(() => {
        try {
          // Prepare enhanced submission data with proctoring info
          const submissionData = {
            answers,
            violations: state.violations || [],
            violationCount: state.violationCount || 0,
            proctoringData: {
              cameraEnabled: state.cameraActive,
              microphoneEnabled: state.microphoneActive,
              faceVerified: state.faceVerified,
              setupComplete: state.isSetupComplete,
              sessionData: state.setupData
            },
            browserInfo: {
              userAgent: navigator.userAgent,
              screenResolution: `${screen.width}x${screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: navigator.language
            },
            timeSpent: assignment.timeLimit * 60 - timeLeft,
            autoSubmitted: false
          };
          
          onSubmit(submissionData);
          setSubmissionSuccessful(true);
          
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error('Error exiting fullscreen:', err));
          }
        } catch (error) {
          console.error("Error during submission:", error);
        } finally {
          setSubmitting(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error preparing submission:", error);
      setSubmitting(false);
    }
  }, [submitting, submissionSuccessful, answers, assignment.timeLimit, assignment.questions.length, timeLeft, onSubmit, state]);

  const checkForAutoSubmit = useCallback(() => {
    // Auto submit logic is now handled by UnifiedProctoringProvider
    // This function is kept for backward compatibility but does nothing
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  // Check if proctoring setup is required - now handled by UnifiedProctoringProvider
  useEffect(() => {
    if (!assignment.isProctored) {
      setTestStarted(true);
    }
    // For proctored assignments, test will start when proctoring is ready
  }, [assignment.isProctored]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submitting && !submissionSuccessful) {
            handleManualSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testStarted, submitting, submissionSuccessful, handleManualSubmit]);

  // Start proctoring when component mounts if required
  useEffect(() => {
    if (assignment.isProctored) {
      startProctoring({
        requireCamera: true,
        requireMicrophone: true,
        requireFaceVerification: true,
        requireFullscreen: true,
        maxViolations: assignment.maxViolations || 3,
        autoSubmitOnViolation: assignment.autoSubmitOnViolation || false
      });
    }
  }, [assignment.isProctored, assignment.maxViolations, assignment.autoSubmitOnViolation, startProctoring]);

  // Start test when proctoring is complete (for proctored tests) or immediately (for non-proctored)
  useEffect(() => {
    if (assignment.isProctored) {
      if (state.isSetupComplete && !testStarted) {
        setTestStarted(true);
      }
    }
  }, [assignment.isProctored, state.isSetupComplete, testStarted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: unknown) => {
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
    if (assignment.allowNavigation) {
      setCurrentQuestionIndex(index);
      setShowQuestionNav(false);
    }
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

  const getQuestionStatus = (index: number) => {
    const question = assignment.questions[index];
    const hasAnswer = answers[question.id] !== undefined;
    const isFlagged = flaggedQuestions.has(question.id);
    const isCurrent = index === currentQuestionIndex;
    
    if (isCurrent) return 'current';
    if (isFlagged) return 'flagged';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-zenith-primary text-white';
      case 'answered': return 'bg-green-600 text-white';
      case 'flagged': return 'bg-yellow-600 text-white';
      default: return 'bg-zenith-section text-zenith-secondary';
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label 
                  key={index} 
                  className="flex items-start p-4 bg-zenith-card rounded-xl cursor-pointer hover:bg-zenith-hover transition-colors border-2 border-transparent has-[:checked]:border-zenith-brand has-[:checked]:bg-zenith-brand/10"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={answer === index}
                    onChange={() => handleAnswerChange(currentQuestion.id, index)}
                    className="mt-1 text-zenith-primary border-zenith-border focus:ring-zenith-brand"
                  />
                  <span className="ml-3 text-zenith-primary flex-1">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'multi-select':
      case 'multi_select':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label 
                  key={index} 
                  className="flex items-start p-4 bg-zenith-card rounded-xl cursor-pointer hover:bg-zenith-hover transition-colors border-2 border-transparent has-[:checked]:border-zenith-brand has-[:checked]:bg-zenith-brand/10"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(answer) && answer.includes(index)}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (e.target.checked) {
                        handleAnswerChange(currentQuestion.id, [...currentAnswers, index]);
                      } else {
                        handleAnswerChange(currentQuestion.id, currentAnswers.filter(a => a !== index));
                      }
                    }}
                    className="mt-1 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                  />
                  <span className="ml-3 text-zenith-primary flex-1">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border-2 border-transparent has-[:checked]:border-green-500 has-[:checked]:bg-green-100 dark:has-[:checked]:bg-green-900/40">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="true"
                  checked={answer === true}
                  onChange={() => handleAnswerChange(currentQuestion.id, true)}
                  className="sr-only"
                />
                <span className="text-lg font-semibold text-green-700 dark:text-green-300">True</span>
              </label>
              <label className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border-2 border-transparent has-[:checked]:border-red-500 has-[:checked]:bg-red-100 dark:has-[:checked]:bg-red-900/40">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="false"
                  checked={answer === false}
                  onChange={() => handleAnswerChange(currentQuestion.id, false)}
                  className="sr-only"
                />
                <span className="text-lg font-semibold text-red-700 dark:text-red-300">False</span>
              </label>
            </div>
          </div>
        );

      case 'short-answer':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <textarea
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full h-32 p-4 border border-zenith-border dark:border-gray-600 rounded-xl bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white resize-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent"
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <textarea
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Write your essay here..."
              className="w-full h-64 p-4 border border-zenith-border dark:border-gray-600 rounded-xl bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white resize-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent"
            />
          </div>
        );

      case 'coding':
        return (
          <div className="space-y-4 flex flex-col h-full">
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <div className={`flex-grow border border-zenith-border dark:border-gray-700 rounded-lg overflow-hidden ${
              state.isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[calc(100vh-350px)] min-h-[500px]'
            }`}>
              <EnhancedCodeEditor
                question={{
                  ...currentQuestion,
                  testCases: currentQuestion.testCases?.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: tc.isHidden
                  }))
                }}
                onSave={(code: string, language: string) => {
                  console.log('Saving code:', { code, language });
                }}
                onRun={(code: string, language: string) => {
                  console.log('Running code:', { code, language });
                }}
                onSubmit={(code: string, language: string) => {
                  handleAnswerChange(currentQuestion.id, { code, language });
                }}
                timeRemaining={timeLeft}
              />
            </div>
          </div>
        );

      case 'integer':
        return (
          <div className="space-y-6">
            <div 
              className="prose dark:prose-invert max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: currentQuestion.description.replace(/\n/g, '<br>') }}
            />
            <div className="flex flex-col items-start space-y-3">
              <label className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted">
                Enter a number:
              </label>
              <input
                type="number"
                value={typeof answer === 'number' ? answer : ''}
                onChange={(e) => {
                  const val = e.target.value !== '' ? parseInt(e.target.value, 10) : '';
                  handleAnswerChange(currentQuestion.id, val);
                }}
                className="w-full max-w-md p-4 border border-zenith-border dark:border-gray-600 rounded-xl bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white text-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent"
                placeholder="Enter your answer..."
              />
            </div>
          </div>
        );
        
      default:
        return <div className="text-center text-zenith-muted dark:text-zenith-muted">Unsupported question type</div>;
    }
  };

  // Fullscreen layout optimization
  const containerClass = state.isFullscreen 
    ? "min-h-screen bg-zenith-section dark:bg-gray-900 flex flex-col"
    : "min-h-screen bg-zenith-section dark:bg-gray-900";

  return (
    <>
      {/* Proctoring Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-zenith-primary dark:text-white mb-2">
                  Proctored Assignment Setup
                </h2>
                <p className="text-zenith-secondary dark:text-zenith-muted">
                  This assignment is proctored. Please review the guidelines and complete the setup.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Proctoring Rules
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
                    <li>• Keep your camera on throughout the assignment</li>
                    <li>• Stay visible in the camera frame</li>
                    <li>• No looking away for extended periods</li>
                    <li>• No external help or collaboration</li>
                    <li>• No additional browser tabs or applications</li>
                    <li>• Assignment will be in fullscreen mode</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    System Requirements
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                    <li>• Working camera and microphone</li>
                    <li>• Stable internet connection</li>
                    <li>• Modern web browser</li>
                    <li>• Quiet, well-lit environment</li>
                    <li>• No interruptions during the test</li>
                    <li>• Clear view of your workspace</li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-3">
                  ⚠️ Academic Integrity Agreement
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  By proceeding, you agree that this is your individual work and you will not use unauthorized 
                  resources or receive help from others. Any violations will be recorded and may result in 
                  assignment failure and academic disciplinary action.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSetupCancel}
                  className="flex-1 px-6 py-3 bg-zenith-section0 hover:bg-zenith-secondary text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSetupComplete({
                      cameraPermitted: true,
                      microphonePermitted: true,
                      faceVerified: true,
                      systemCheck: true
                    });
                    setTestStarted(true);
                  }}
                  className="flex-1 px-6 py-3 bg-zenith-primary hover:bg-zenith-primary/90 text-white font-semibold rounded-lg transition-colors"
                >
                  I Understand, Start Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Test Interface */}
      {testStarted && (
        <div className={containerClass}>
          {/* Header - Always visible, optimized for fullscreen */}
          <div className={`bg-zenith-card dark:bg-gray-800 shadow-sm border-b border-zenith-border dark:border-gray-700 ${
            state.isFullscreen ? 'fixed top-0 left-0 right-0 z-30' : 'sticky top-0 z-30'
          }`}>
            <div className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-zenith-primary dark:text-white">{assignment.title}</h1>
                  <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                    Question {currentQuestionIndex + 1} of {assignment.questions.length}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-5 h-5 text-zenith-primary dark:text-blue-400 mr-2" />
                    <span className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-300">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  
                  {assignment.allowNavigation && !state.isFullscreen && (
                    <button
                      onClick={() => setShowQuestionNav(!showQuestionNav)}
                      className="p-2 bg-zenith-section dark:bg-gray-700 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary transition-colors"
                    >
                      <BookOpen className="w-5 h-5 text-zenith-secondary dark:text-zenith-muted" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      flaggedQuestions.has(currentQuestion.id)
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        : 'bg-zenith-section dark:bg-gray-700 text-zenith-secondary dark:text-zenith-muted hover:bg-zenith-section dark:hover:bg-zenith-secondary'
                    }`}
                    title="Flag for review"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigation Panel - Hidden in fullscreen */}
          {showQuestionNav && !state.isFullscreen && (
            <div className="bg-zenith-card dark:bg-gray-800 border-b border-zenith-border dark:border-gray-700 p-4">
              <div className="container mx-auto">
                <h3 className="text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-3">Navigate to Question:</h3>
                <div className="grid grid-cols-10 gap-2">
                  {assignment.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(getQuestionStatus(index))}`}
                      disabled={!assignment.allowNavigation}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Optimized for fullscreen */}
          <div className={`flex-1 ${state.isFullscreen ? 'pt-20 pb-20' : 'py-8 pb-32'} px-6`}>
            <div className="container mx-auto max-w-4xl">
              <div className="bg-zenith-card dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full">
                <div className="p-8 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-zenith-primary text-white rounded-full flex items-center justify-center font-bold">
                        {currentQuestionIndex + 1}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-zenith-primary dark:text-white">
                          {currentQuestion?.title || `Question ${currentQuestionIndex + 1}`}
                        </h2>
                        <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                          {currentQuestion?.points} point{(currentQuestion?.points || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={state.isFullscreen ? 'h-[calc(100vh-250px)]' : 'min-h-[400px]'}>
                    {renderQuestion()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Navigation - Always visible */}
          <div className={`bg-zenith-card dark:bg-gray-800 border-t border-zenith-border dark:border-gray-700 shadow-2xl py-4 px-6 z-40 ${
            state.isFullscreen ? 'fixed bottom-0 left-0 right-0' : 'fixed bottom-0 left-0 right-0'
          }`}>
            <div className="container mx-auto max-w-6xl flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={!assignment.allowNavigation || currentQuestionIndex === 0}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <div className="flex-grow text-center px-4">
                <div className="bg-zenith-section dark:bg-gray-700 rounded-xl py-3 px-6">
                  <div className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted mb-1">
                    Progress
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-lg font-bold text-zenith-primary dark:text-white">
                      {currentQuestionIndex + 1} / {assignment.questions.length}
                    </span>
                    <div className="w-32 h-2 bg-gray-300 dark:bg-zenith-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / assignment.questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {currentQuestionIndex === assignment.questions.length - 1 ? (
                <button
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Test
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {submissionSuccessful && submissionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 md:p-8 m-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-zenith-primary dark:text-white mb-2">
                Successfully Submitted!
              </h2>
              <p className="text-zenith-secondary dark:text-zenith-muted">
                Your test has been recorded and safely stored.
              </p>
            </div>
            
            <div className="bg-zenith-section dark:bg-gray-700 rounded-lg p-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zenith-muted dark:text-zenith-muted mb-1">Questions Answered</p>
                  <div className="flex items-center">
                    <p className="text-xl font-bold text-zenith-primary dark:text-white">
                      {submissionSummary.questionsAttempted}
                      <span className="text-sm font-normal text-zenith-muted dark:text-zenith-muted ml-1">
                        / {submissionSummary.totalQuestions}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zenith-muted dark:text-zenith-muted mb-1">Time Used</p>
                  <p className="text-xl font-bold text-zenith-primary dark:text-white flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-zenith-primary dark:text-blue-400" />
                    {submissionSummary.timeSpent}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-zenith-border dark:border-gray-600">
                <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                  {assignment.showResults 
                    ? 'Your results are now available to view.' 
                    : 'Your instructor will grade your submission soon.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              {assignment.showResults && (
                <button
                  onClick={() => window.location.href = `/assignments/${assignment.id}/results`}
                  className="w-full py-3 px-4 bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <span>View Results</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
              <button
                onClick={() => window.location.href = '/assignments'}
                className="w-full py-3 px-4 bg-zenith-section hover:bg-zenith-hover dark:bg-gray-700 dark:hover:bg-zenith-secondary text-zenith-primary dark:text-white rounded-lg font-medium transition-colors"
              >
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
