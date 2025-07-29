'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, ArrowRight, Check, Save, AlertTriangle, Clock, Target, Plus, Minus, Eye, Code, FileText, Calculator as CalcIcon } from 'lucide-react';
import { StageNavigator } from '@/components/assignment/StageNavigator';
import { MarkdownEditor } from '@/components/assignment/MarkdownEditor';
import { QuestionList } from '@/components/assignment/QuestionList';
import { QuestionPreviewModal } from '@/components/assignment/QuestionPreviewModal';
import { QuickTips } from '@/components/assignment/QuickTips';
import { LoadingSpinner, FullscreenLoading } from '@/components/assignment/LoadingSpinner';
import { AssignmentSuccess } from '@/components/assignment/AssignmentSuccess';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  points: number;
  timeLimit?: number;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  starterCode?: string;
  testCases?: Array<{ id: string; input: string; output: string; isHidden?: boolean }>;
}

interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden?: boolean;
}

interface AssignmentFormData {
  title: string;
  description: string;
  clubId: string;
  assignmentType: 'objective' | 'coding' | 'essay' | 'mixed';
  targetAudience: 'club' | 'all_clubs' | 'specific_clubs';
  targetClubs: string[];
  dueDate: string;
  timeLimit: number;
  maxPoints: number;
  allowNavigation: boolean;
  instructions: string;
  passingScore: number;
  isProctored: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowCalculator: boolean;
  maxAttempts: number;
  showResults: boolean;
  allowReview: boolean;
}

interface Stage {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function CreateAssignment() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [clubs, setClubs] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState('basic');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [createdAssignmentId, setCreatedAssignmentId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    clubId: '',
    assignmentType: 'mixed',
    targetAudience: 'club',
    targetClubs: [],
    dueDate: '',
    timeLimit: 60,
    maxPoints: 100,
    allowNavigation: true,
    instructions: '',
    passingScore: 60,
    isProctored: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    allowCalculator: true,
    maxAttempts: 1,
    showResults: true,
    allowReview: true
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    type: 'multiple-choice',
    title: '',
    description: '',
    options: ['', ''],
    correctAnswer: 0,
    points: 1,
    timeLimit: undefined,
    tags: [],
    difficulty: 'medium',
    language: 'python',
    starterCode: '',
    testCases: []
  });

  // Stage definitions
  const stages: Stage[] = [
    {
      id: 'basic',
      title: 'Basic Info',
      description: 'Title, description, and target audience',
      completed: false
    },
    {
      id: 'settings',
      title: 'Test Settings',
      description: 'Time limits, proctoring, and behavior',
      completed: false
    },
    {
      id: 'scoring',
      title: 'Marks & Time',
      description: 'Points distribution and timing',
      completed: false
    },
    {
      id: 'questions',
      title: 'Questions',
      description: 'Add and manage questions',
      completed: false
    }
  ];

  useEffect(() => {
    const authorizedRoles = [
      'admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 
      'vice_president', 'instructor', 'teacher', 'staff', 'management'
    ];
    
    if (user && !authorizedRoles.includes(user.role)) {
      router.push('/assignments');
      showToast({ 
        title: 'Access Denied',
        message: 'You do not have permission to create assignments', 
        type: 'error' 
      });
      return;
    }
    
    if (!user) return;
    
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          setClubs(data);
          if (user.club_id) {
            setFormData(prev => ({ ...prev, clubId: user.club_id || '' }));
          }
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };
    
    fetchClubs();
  }, [user, router, showToast]);

  // Validation functions
  const validateBasicInfo = () => {
    return formData.title.trim() !== '' && 
           formData.description.trim() !== '' && 
           formData.clubId !== '' &&
           formData.dueDate !== '';
  };

  const validateSettings = () => {
    return formData.timeLimit > 0 && 
           formData.passingScore >= 0 && 
           formData.passingScore <= 100 &&
           formData.maxAttempts > 0;
  };

  const validateScoring = () => {
    return formData.maxPoints > 0;
  };

  const validateQuestions = () => {
    if (questions.length === 0) return false;
    
    const totalQuestionTime = questions.reduce((total, q) => total + (q.timeLimit || 0), 0);
    if (totalQuestionTime > formData.timeLimit) return false;
    
    return questions.every(q => 
      q.title.trim() !== '' && 
      q.description.trim() !== '' &&
      q.points > 0 &&
      (q.type !== 'multiple-choice' || 
       (q.options && q.options.length >= 2 && q.correctAnswer !== undefined))
    );
  };

  // Time validation
  const getTotalQuestionTime = () => {
    return questions.reduce((total, q) => total + (q.timeLimit || 0), 0);
  };

  const getTimeWarning = () => {
    const totalQuestionTime = getTotalQuestionTime();
    if (totalQuestionTime > formData.timeLimit) {
      const excess = totalQuestionTime - formData.timeLimit;
      return `Questions exceed assignment time limit by ${excess} minutes`;
    }
    return null;
  };

  // Question management functions
  const addQuestion = () => {
    if (!currentQuestion.title.trim() || !currentQuestion.description.trim()) {
      showToast({ 
        title: 'Validation Error',
        message: 'Question title and description are required', 
        type: 'error' 
      });
      return;
    }
    
    if (currentQuestion.type === 'multiple-choice') {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        showToast({ 
          title: 'Validation Error',
          message: 'Add at least two options for multiple choice questions', 
          type: 'error' 
        });
        return;
      }
      
      if (currentQuestion.correctAnswer === undefined) {
        showToast({ 
          title: 'Validation Error',
          message: 'Select the correct answer', 
          type: 'error' 
        });
        return;
      }
    }
    
    const totalQuestionTime = getTotalQuestionTime() + (currentQuestion.timeLimit || 0);
    if (totalQuestionTime > formData.timeLimit) {
      showToast({
        title: 'Time Limit Exceeded',
        message: `Adding this question would exceed the assignment time limit by ${totalQuestionTime - formData.timeLimit} minutes`,
        type: 'warning'
      });
      return;
    }

    const questionToAdd: Question = {
      ...currentQuestion,
      id: Date.now().toString()
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = questionToAdd;
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
      showToast({
        title: 'Success',
        message: 'Question updated successfully',
        type: 'success'
      });
    } else {
      setQuestions(prev => [...prev, questionToAdd]);
      showToast({
        title: 'Success',
        message: 'Question added successfully',
        type: 'success'
      });
    }
    
    resetCurrentQuestion();
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      id: '',
      type: 'multiple-choice',
      title: '',
      description: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1,
      timeLimit: undefined,
      tags: [],
      difficulty: 'medium',
      language: 'python',
      starterCode: '',
      testCases: []
    });
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    showToast({
      title: 'Success',
      message: 'Question deleted successfully',
      type: 'success'
    });
  };

  const previewQuestionHandler = (question: Question) => {
    setPreviewQuestion(question);
  };

  // Option management for multiple choice
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(currentQuestion.options || [])];
    updatedOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), '']
    });
  };

  const removeOption = (index: number) => {
    if ((currentQuestion.options?.length || 0) <= 2) {
      showToast({
        title: 'Cannot Remove',
        message: 'Multiple choice questions must have at least 2 options',
        type: 'warning'
      });
      return;
    }
    
    const updatedOptions = (currentQuestion.options || []).filter((_, i) => i !== index);
    setCurrentQuestion({ 
      ...currentQuestion, 
      options: updatedOptions,
      correctAnswer: typeof currentQuestion.correctAnswer === 'number' && currentQuestion.correctAnswer >= index 
        ? Math.max(0, currentQuestion.correctAnswer - 1) 
        : currentQuestion.correctAnswer
    });
  };

  // Test case management for coding questions
  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: Date.now().toString(),
      input: '',
      output: '',
      isHidden: false
    };
    setCurrentQuestion({
      ...currentQuestion,
      testCases: [...(currentQuestion.testCases || []), newTestCase]
    });
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updatedTestCases = [...(currentQuestion.testCases || [])];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, testCases: updatedTestCases });
  };

  const removeTestCase = (index: number) => {
    const updatedTestCases = (currentQuestion.testCases || []).filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, testCases: updatedTestCases });
  };

  // Navigation functions
  const goToStage = (stageId: string) => {
    setCurrentStage(stageId);
  };

  const goToNextStage = () => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex !== -1 && currentIndex < stages.length - 1) {
      setCurrentStage(stages[currentIndex + 1].id);
    }
  };

  const goToPreviousStage = () => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex > 0) {
      setCurrentStage(stages[currentIndex - 1].id);
    }
  };

  const canProceedToNext = () => {
    switch (currentStage) {
      case 'basic': return validateBasicInfo();
      case 'settings': return validateSettings();
      case 'scoring': return validateScoring();
      case 'questions': return validateQuestions();
      default: return false;
    }
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateQuestions()) {
      showToast({ 
        title: 'Validation Error',
        message: 'Please complete all questions before submitting', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        ...formData,
        questions: questions
      };

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (response.ok) {
        const result = await response.json();
        setCreatedAssignmentId(result.id);
        showToast({ 
          title: 'Success',
          message: 'Assignment created successfully', 
          type: 'success' 
        });
      } else {
        throw new Error('Failed to create assignment');
      }
    } catch (error) {
      showToast({ 
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (loading) {
    return <FullscreenLoading title="Creating Assignment..." message="Please wait while we save your assignment." />;
  }

  if (createdAssignmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 py-8">
        <div className="container mx-auto px-4">
          <AssignmentSuccess
            assignmentId={createdAssignmentId}
            assignmentTitle={formData.title}
            onViewAssignment={() => router.push(`/assignments/${createdAssignmentId}`)}
            onCreateAnother={() => window.location.reload()}
            onGoToDashboard={() => router.push('/assignments')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/assignments')}
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Assignment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Design and configure your assignment step by step
          </p>
        </div>

        {/* Stage Navigator */}
        <StageNavigator
          currentStage={currentStage}
          stages={stages.map((stage, index) => ({ 
            ...stage, 
            completed: index === 0 ? validateBasicInfo() : 
                      index === 1 ? validateSettings() : 
                      index === 2 ? validateScoring() : 
                      validateQuestions() 
          }))}
          onStageChange={goToStage}
        />

        {/* Time Warning */}
        {getTimeWarning() && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3" />
            <span className="text-amber-700 dark:text-amber-300">{getTimeWarning()}</span>
          </div>
        )}

        {/* Quick Tips */}
        <QuickTips currentStage={currentStage} className="mb-6" />

        {/* Stage Content */}
        <div className="space-y-6">
          {/* Basic Information Stage */}
          {currentStage === 'basic' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter assignment title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignment Type
                    </label>
                    <select
                      value={formData.assignmentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="mixed">Mixed (All Types)</option>
                      <option value="objective">Objective (MCQ/True-False)</option>
                      <option value="coding">Coding Challenge</option>
                      <option value="essay">Essay/Subjective</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <MarkdownEditor
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Describe your assignment objectives, requirements, and any special instructions..."
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="club">My Club Only</option>
                      <option value="all_clubs">All Clubs</option>
                      <option value="specific_clubs">Specific Clubs</option>
                    </select>
                  </div>

                  {formData.targetAudience === 'club' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Club *
                      </label>
                      <select
                        value={formData.clubId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clubId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Club</option>
                        {clubs.map(club => (
                          <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Settings Stage */}
          {currentStage === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Test Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Limit (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Navigation & Behavior
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowNavigation}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowNavigation: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Allow navigation between questions
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.shuffleQuestions}
                          onChange={(e) => setFormData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Shuffle question order
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.shuffleOptions}
                          onChange={(e) => setFormData(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Shuffle answer options
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowCalculator}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowCalculator: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Allow calculator access
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Security & Proctoring
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isProctored}
                          onChange={(e) => setFormData(prev => ({ ...prev, isProctored: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Enable proctoring (tab switch detection)
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.showResults}
                          onChange={(e) => setFormData(prev => ({ ...prev, showResults: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Show results after submission
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowReview}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowReview: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">
                          Allow answer review after submission
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions for Students
                  </label>
                  <MarkdownEditor
                    value={formData.instructions}
                    onChange={(value) => setFormData(prev => ({ ...prev, instructions: value }))}
                    placeholder="Provide detailed instructions for students on how to take the test..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Marks & Time Stage */}
          {currentStage === 'scoring' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Marks & Time Distribution
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                      Total Points
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {questions.reduce((total, q) => total + q.points, 0)} / {formData.maxPoints}
                  </div>
                  <input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                      Time Used
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {getTotalQuestionTime()} / {formData.timeLimit}m
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400">
                    {formData.timeLimit - getTotalQuestionTime()} minutes available
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <Check className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">
                      Pass Criteria
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formData.passingScore}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">
                    {Math.ceil((formData.passingScore / 100) * formData.maxPoints)} points to pass
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions Stage */}
          {currentStage === 'questions' && (
            <div className="space-y-6">
              {/* Add Question Form */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Type
                      </label>
                      <select
                        value={currentQuestion.type}
                        onChange={(e) => setCurrentQuestion(prev => ({ 
                          ...prev, 
                          type: e.target.value as any,
                          options: e.target.value === 'multiple-choice' ? ['', ''] : undefined,
                          correctAnswer: e.target.value === 'multiple-choice' ? 0 : undefined
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="essay">Essay</option>
                        <option value="coding">Coding</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Title *
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.title}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter question title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Description *
                    </label>
                    <MarkdownEditor
                      value={currentQuestion.description}
                      onChange={(value) => setCurrentQuestion(prev => ({ ...prev, description: value }))}
                      placeholder="Write your question here. You can use markdown formatting..."
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  {currentQuestion.type === 'multiple-choice' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Answer Options
                        </label>
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(currentQuestion.options || []).map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="correct-answer"
                              checked={currentQuestion.correctAnswer === index}
                              onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1 flex items-center space-x-2">
                              <span className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              />
                              {(currentQuestion.options?.length || 0) > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True/False */}
                  {currentQuestion.type === 'true-false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Correct Answer
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="true-false-answer"
                            checked={currentQuestion.correctAnswer === true}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: true }))}
                            className="w-4 h-4 text-green-600 mr-2"
                          />
                          <span className="text-green-600 dark:text-green-400 font-medium">True</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="true-false-answer"
                            checked={currentQuestion.correctAnswer === false}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: false }))}
                            className="w-4 h-4 text-red-600 mr-2"
                          />
                          <span className="text-red-600 dark:text-red-400 font-medium">False</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Coding Question */}
                  {currentQuestion.type === 'coding' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Programming Language
                          </label>
                          <select
                            value={currentQuestion.language}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="javascript">JavaScript</option>
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time Limit (minutes)
                          </label>
                          <input
                            type="number"
                            value={currentQuestion.timeLimit || ''}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Optional"
                            min="1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Starter Code (Optional)
                        </label>
                        <textarea
                          value={currentQuestion.starterCode}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, starterCode: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                          rows={6}
                          placeholder="// Provide starter code template for students..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Test Cases
                          </label>
                          <button
                            type="button"
                            onClick={addTestCase}
                            className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Test Case
                          </button>
                        </div>

                        <div className="space-y-4">
                          {(currentQuestion.testCases || []).map((testCase, index) => (
                            <div key={testCase.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Test Case {index + 1}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={testCase.isHidden}
                                      onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Hidden</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeTestCase(index)}
                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Input
                                  </label>
                                  <textarea
                                    value={testCase.input}
                                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Expected Output
                                  </label>
                                  <textarea
                                    value={testCase.output}
                                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    {editingQuestionIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionIndex(null);
                          resetCurrentQuestion();
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                    )}
                    
                    <div className="flex space-x-3 ml-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion(currentQuestion)}
                        className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </button>
                      
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <QuestionList
                  questions={questions}
                  onEditQuestion={editQuestion}
                  onDeleteQuestion={deleteQuestion}
                />
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8">
            <button
              onClick={goToPreviousStage}
              disabled={currentStage === 'basic'}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                currentStage === 'basic'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {currentStage === 'questions' ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext()}
                  className={`flex items-center px-8 py-3 rounded-xl font-medium transition-colors ${
                    canProceedToNext()
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Assignment
                </button>
              ) : (
                <button
                  onClick={goToNextStage}
                  disabled={!canProceedToNext()}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                    canProceedToNext()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
}
