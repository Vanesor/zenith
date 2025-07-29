'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner, FullscreenLoading } from '@/components/assignment/LoadingSpinner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  AlertTriangle, 
  FileText, 
  Target,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  User
} from 'lucide-react';

interface QuestionResult {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  title: string;
  description: string;
  userAnswer: any;
  correctAnswer?: any;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  feedback?: string;
  timeSpent?: number;
  codeOutput?: string;
  testCaseResults?: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>;
}

interface AssignmentResult {
  id: string;
  title: string;
  description: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassing: boolean;
  passingScore: number;
  timeSpent: number;
  timeLimit: number;
  submittedAt: string;
  gradedAt?: string;
  status: 'completed' | 'graded' | 'reviewed';
  attempt: number;
  totalAttempts: number;
  questions: QuestionResult[];
  violations: string[];
  feedback?: string;
  allowReview: boolean;
  showCorrectAnswers: boolean;
}

export default function AssignmentResults() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const assignmentId = params.id as string;
  
  const [results, setResults] = useState<AssignmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchResults();
  }, [user, assignmentId, router]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zenith-token');
      
      const response = await fetch(`/api/assignments/${assignmentId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          showToast({
            title: 'Results Not Found',
            message: 'Assignment results are not available yet.',
            type: 'error'
          });
          router.push('/assignments');
          return;
        }
        throw new Error('Failed to fetch results');
      }

      const resultsData = await response.json();
      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching results:', error);
      showToast({
        title: 'Error',
        message: 'Failed to load assignment results',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getScoreColor = (percentage: number, isPassing: boolean) => {
    if (isPassing) {
      if (percentage >= 90) return 'text-green-600 dark:text-green-400';
      if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeLabel = (percentage: number, isPassing: boolean) => {
    if (!isPassing) return 'Failed';
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 65) return 'D';
    return 'F';
  };

  const downloadResults = () => {
    if (!results) return;
    
    const resultsText = `
Assignment Results: ${results.title}
Student: ${user?.name || 'Unknown'}
Date: ${new Date(results.submittedAt).toLocaleDateString()}

SUMMARY:
Score: ${results.totalScore}/${results.maxScore} (${results.percentage.toFixed(1)}%)
Grade: ${getGradeLabel(results.percentage, results.isPassing)}
Status: ${results.isPassing ? 'PASSED' : 'FAILED'}
Time Spent: ${formatTime(results.timeSpent)}
Attempt: ${results.attempt}/${results.totalAttempts}

QUESTION BREAKDOWN:
${results.questions.map((q, i) => `
Question ${i + 1}: ${q.title}
Score: ${q.pointsAwarded}/${q.maxPoints}
Status: ${q.isCorrect ? 'Correct' : 'Incorrect'}
${q.feedback ? `Feedback: ${q.feedback}` : ''}
`).join('\n')}

${results.violations.length > 0 ? `
VIOLATIONS:
${results.violations.map(v => `• ${v}`).join('\n')}
` : ''}
    `.trim();

    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${results.title.replace(/\s+/g, '_')}_Results.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <FullscreenLoading title="Loading Results..." message="Please wait while we prepare your results." />;
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Results not available
          </h2>
          <button
            onClick={() => router.push('/assignments')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/assignments')}
              className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Assignment Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {results.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadResults}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(results.percentage, results.isPassing)}`}>
              {results.percentage.toFixed(1)}%
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Final Score</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              {results.totalScore}/{results.maxScore} points
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${getScoreColor(results.percentage, results.isPassing)}`}>
              {getGradeLabel(results.percentage, results.isPassing)}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Grade</div>
            <div className={`text-sm font-medium ${results.isPassing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {results.isPassing ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {formatTime(results.timeSpent)}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Time Spent</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              of {formatTime(results.timeLimit)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {results.attempt}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Attempt</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              of {results.totalAttempts}
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl p-6 mb-8 ${
          results.isPassing 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {results.isPassing ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-4" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mr-4" />
            )}
            <div>
              <h3 className={`text-xl font-semibold mb-1 ${
                results.isPassing 
                  ? 'text-green-900 dark:text-green-300' 
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {results.isPassing ? 'Congratulations! You passed!' : 'Assignment not passed'}
              </h3>
              <p className={`${
                results.isPassing 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {results.isPassing 
                  ? `You scored ${results.percentage.toFixed(1)}% which is above the passing score of ${results.passingScore}%`
                  : `You scored ${results.percentage.toFixed(1)}% which is below the passing score of ${results.passingScore}%`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Assignment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <User className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Student:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {user?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {new Date(results.submittedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Questions:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {results.questions.length}
              </span>
            </div>
            <div className="flex items-center">
              <Target className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {results.status.charAt(0).toUpperCase() + results.status.slice(1)}
              </span>
            </div>
          </div>
          
          {results.feedback && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Instructor Feedback
              </h4>
              <p className="text-blue-800 dark:text-blue-400">
                {results.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Violations Warning */}
        {results.violations.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                  Academic Integrity Violations Detected
                </h3>
                <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                  {results.violations.map((violation, index) => (
                    <li key={index}>• {violation}</li>
                  ))}
                </ul>
                <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                  These violations have been reported to your instructor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Question Results */}
        {(results.allowReview || showDetails) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Question Results
            </h3>
            
            <div className="space-y-4">
              {results.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                          Question {index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.isCorrect 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        }`}>
                          {question.pointsAwarded}/{question.maxPoints} points
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {question.type.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {question.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {question.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      {question.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Show answers for review */}
                  {showDetails && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Your Answer:
                        </span>
                        <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          {question.type === 'coding' ? (
                            <pre className="text-xs overflow-x-auto">
                              {question.userAnswer || 'No answer provided'}
                            </pre>
                          ) : (
                            <span className="text-gray-900 dark:text-white">
                              {Array.isArray(question.userAnswer)
                                ? question.userAnswer.join(', ')
                                : question.userAnswer || 'No answer provided'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {results.showCorrectAnswers && question.correctAnswer && (
                        <div>
                          <span className="font-medium text-green-700 dark:text-green-300">
                            Correct Answer:
                          </span>
                          <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="text-green-900 dark:text-green-300">
                              {Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.join(', ')
                                : question.correctAnswer
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {question.testCaseResults && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Test Case Results:
                          </span>
                          <div className="mt-2 space-y-2">
                            {question.testCaseResults.map((testCase, tcIndex) => (
                              <div key={testCase.id} className={`p-2 rounded text-xs ${
                                testCase.passed 
                                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">Test Case {tcIndex + 1}</span>
                                  <span className={testCase.passed ? 'text-green-600' : 'text-red-600'}>
                                    {testCase.passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <strong>Input:</strong> {testCase.input}
                                  </div>
                                  <div>
                                    <strong>Expected:</strong> {testCase.expectedOutput}
                                  </div>
                                  <div>
                                    <strong>Your Output:</strong> {testCase.actualOutput}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.feedback && (
                        <div>
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Feedback:
                          </span>
                          <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <span className="text-blue-900 dark:text-blue-300">
                              {question.feedback}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/assignments')}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
          >
            Back to Assignments
          </button>
          
          {results.attempt < results.totalAttempts && !results.isPassing && (
            <button
              onClick={() => router.push(`/assignments/${assignmentId}/take`)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
