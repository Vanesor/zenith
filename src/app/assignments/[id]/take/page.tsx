'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { TestTakingInterface } from '@/components/test/TestTakingInterface';
import { EnhancedCodeEditor } from '@/components/assignment/EnhancedCodeEditor';
import { ProctoringProvider } from '@/components/proctoring/UnifiedProctoringProvider';
import { LoadingSpinner, FullscreenLoading } from '@/components/assignment/LoadingSpinner';
import { Clock, FileText, AlertTriangle, CheckCircle, User, Calendar, Target } from 'lucide-react';
import TokenManager from '@/lib/TokenManager';

interface Assignment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  allowNavigation: boolean;
  isProctored: boolean;
  shuffleQuestions: boolean;
  allowCalculator: boolean;
  maxAttempts: number;
  showResults: boolean;
  allowReview: boolean;
  instructions: string;
  dueDate: string;
  maxPoints: number;
  passingScore: number;
  questions: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'multi-select' | 'multi_select' | 'integer';
    title: string;
    description: string;
    options?: string[];
    correctAnswer?: string | number | boolean | Array<number>;
    points: number;
    timeLimit?: number;
    language?: string;
    starterCode?: string;
    testCases?: Array<{ id: string; input: string; expectedOutput: string; isHidden?: boolean }>;
  }>;
}

interface AttemptData {
  id: string;
  startTime: string;
  endTime?: string;
  score?: number;
  status: 'in_progress' | 'completed' | 'submitted';
  answers: Record<string, any>;
  violations: string[];
}

export default function TakeAssignment() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptData | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<AttemptData[]>([]);
  const [canTakeAssignment, setCanTakeAssignment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    // Enhanced authentication check
    if (!user) {
      showToast({
        title: 'Authentication Required',
        message: 'Please log in to access assignments',
        type: 'error'
      });
      router.push('/login');
      return;
    }

    // Verify user token is still valid
    const token = localStorage.getItem('zenith-token');
    if (!token) {
      showToast({
        title: 'Session Expired',
        message: 'Please log in again to continue',
        type: 'error'
      });
      router.push('/login');
      return;
    }

    fetchAssignmentData();
  }, [user, assignmentId, router, showToast]);

  // Hide/Show navbar based on assignment status
  useEffect(() => {
    const navbar = document.querySelector('nav');
    const header = document.querySelector('header');
    
    if (hasStarted) {
      // Hide navbar when assignment starts
      if (navbar) navbar.style.display = 'none';
      if (header) header.style.display = 'none';
      document.body.style.paddingTop = '0';
    } else {
      // Show navbar when not in assignment
      if (navbar) navbar.style.display = '';
      if (header) header.style.display = '';
      document.body.style.paddingTop = '';
    }

    // Cleanup on unmount
    return () => {
      if (navbar) navbar.style.display = '';
      if (header) header.style.display = '';
      document.body.style.paddingTop = '';
    };
  }, [hasStarted]);

  // Timer countdown effect
  useEffect(() => {
    if (!hasStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          if (assignment?.questions?.[0]?.type === 'coding') {
            handleCodeSubmit('', '');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      const tokenManager = TokenManager.getInstance();
      
      // Fetch assignment details
      const assignmentResponse = await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}`);

      if (!assignmentResponse.ok) {
        if (assignmentResponse.status === 404) {
          setErrorMessage('Assignment not found');
          return;
        }
        throw new Error('Failed to fetch assignment');
      }

      const assignmentData = await assignmentResponse.json();
      
      // Check if assignment is still available
      const now = new Date();
      const dueDate = new Date(assignmentData.dueDate);
      
      if (now > dueDate) {
        setErrorMessage('This assignment has expired');
        return;
      }

      // Fetch user's attempts
      const attemptsResponse = await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}/attempts`);

      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        setPreviousAttempts(attemptsData.attempts || []);
        
        // Check if user has an in-progress attempt
        const inProgressAttempt = attemptsData.attempts?.find(
          (attempt: AttemptData) => attempt.status === 'in_progress'
        );
        
        if (inProgressAttempt) {
          setCurrentAttempt(inProgressAttempt);
          setHasStarted(true);
        }

        // Check if user can still take the assignment
        const completedAttempts = attemptsData.attempts?.filter(
          (attempt: AttemptData) => attempt.status === 'completed'
        ).length || 0;

        setCanTakeAssignment(completedAttempts < assignmentData.maxAttempts);
      }

      setAssignment(assignmentData);
      
      // Initialize timer if assignment has started
      if (assignmentData.timeLimit) {
        setTimeRemaining(assignmentData.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setErrorMessage('Failed to load assignment. Please try again.');
      showToast({
        title: 'Error',
        message: 'Failed to load assignment data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const startAssignment = async () => {
    if (!assignment || !canTakeAssignment) return;

    // Show warning modal before starting assignment
    setShowWarningModal(true);
  };

  const confirmStartAssignment = async () => {
    if (!assignment || !canTakeAssignment) return;

    try {
      setSubmitting(true);
      setShowWarningModal(false);
      const tokenManager = TokenManager.getInstance();
      
      const response = await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}/start`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to start assignment');
      }

      const attemptData = await response.json();
      setCurrentAttempt(attemptData);
      setHasStarted(true);
      
      // Start the timer
      if (assignment.timeLimit) {
        setTimeRemaining(assignment.timeLimit * 60); // Convert minutes to seconds
      }
      
      showToast({
        title: 'Assignment Started',
        message: 'Your assignment timer has begun. Good luck!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error starting assignment:', error);
      showToast({
        title: 'Error',
        message: 'Failed to start assignment. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = async (data: Record<string, any> | {
    answers: Record<string, any>;
    violations?: any[];
    violationCount?: number;
    proctoringData?: any;
    browserInfo?: any;
    timeSpent?: number;
    autoSubmitted?: boolean;
  }) => {
    if (!assignment || !currentAttempt) return;

    try {
      setSubmitting(true);
      const tokenManager = TokenManager.getInstance();
      
      // Handle both legacy format (just answers) and new enhanced format
      let answers: Record<string, any>;
      let violations: any[] = [];
      let violationCount = 0;
      let proctoringData = {};
      let browserInfo = {};
      let timeSpent = 0;
      let autoSubmitted = false;

      if ('answers' in data) {
        // New enhanced format
        answers = data.answers;
        violations = data.violations || [];
        violationCount = data.violationCount || 0;
        proctoringData = data.proctoringData || {};
        browserInfo = data.browserInfo || {};
        timeSpent = data.timeSpent || 0;
        autoSubmitted = data.autoSubmitted || false;
      } else {
        // Legacy format - just answers
        answers = data;
        timeSpent = Math.floor((Date.now() - new Date(currentAttempt.startTime).getTime()) / 1000);
      }

      // Convert answers object to array format expected by API
      const answersArray = Object.entries(answers).map(([questionId, answer]) => {
        const question = assignment?.questions.find(q => q.id === questionId);
        const questionType = question?.type;
        
        // Handle different question types appropriately
        let selectedOptions: any[] = [];
        let codeAnswer = null;
        let essayAnswer = null;
        
        if (questionType === 'multiple-choice') {
          // Single selection as number index
          selectedOptions = typeof answer === 'number' ? [answer] : [];
        } 
        else if (questionType === 'multi-select' || questionType === 'multi_select') {
          // Multiple selections as array of indices
          selectedOptions = Array.isArray(answer) ? answer : [];
        }
        else if (questionType === 'true-false') {
          // Boolean value converted to text
          essayAnswer = answer === true ? 'true' : answer === false ? 'false' : null;
        }
        else if (questionType === 'coding') {
          // Code submissions with language
          if (typeof answer === 'object' && answer.code) {
            codeAnswer = JSON.stringify({
              code: answer.code,
              language: answer.language || 'javascript'
            });
          }
        }
        else if (questionType === 'essay' || questionType === 'short-answer') {
          // Text responses
          essayAnswer = typeof answer === 'string' ? answer : null;
        }
        else if (questionType === 'integer') {
          // Integer answers
          essayAnswer = answer !== undefined ? answer.toString() : null;
        }
        
        return {
          questionId,
          selectedOptions,
          codeAnswer,
          essayAnswer,
          timeSpent: (typeof answer === 'object' && answer.timeSpent) ? answer.timeSpent : 0
        };
      });
      
      const response = await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersArray,
          startedAt: currentAttempt.startTime,
          completedAt: new Date().toISOString(),
          timeSpent,
          violationCount,
          autoSubmitted,
          violations,
          proctoringData,
          browserInfo
        })
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error("Submission error details:", errorData);
          throw new Error(errorData.error || 'Failed to submit assignment');
        } catch (jsonError) {
          console.error("Failed to parse error response:", response.statusText);
          throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      
      // Set submission result and show success modal
      setSubmissionResult({
        score: result.totalScore,
        maxPoints: assignment.maxPoints || 100,
        percentage: result.percentage || ((result.totalScore / (assignment.maxPoints || 100)) * 100),
        submissionId: result.submissionId,
        showResults: assignment.showResults
      });
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      showToast({
        title: 'Submission Error',
        message: 'Failed to submit assignment. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSave = (code: string, language: string) => {
    console.log('Saving code:', { code, language, questionId: assignment?.questions?.[0]?.id });
    // Implement auto-save logic here
  };

  const handleCodeRun = (code: string, language: string) => {
    console.log('Running code:', { code, language });
    // Implement code execution logic here
  };

  const handleCodeSubmit = (code: string, language: string) => {
    console.log('Submitting code:', { code, language });
    // Implement code submission logic here
    const answers = {
      [assignment?.questions?.[0]?.id || '']: { code, language }
    };
    handleSubmitAssignment(answers);
  };

  const formatTimeRemaining = (timeValue: number) => {
    // If timeValue is likely in seconds (greater than 1000), convert to minutes
    const minutes = timeValue > 1000 ? Math.floor(timeValue / 60) : timeValue;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTimeUntilDue = () => {
    if (!assignment) return null;
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diffMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));
    return Math.max(0, diffMinutes);
  };

  if (loading) {
    return <FullscreenLoading title="Loading Assignment..." message="Please wait while we prepare your assignment." />;
  }

  if (submitting) {
    return <FullscreenLoading title="Submitting Assignment..." message="Please wait while we save your answers." />;
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Assignment Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push('/assignments')}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Assignment not found
          </h2>
        </div>
      </div>
    );
  }

  // If assignment has started, show the appropriate interface
  if (hasStarted && currentAttempt) {
    // For coding assignments, use the enhanced editor with fullscreen
    if (assignment.questions && assignment.questions.length === 1 && assignment.questions[0].type === 'coding') {
      return (
        <ProctoringProvider 
          onAutoSubmit={() => handleSubmitAssignment({})}
          onViolation={(violation, count) => console.log('Violation:', violation, 'Count:', count)}
        >
          <EnhancedCodeEditor
            question={{
              ...assignment.questions[0],
              testCases: assignment.questions[0].testCases?.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden
              }))
            }}
            onSave={handleCodeSave}
            onRun={handleCodeRun}
            onSubmit={handleCodeSubmit}
            timeRemaining={timeRemaining}
          />
        </ProctoringProvider>
      );
    }
    
    // For other assignment types, use the standard test interface
    return (
      <ProctoringProvider 
        onAutoSubmit={() => handleSubmitAssignment({})}
        onViolation={(violation, count) => console.log('Violation:', violation, 'Count:', count)}
      >
        <TestTakingInterface
          assignment={assignment}
          onSubmit={handleSubmitAssignment}
          allowCalculator={assignment.allowCalculator}
        />
      </ProctoringProvider>
    );
  }

  // Pre-assignment information screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {assignment.title}
          </h1>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {user?.name || 'Student'}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              {assignment.maxPoints} points
            </div>
          </div>
        </div>

        {/* Assignment Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Time Limit
              </h3>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {formatTimeRemaining(assignment.timeLimit)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete within time limit
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <FileText className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Questions
              </h3>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {assignment.questions.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mixed question types
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attempts
              </h3>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {previousAttempts.length} / {assignment.maxAttempts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Attempts used
            </p>
          </div>
        </div>

        {/* Assignment Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Assignment Description
          </h2>
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: assignment.description.replace(/\n/g, '<br>') }}
          />
        </div>

        {/* Instructions */}
        {assignment.instructions && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-3">
              Important Instructions
            </h3>
            <div 
              className="text-amber-800 dark:text-amber-400"
              dangerouslySetInnerHTML={{ __html: assignment.instructions.replace(/\n/g, '<br>') }}
            />
          </div>
        )}

        {/* Assignment Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Assignment Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded mr-3 ${assignment.allowNavigation ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {assignment.allowNavigation ? 'Navigation between questions allowed' : 'Sequential question navigation'}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded mr-3 ${assignment.allowCalculator ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {assignment.allowCalculator ? 'Calculator available' : 'No calculator allowed'}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded mr-3 ${assignment.isProctored ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {assignment.isProctored ? 'Proctored (monitored)' : 'Not proctored'}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded mr-3 ${assignment.showResults ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {assignment.showResults ? 'Results shown after submission' : 'Results not immediately shown'}
              </span>
            </div>
          </div>
        </div>

        {/* Previous Attempts */}
        {previousAttempts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Previous Attempts
            </h3>
            <div className="space-y-3">
              {previousAttempts.map((attempt, index) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Attempt {index + 1}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {new Date(attempt.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    {attempt.score !== undefined ? (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {attempt.score}/{assignment.maxPoints}
                      </span>
                    ) : (
                      <span className="text-gray-500">In Progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {assignment.isProctored && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                  Proctoring Warning
                </h3>
                <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                  <li>• This assignment is monitored for academic integrity</li>
                  <li>• Do not switch tabs or applications during the test</li>
                  <li>• Do not attempt to copy or paste content</li>
                  <li>• Any violations will be reported to your instructor</li>
                  <li>• Ensure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Time Warning */}
        {getTimeUntilDue() && getTimeUntilDue()! < 60 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">
                  Assignment Due Soon
                </h3>
                <p className="text-yellow-800 dark:text-yellow-400">
                  This assignment is due in {formatTimeRemaining(getTimeUntilDue()!)}. Start now to ensure you have enough time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          {canTakeAssignment ? (
            <button
              onClick={startAssignment}
              disabled={submitting}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-xl rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100"
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-3" />
                  Starting Assignment...
                </div>
              ) : (
                'Start Assignment'
              )}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                You have used all your attempts for this assignment.
              </p>
              <button
                onClick={() => router.push('/assignments')}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
              >
                Back to Assignments
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Make sure you have a stable internet connection and enough time to complete the assignment.
            <br />
            Your progress will be automatically saved, but submit before the time limit expires.
          </p>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Assignment Guidelines & Rules
                </h2>
              </div>
              
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Important Guidelines:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Once started, the timer cannot be paused</li>
                    <li>Ensure you have a stable internet connection</li>
                    <li>Do not refresh the page or navigate away during the test</li>
                    <li>Your progress is automatically saved</li>
                    {assignment?.timeLimit && (
                      <li>Time limit: {assignment.timeLimit} minutes</li>
                    )}
                    {assignment?.maxAttempts && (
                      <li>Maximum attempts: {assignment.maxAttempts}</li>
                    )}
                  </ul>
                </div>

                {assignment?.isProctored && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                      Proctoring Rules:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>This assignment is proctored</li>
                      <li>Camera and microphone access may be required</li>
                      <li>Do not look away from the screen for extended periods</li>
                      <li>No external help or resources allowed unless specified</li>
                    </ul>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Academic Integrity:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>This is your individual work</li>
                    <li>No collaboration or external assistance allowed</li>
                    <li>Use of unauthorized resources is prohibited</li>
                    <li>Violations will result in assignment failure</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStartAssignment}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {submitting ? 'Starting...' : 'I Understand, Start Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && submissionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Assignment Submitted Successfully!
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your Score
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {submissionResult.score}/{submissionResult.maxPoints}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  ({submissionResult.percentage.toFixed(1)}%)
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {submissionResult.showResults ? (
                  <button
                    onClick={() => router.push(`/assignments/${assignmentId}/results`)}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    View Detailed Results
                  </button>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Detailed results will be available after instructor review.
                  </p>
                )}
                
                <button
                  onClick={() => router.push('/assignments')}
                  className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Back to Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
