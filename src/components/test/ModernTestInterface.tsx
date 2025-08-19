'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Flag,
  AlertCircle,
  ChevronRight,
  Eye,
  Save,
  LogOut,
  HelpCircle,
  Pause,
  Play,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TokenManager from '@/lib/TokenManager';
import { useToast } from '@/contexts/ToastContext';
import { UniversalLoader } from '@/components/UniversalLoader';

interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'text' | 'code';
  options?: {
    id: string;
    text: string;
  }[];
  marks: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  code_snippet?: string;
  image_url?: string;
}

interface TestProps {
  testId: string;
  onComplete: (results: any) => void;
  onExit: () => void;
}

export default function ModernTestInterface({ testId, onComplete, onExit }: TestProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string | string[]}>({});
  const [flagged, setFlagged] = useState<{[key: string]: boolean}>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes by default
  const [showSidebar, setShowSidebar] = useState(false);
  const [testPaused, setTestPaused] = useState(false);
  const [testDetails, setTestDetails] = useState({
    title: 'Programming Assessment',
    duration: 60, // in minutes
    total_marks: 100,
    passing_marks: 60,
    instructions: 'Read each question carefully. You can flag questions to review later.'
  });
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Timer setup
  useEffect(() => {
    if (loading || testPaused) return;
    
    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, loading, testPaused]);
  
  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Fetch test details and questions
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch(`/api/tests/${testId}`);
        
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions || []);
          if (data.test) {
            setTestDetails({
              title: data.test.title,
              duration: data.test.duration_minutes,
              total_marks: data.test.total_marks,
              passing_marks: data.test.passing_marks,
              instructions: data.test.instructions
            });
            setTimeLeft(data.test.duration_minutes * 60);
          }
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load test questions'
          });
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load test'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [testId, showToast]);
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Toggle flag status for question
  const handleFlagQuestion = (questionId: string) => {
    setFlagged(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  // Go to a specific question
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowSidebar(false);
  };
  
  // Submit the test
  const handleSubmitTest = async () => {
    if (!confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    
    try {
      setLoading(true);
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Test submitted successfully!'
        });
        onComplete(data.results);
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to submit test'
        });
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to submit test'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check answer status
  const getAnswerStatus = (index: number) => {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    if (flagged[question.id]) return 'flagged';
    if (answers[question.id]) return 'answered';
    return 'unanswered';
  };
  
  // Calculate progress
  const answeredCount = questions.length > 0 ? 
    Object.keys(answers).filter(id => answers[id] !== '').length : 0;
  const progressPercentage = questions.length > 0 ? 
    (answeredCount / questions.length) * 100 : 0;
    
  // Time warning colors
  const getTimeColor = () => {
    const totalSeconds = testDetails.duration * 60;
    const percentLeft = (timeLeft / totalSeconds) * 100;
    
    if (percentLeft < 10) return 'text-red-500';
    if (percentLeft < 25) return 'text-amber-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-college-dark">
        <UniversalLoader message="Loading test questions..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-college-dark text-white">
      {/* Test Header */}
      <header className="bg-college-medium border-b border-gray-700 shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={() => setShowInstructions(true)}
            className="mr-4 text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            title="Show Instructions"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold truncate max-w-[250px] sm:max-w-md">
            {testDetails.title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTestPaused(!testPaused)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            {testPaused ? (
              <>
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            )}
          </button>
          
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 ${getTimeColor()}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
          
          <button 
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 rounded-lg bg-college-primary hover:bg-college-accent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Test Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {questions.length > 0 && (
            <>
              <div className="max-w-4xl mx-auto">
                {/* Question navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm flex items-center space-x-2">
                    <span className="bg-college-primary/20 text-college-primary px-3 py-1 rounded-full">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-gray-400">
                      {questions[currentQuestionIndex]?.marks} {questions[currentQuestionIndex]?.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleFlagQuestion(questions[currentQuestionIndex].id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                        flagged[questions[currentQuestionIndex].id]
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      <span>{flagged[questions[currentQuestionIndex].id] ? 'Flagged' : 'Flag for Review'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Question */}
                <div className="mb-6 bg-college-medium rounded-xl p-6 border border-gray-700 shadow-lg">
                  {questions[currentQuestionIndex]?.difficulty && (
                    <div className="mb-4 flex items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        questions[currentQuestionIndex].difficulty === 'easy'
                          ? 'bg-green-500/20 text-green-500'
                          : questions[currentQuestionIndex].difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {questions[currentQuestionIndex].difficulty.toUpperCase()}
                      </span>
                      {questions[currentQuestionIndex]?.category && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-300 ml-2">
                          {questions[currentQuestionIndex].category}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <h2 className="text-xl font-bold mb-4">{questions[currentQuestionIndex].question_text}</h2>
                  
                  {questions[currentQuestionIndex].code_snippet && (
                    <div className="my-4 bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-auto">
                      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                        {questions[currentQuestionIndex].code_snippet}
                      </pre>
                    </div>
                  )}
                  
                  {questions[currentQuestionIndex].image_url && (
                    <div className="my-4 flex justify-center">
                      <img 
                        src={questions[currentQuestionIndex].image_url} 
                        alt="Question illustration" 
                        className="max-w-full rounded-lg border border-gray-700"
                      />
                    </div>
                  )}
                </div>
                
                {/* Answer Area */}
                <div className="bg-college-medium rounded-xl p-6 border border-gray-700 shadow-lg mb-8">
                  {questions[currentQuestionIndex].question_type === 'mcq' && questions[currentQuestionIndex].options && (
                    <div className="space-y-3">
                      {questions[currentQuestionIndex].options.map((option) => (
                        <label 
                          key={option.id} 
                          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[questions[currentQuestionIndex].id] === option.id
                              ? 'bg-college-primary/10 border-college-primary'
                              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${questions[currentQuestionIndex].id}`}
                            value={option.id}
                            checked={answers[questions[currentQuestionIndex].id] === option.id}
                            onChange={() => handleAnswerChange(questions[currentQuestionIndex].id, option.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                            answers[questions[currentQuestionIndex].id] === option.id
                              ? 'border-college-primary bg-college-primary'
                              : 'border-gray-500'
                          }`}>
                            {answers[questions[currentQuestionIndex].id] === option.id && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {questions[currentQuestionIndex].question_type === 'text' && (
                    <textarea
                      value={answers[questions[currentQuestionIndex].id] as string || ''}
                      onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                      className="w-full h-40 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-college-primary transition-colors resize-none"
                      placeholder="Type your answer here..."
                    />
                  )}
                  
                  {questions[currentQuestionIndex].question_type === 'code' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Code Editor</span>
                        <select 
                          className="text-sm bg-gray-800 border border-gray-700 rounded-md py-1 px-2 text-white"
                          defaultValue="javascript"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                      <textarea
                        value={answers[questions[currentQuestionIndex].id] as string || ''}
                        onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                        className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-college-primary transition-colors resize-none font-mono"
                        placeholder="// Write your code here..."
                      />
                    </div>
                  )}
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setConfirmSubmit(true)}
                      className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Test</span>
                    </button>
                    
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-college-primary text-white hover:bg-college-accent transition-colors"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmSubmit(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-college-primary text-white hover:bg-college-accent transition-colors"
                      >
                        <span>Finish</span>
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Question Navigator Sidebar (visible on larger screens) */}
        <div className="hidden md:block w-72 bg-college-medium border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Progress</h3>
                <span className="text-sm text-gray-300">{answeredCount}/{questions.length}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div 
                  className="h-full bg-college-primary rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <h3 className="font-semibold mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    currentQuestionIndex === index
                      ? 'bg-college-primary text-white font-medium'
                      : getAnswerStatus(index) === 'flagged'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500'
                      : getAnswerStatus(index) === 'answered'
                      ? 'bg-green-600/20 text-green-500 border border-green-600'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-sm bg-college-primary"></div>
                <span className="text-sm text-gray-300">Current Question</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-sm bg-green-600/20 border border-green-600"></div>
                <span className="text-sm text-gray-300">Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-sm bg-amber-500/20 border border-amber-500"></div>
                <span className="text-sm text-gray-300">Flagged for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-sm bg-gray-800"></div>
                <span className="text-sm text-gray-300">Unanswered</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => setConfirmSubmit(true)}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Question Navigator Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSidebar(false)}
            ></div>
            
            <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-college-medium shadow-xl overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Question Navigator</h3>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="p-2 rounded-full hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Progress</h3>
                    <span className="text-sm text-gray-300">{answeredCount}/{questions.length}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-college-primary rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-3">Questions</h3>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                        currentQuestionIndex === index
                          ? 'bg-college-primary text-white font-medium'
                          : getAnswerStatus(index) === 'flagged'
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500'
                          : getAnswerStatus(index) === 'answered'
                          ? 'bg-green-600/20 text-green-500 border border-green-600'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-college-primary"></div>
                    <span className="text-sm text-gray-300">Current Question</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-green-600/20 border border-green-600"></div>
                    <span className="text-sm text-gray-300">Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-amber-500/20 border border-amber-500"></div>
                    <span className="text-sm text-gray-300">Flagged for Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-gray-800"></div>
                    <span className="text-sm text-gray-300">Unanswered</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setShowSidebar(false);
                      setConfirmSubmit(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Test</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {confirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-college-medium max-w-md w-full rounded-xl p-6 border border-gray-700 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Submit Test?</h3>
                <p className="text-gray-300 mb-2">
                  You have answered {answeredCount} out of {questions.length} questions.
                </p>
                {answeredCount < questions.length && (
                  <p className="text-amber-500 text-sm mb-2">
                    Warning: You have {questions.length - answeredCount} unanswered questions.
                  </p>
                )}
                <p className="text-gray-400 text-sm">
                  Once submitted, you cannot return to this test.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleSubmitTest}
                  className="flex-1 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Submit Test
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-college-medium max-w-2xl w-full rounded-xl p-6 border border-gray-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Test Instructions</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2 text-college-primary">Test Details</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Title: {testDetails.title}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Duration: {testDetails.duration} minutes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Total Marks: {testDetails.total_marks}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Passing Marks: {testDetails.passing_marks}</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-college-primary">Instructions</h3>
                  <div className="text-gray-300 space-y-2">
                    <p>{testDetails.instructions}</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>You can navigate between questions using the Next and Previous buttons or the question navigator.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>You can flag questions for later review by clicking the "Flag for Review" button.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The test will automatically submit when the timer reaches zero.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Do not refresh the page or navigate away during the test.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 rounded-lg bg-college-primary text-white hover:bg-college-accent transition-colors"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Pause Modal */}
      <AnimatePresence>
        {testPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-college-medium max-w-md w-full rounded-xl p-6 border border-gray-700 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-college-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Pause className="w-12 h-12 text-college-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Test Paused</h3>
                <p className="text-gray-300 mb-4">
                  The test timer has been paused. Click the button below when you're ready to continue.
                </p>
              </div>
              
              <button
                onClick={() => setTestPaused(false)}
                className="w-full py-3 rounded-lg bg-college-primary text-white hover:bg-college-accent transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Resume Test</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
