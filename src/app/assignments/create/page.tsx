'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Clock, Target, Plus, Minus, Eye, Code, FileText, Calculator as CalcIcon, X, Upload, Image } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  type: 'multiple-choice' | 'multi-select' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'integer';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean | number[];
  points: number;
  timeLimit?: number;
  timeAllocation?: number;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  allowedLanguages?: string[];
  allowAnyLanguage?: boolean;
  starterCode?: string;
  testCases?: Array<{ id: string; input: string; output: string; isHidden?: boolean }>;
  explanation?: string;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  // New fields for enhanced question types
  problemStatement?: string;
  problemDescription?: string;
  questionImage?: string;
  hasImage?: boolean;
  unit?: string;
  precision?: number;
  acceptableRange?: number;
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
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFaceVerification: boolean;
  requireFullscreen: boolean;
  autoSubmitOnViolation: boolean;
  maxViolations: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowCalculator: boolean;
  maxAttempts: number;
  showResults: boolean;
  allowReview: boolean;
}

export default function CreateAssignment() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [clubs, setClubs] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState('basic');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
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
    isProctored: false,
    requireCamera: false,
    requireMicrophone: false,
    requireFaceVerification: false,
    requireFullscreen: false,
    autoSubmitOnViolation: false,
    maxViolations: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    allowCalculator: true,
    maxAttempts: 1,
    showResults: true,
    allowReview: true
  });

  // Check authorization and fetch clubs
  useEffect(() => {
    if (!user) return;

    const authorizedRoles = [
      'admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 
      'vice_president', 'instructor', 'teacher', 'staff', 'management'
    ];
    
    if (!authorizedRoles.includes(user.role)) {
      router.push('/assignments');
      showToast({ 
        title: 'Access Denied',
        message: 'You do not have permission to create assignments', 
        type: 'error' 
      });
      return;
    }
    
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          setClubs(data);
          if (user.club_id && formData.targetAudience === 'club') {
            setFormData(prev => ({ ...prev, clubId: user.club_id || '' }));
          }
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };
    
    fetchClubs();
  }, [user, router, showToast, formData.targetAudience]);

  // Handle ZEN Assistant generated data
  useEffect(() => {
    const zenData = searchParams.get('zenData');
    if (zenData) {
      try {
        const generatedAssignment = JSON.parse(decodeURIComponent(zenData));
        
        // Update form data with generated assignment
        setFormData(prev => ({
          ...prev,
          title: generatedAssignment.title || '',
          description: generatedAssignment.description || '',
          timeLimit: generatedAssignment.timeLimit || 60,
          maxPoints: generatedAssignment.totalPoints || 100,
          allowNavigation: !generatedAssignment.shuffleQuestions
        }));

        // Convert and set questions
        if (generatedAssignment.questions && Array.isArray(generatedAssignment.questions)) {
          const convertedQuestions = generatedAssignment.questions.map((q: any, index: number) => ({
            id: `zen_question_${index + 1}`,
            type: q.type || 'multiple-choice',
            title: q.title || '',
            description: q.description || '',
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            points: q.points || 5,
            difficulty: q.difficulty || 'medium'
          }));
          setQuestions(convertedQuestions);
        }

        // Navigate to questions stage to review generated questions
        setCurrentStage('questions');

        showToast({
          type: 'success',
          title: 'ZEN Assignment Loaded!',
          message: 'Your AI-generated assignment is ready for review. Modify as needed before publishing.'
        });

        // Clean up URL
        router.replace('/assignments/create', { scroll: false });
      } catch (error) {
        console.error('Error parsing ZEN data:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load generated assignment data'
        });
      }
    }
  }, [searchParams, router, showToast]);

  const stages = [
    { id: 'basic', title: 'Basic Info', description: 'Title, description, and target audience' },
    { id: 'settings', title: 'Test Settings', description: 'Time limits, proctoring, and behavior' },
    { id: 'scoring', title: 'Marks & Time', description: 'Points distribution and timing' },
    { id: 'questions', title: 'Questions', description: 'Add and manage questions' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate questions exist
    if (questions.length === 0) {
      showToast({
        title: 'Error',
        message: 'Please add at least one question to the assignment',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Prepare assignment data
      const assignmentData = {
        ...formData,
        questions: questions.map(q => ({
          ...q,
          // Ensure options and test cases are properly formatted
          options: q.options || [],
          testCases: q.testCases || [],
          correctAnswer: q.correctAnswer
        })),
        startDate: new Date().toISOString(),
        maxPoints: questions.reduce((total, q) => total + (q.points || 0), 0)
      };

      console.log('Submitting assignment:', assignmentData);

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create assignment');
      }

      showToast({
        title: 'Success',
        message: 'Assignment created successfully!',
        type: 'success'
      });
      
      // Redirect to the created assignment page
      router.push(`/assignments/${result.id}`);
    } catch (error) {
      console.error('Assignment creation error:', error);
      showToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create assignment',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStage = (stageId: string): boolean => {
    switch (stageId) {
      case 'basic':
        return formData.title.trim() !== '' && formData.description.trim() !== '' && formData.clubId !== '';
      case 'settings':
        return formData.timeLimit > 0 && formData.maxAttempts > 0;
      case 'scoring':
        return formData.maxPoints > 0 && formData.passingScore >= 0 && formData.passingScore <= 100;
      case 'questions':
        return questions.length > 0;
      default:
        return true;
    }
  };

  const canNavigateToStage = (targetStageId: string): boolean => {
    const stages = ['basic', 'settings', 'scoring', 'questions'];
    const currentIndex = stages.indexOf(currentStage);
    const targetIndex = stages.indexOf(targetStageId);
    
    // Allow navigation to previous stages or current stage
    if (targetIndex <= currentIndex) {
      return true;
    }
    
    // For forward navigation, validate all previous stages
    for (let i = 0; i < targetIndex; i++) {
      if (!validateStage(stages[i])) {
        return false;
      }
    }
    
    return true;
  };

  const goToStage = (stageId: string) => {
    if (!canNavigateToStage(stageId)) {
      const stageNames = {
        'basic': 'Basic Info',
        'settings': 'Test Settings', 
        'scoring': 'Marks & Time',
        'questions': 'Questions'
      };
      
      showToast({
        title: 'Complete Previous Stages',
        message: `Please complete all required fields in previous stages before proceeding to ${stageNames[stageId as keyof typeof stageNames]}.`,
        type: 'warning'
      });
      return;
    }
    setCurrentStage(stageId);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: '',
      type: 'multiple-choice',
      title: '',
      description: '',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 0,
      points: 1,
      difficulty: 'medium',
      problemStatement: '',
      problemDescription: '',
      questionImage: '',
      hasImage: false,
      unit: '',
      precision: 2,
      acceptableRange: 0,
      allowedLanguages: ['python', 'javascript', 'java', 'cpp'],
      testCases: []
    };
    setEditingQuestion(newQuestion);
    setShowQuestionModal(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    showToast({
      title: 'Question Deleted',
      message: 'Question has been removed from the assignment',
      type: 'success'
    });
  };

  const saveQuestion = () => {
    if (!editingQuestion || !editingQuestion.title.trim()) {
      showToast({
        title: 'Error',
        message: 'Question title is required',
        type: 'error'
      });
      return;
    }

    const questionToSave = {
      ...editingQuestion,
      id: editingQuestion.id || `question_${Date.now()}`
    };

    const existingIndex = questions.findIndex(q => q.id === questionToSave.id);
    if (existingIndex >= 0) {
      // Update existing question
      setQuestions(prev => prev.map((q, index) => 
        index === existingIndex ? questionToSave : q
      ));
      showToast({
        title: 'Question Updated',
        message: 'Question has been updated successfully',
        type: 'success'
      });
    } else {
      // Add new question
      setQuestions(prev => [...prev, questionToSave]);
      showToast({
        title: 'Question Added',
        message: 'Question has been added to the assignment',
        type: 'success'
      });
    }
    
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-purple-300 mb-3">
          <FileText className="h-4 w-4 inline mr-2" />
          Assignment Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
          placeholder="Enter assignment title..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-300 mb-3">
          <FileText className="h-4 w-4 inline mr-2" />
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all resize-none h-32"
          placeholder="Describe the assignment objectives and requirements..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-300 mb-3">
          <Clock className="h-4 w-4 inline mr-2" />
          Due Date
        </label>
        <input
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-300 mb-3">
          Assignment Type
        </label>
        <select
          value={formData.assignmentType}
          onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value as any }))}
          className="w-full bg-card border border-custom text-primary rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
        >
          <option value="mixed">Mixed Questions</option>
          <option value="objective">Objective Only</option>
          <option value="coding">Coding Only</option>
          <option value="essay">Essay Only</option>
        </select>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-3">
            <Clock className="h-4 w-4 inline mr-2" />
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={formData.timeLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
            className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-3">
            <Target className="h-4 w-4 inline mr-2" />
            Max Attempts
          </label>
          <input
            type="number"
            value={formData.maxAttempts}
            onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))}
            className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
            min="1"
            max="10"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-300">Test Behavior</h3>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.allowNavigation}
            onChange={(e) => setFormData(prev => ({ ...prev, allowNavigation: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Allow navigation between questions</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.allowCalculator}
            onChange={(e) => setFormData(prev => ({ ...prev, allowCalculator: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Allow calculator access</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.shuffleQuestions}
            onChange={(e) => setFormData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Shuffle question order</span>
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-300">Proctoring Settings</h3>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.isProctored}
            onChange={(e) => setFormData(prev => ({ ...prev, isProctored: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Enable proctoring features</span>
        </label>

        {formData.isProctored && (
          <div className="ml-8 space-y-3 p-4 bg-section border border-custom rounded-xl">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.requireCamera}
                onChange={(e) => setFormData(prev => ({ ...prev, requireCamera: e.target.checked }))}
                className="w-4 h-4 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
              />
              <span className="text-secondary text-sm">Require camera access</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.requireFullscreen}
                onChange={(e) => setFormData(prev => ({ ...prev, requireFullscreen: e.target.checked }))}
                className="w-4 h-4 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
              />
              <span className="text-secondary text-sm">Force fullscreen mode</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  const renderScoring = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-3">
            <Target className="h-4 w-4 inline mr-2" />
            Maximum Points
          </label>
          <input
            type="number"
            value={formData.maxPoints}
            onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
            className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-3">
            Passing Score (%)
          </label>
          <input
            type="number"
            value={formData.passingScore}
            onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 60 }))}
            className="w-full bg-card border border-custom text-primary placeholder:text-muted rounded-xl p-4 focus:border-custom focus:ring focus:ring-primary-brand/20 transition-all"
            min="0"
            max="100"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-300">Results & Review</h3>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.showResults}
            onChange={(e) => setFormData(prev => ({ ...prev, showResults: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Show results immediately after submission</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.allowReview}
            onChange={(e) => setFormData(prev => ({ ...prev, allowReview: e.target.checked }))}
            className="w-5 h-5 text-accent bg-card border-custom rounded focus:ring-primary-brand transition-all"
          />
          <span className="text-primary">Allow students to review their answers</span>
        </label>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-purple-300 mb-4">Questions Management</h3>
        <p className="text-muted mb-6">Add and configure questions for your assignment</p>
        
        <button 
          onClick={addQuestion}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-primary rounded-xl font-semibold shadow-lg transition-all"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Add Question
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-card border border-custom rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-primary font-semibold">{question.title || `Question ${index + 1}`}</h4>
                  <p className="text-muted text-sm">{question.type} • {question.points} points</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => editQuestion(question)}
                    className="p-2 text-accent hover:text-primary transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteQuestion(question.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-secondary text-sm">{question.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No questions added yet. Click "Add Question" to get started.</p>
        </div>
      )}
    </div>
  );

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'basic': return renderBasicInfo();
      case 'settings': return renderSettings();
      case 'scoring': return renderScoring();
      case 'questions': return renderQuestions();
      default: return renderBasicInfo();
    }
  };

  return (
    <div className="min-h-screen bg-main flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-6xl bg-card rounded-3xl shadow-2xl border border-custom backdrop-blur-xl p-8 md:p-12 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <FileText className="text-primary w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
              Create Assignment
            </h1>
          </div>
          <Link
            href="/assignments"
            className="flex items-center text-secondary hover:text-primary transition-colors px-4 py-2 rounded-xl bg-main border border-custom"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Assignments
          </Link>
        </div>

        {/* Stage Navigator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex-1 flex flex-col items-center">
                <button
                  onClick={() => goToStage(stage.id)}
                  disabled={!canNavigateToStage(stage.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 font-bold text-lg transition-all ${
                    currentStage === stage.id 
                      ? 'border-accent bg-accent text-white shadow-lg' 
                      : canNavigateToStage(stage.id)
                        ? 'border-custom bg-card text-secondary hover:border-accent hover:bg-hover cursor-pointer'
                        : 'border-custom bg-section text-muted cursor-not-allowed opacity-50'
                  }`}
                >
                  {idx + 1}
                </button>
                <span className="text-xs font-medium text-secondary uppercase tracking-wider text-center">
                  {stage.title}
                </span>
                {idx < stages.length - 1 && (
                  <div className={`h-1 w-full mt-2 ${
                    currentStage === stage.id || stages.findIndex(s => s.id === currentStage) > idx
                      ? 'bg-gradient-to-r from-accent to-primary-brand'
                      : 'bg-section'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-custom p-8 md:p-10 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary-brand bg-clip-text text-transparent mb-2">
              {stages.find(s => s.id === currentStage)?.title}
            </h2>
            <p className="text-secondary">
              {stages.find(s => s.id === currentStage)?.description}
            </p>
          </div>

          {renderCurrentStage()}
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              const currentIndex = stages.findIndex(s => s.id === currentStage);
              if (currentIndex > 0) {
                goToStage(stages[currentIndex - 1].id);
              }
            }}
            disabled={stages.findIndex(s => s.id === currentStage) === 0}
            className="flex items-center px-6 py-3 rounded-xl zenith-bg-section border zenith-border zenith-text-secondary hover:zenith-bg-hover hover:zenith-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex space-x-4">
            {stages.findIndex(s => s.id === currentStage) === stages.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !validateStage(currentStage)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 inline mr-2" />
                    Publish Assignment
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const currentIndex = stages.findIndex(s => s.id === currentStage);
                  if (currentIndex < stages.length - 1 && validateStage(currentStage)) {
                    goToStage(stages[currentIndex + 1].id);
                  } else if (!validateStage(currentStage)) {
                    showToast({
                      title: 'Complete Required Fields',
                      message: 'Please fill in all required fields before proceeding to the next stage.',
                      type: 'warning'
                    });
                  }
                }}
                disabled={!validateStage(currentStage)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-primary">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h3>
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Question Type
                </label>
                <select
                  value={editingQuestion?.type || 'multiple-choice'}
                  onChange={(e) => {
                    const newType = e.target.value as Question['type'];
                    if (editingQuestion) {
                      setEditingQuestion({
                        ...editingQuestion,
                        type: newType,
                        options: newType === 'multiple-choice' || newType === 'multi-select' ? ['Option 1', 'Option 2'] : undefined
                      });
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary focus:border-purple-500 focus:outline-none"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="multi-select">Multi Select</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                  <option value="essay">Essay</option>
                  <option value="coding">Coding Problem</option>
                  <option value="integer">Numerical Answer</option>
                </select>
              </div>

              {/* Common Question Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Question Title *
                </label>
                <input
                  type="text"
                  value={editingQuestion?.title || ''}
                  onChange={(e) => {
                    if (editingQuestion) {
                      setEditingQuestion({
                        ...editingQuestion,
                        title: e.target.value
                      });
                    }
                  }}
                  placeholder="Enter question title"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Question Image Upload (for multiple choice and numerical) */}
              {(editingQuestion?.type === 'multiple-choice' || editingQuestion?.type === 'multi-select' || editingQuestion?.type === 'integer') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-slate-400">Click to upload image or drag and drop</p>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        // Handle image upload
                        const file = e.target.files?.[0];
                        if (file && editingQuestion) {
                          // In a real app, you'd upload to a server and get URL
                          const imageUrl = URL.createObjectURL(file);
                          setEditingQuestion({
                            ...editingQuestion,
                            questionImage: imageUrl,
                            hasImage: true
                          });
                        }
                      }}
                    />
                  </div>
                  {editingQuestion?.hasImage && editingQuestion.questionImage && (
                    <div className="mt-2">
                      <img 
                        src={editingQuestion.questionImage} 
                        alt="Question" 
                        className="max-h-32 rounded-lg border border-slate-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CODING QUESTION SPECIFIC FIELDS */}
              {editingQuestion?.type === 'coding' && (
                <>
                  {/* Problem Statement */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Problem Statement *
                    </label>
                    <input
                      type="text"
                      value={editingQuestion?.problemStatement || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion,
                            problemStatement: e.target.value
                          });
                        }
                      }}
                      placeholder="e.g., Two Sum, Binary Search, etc."
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Problem Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Problem Description *
                    </label>
                    <textarea
                      value={editingQuestion?.problemDescription || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion,
                            problemDescription: e.target.value
                          });
                        }
                      }}
                      placeholder="Detailed description of the problem including constraints, examples, etc. You can use LaTeX for math equations: $x^2 + y^2 = z^2$"
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Supports LaTeX math equations with $ delimiters
                    </p>
                  </div>

                  {/* Allowed Languages */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Allowed Programming Languages
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['python', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 'rust'].map((lang) => (
                        <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingQuestion?.allowedLanguages?.includes(lang) || false}
                            onChange={(e) => {
                              if (editingQuestion) {
                                const languages = editingQuestion.allowedLanguages || [];
                                const updatedLanguages = e.target.checked
                                  ? [...languages, lang]
                                  : languages.filter(l => l !== lang);
                                setEditingQuestion({
                                  ...editingQuestion,
                                  allowedLanguages: updatedLanguages
                                });
                              }
                            }}
                            className="rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-slate-300 capitalize">{lang === 'cpp' ? 'C++' : lang === 'csharp' ? 'C#' : lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Test Cases */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Test Cases
                    </label>
                    <div className="space-y-4">
                      {editingQuestion?.testCases?.map((testCase, index) => (
                        <div key={index} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-slate-300">Test Case {index + 1}</h4>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={testCase.isHidden || false}
                                  onChange={(e) => {
                                    if (editingQuestion?.testCases) {
                                      const updatedTestCases = [...editingQuestion.testCases];
                                      updatedTestCases[index] = {
                                        ...updatedTestCases[index],
                                        isHidden: e.target.checked
                                      };
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        testCases: updatedTestCases
                                      });
                                    }
                                  }}
                                  className="rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                                />
                                <span className="text-xs text-slate-400">Hidden</span>
                              </label>
                              <button
                                onClick={() => {
                                  if (editingQuestion?.testCases) {
                                    const updatedTestCases = editingQuestion.testCases.filter((_, i) => i !== index);
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      testCases: updatedTestCases
                                    });
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Input</label>
                              <textarea
                                value={testCase.input}
                                onChange={(e) => {
                                  if (editingQuestion?.testCases) {
                                    const updatedTestCases = [...editingQuestion.testCases];
                                    updatedTestCases[index] = {
                                      ...updatedTestCases[index],
                                      input: e.target.value
                                    };
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      testCases: updatedTestCases
                                    });
                                  }
                                }}
                                placeholder="Input data"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-primary placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Expected Output</label>
                              <textarea
                                value={testCase.output}
                                onChange={(e) => {
                                  if (editingQuestion?.testCases) {
                                    const updatedTestCases = [...editingQuestion.testCases];
                                    updatedTestCases[index] = {
                                      ...updatedTestCases[index],
                                      output: e.target.value
                                    };
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      testCases: updatedTestCases
                                    });
                                  }
                                }}
                                placeholder="Expected output"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-primary placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          if (editingQuestion) {
                            const newTestCase = {
                              id: `test_${Date.now()}`,
                              input: '',
                              output: '',
                              isHidden: false
                            };
                            setEditingQuestion({
                              ...editingQuestion,
                              testCases: [...(editingQuestion.testCases || []), newTestCase]
                            });
                          }
                        }}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Test Case
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* MULTIPLE CHOICE / MULTI-SELECT SPECIFIC FIELDS */}
              {(editingQuestion?.type === 'multiple-choice' || editingQuestion?.type === 'multi-select') && (
                <>
                  {/* Question Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Question Description
                    </label>
                    <textarea
                      value={editingQuestion?.description || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion,
                            description: e.target.value
                          });
                        }
                      }}
                      placeholder="Enter question description or instructions"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Answer Options */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-3">
                      {editingQuestion?.options?.map((option, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center text-xs text-slate-400 font-medium">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <input
                              type={editingQuestion.type === 'multiple-choice' ? 'radio' : 'checkbox'}
                              name="correctAnswer"
                              checked={
                                editingQuestion.type === 'multiple-choice' 
                                  ? editingQuestion.correctAnswer === index
                                  : Array.isArray(editingQuestion.correctAnswer) && editingQuestion.correctAnswer.includes(index)
                              }
                              onChange={(e) => {
                                if (editingQuestion) {
                                  if (editingQuestion.type === 'multiple-choice') {
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      correctAnswer: index
                                    });
                                  } else {
                                    const currentAnswers = Array.isArray(editingQuestion.correctAnswer) 
                                      ? editingQuestion.correctAnswer 
                                      : [];
                                    const updatedAnswers = e.target.checked
                                      ? [...currentAnswers, index]
                                      : currentAnswers.filter(i => i !== index);
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      correctAnswer: updatedAnswers
                                    });
                                  }
                                }
                              }}
                              className="text-green-500 focus:ring-green-500"
                            />
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              if (editingQuestion?.options) {
                                const newOptions = [...editingQuestion.options];
                                newOptions[index] = e.target.value;
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: newOptions
                                });
                              }
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (editingQuestion?.options && editingQuestion.options.length > 2) {
                                const newOptions = editingQuestion.options.filter((_, i) => i !== index);
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: newOptions
                                });
                              }
                            }}
                            className="px-3 py-3 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          if (editingQuestion?.options) {
                            setEditingQuestion({
                              ...editingQuestion,
                              options: [...editingQuestion.options, `Option ${String.fromCharCode(65 + editingQuestion.options.length)}`]
                            });
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* NUMERICAL QUESTION SPECIFIC FIELDS */}
              {editingQuestion?.type === 'integer' && (
                <>
                  {/* Question Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Question Description
                    </label>
                    <textarea
                      value={editingQuestion?.description || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion,
                            description: e.target.value
                          });
                        }
                      }}
                      placeholder="Enter question description, formula, or calculation details"
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Numerical Answer Configuration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Correct Answer *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingQuestion?.correctAnswer as number || ''}
                        onChange={(e) => {
                          if (editingQuestion) {
                            setEditingQuestion({
                              ...editingQuestion,
                              correctAnswer: parseFloat(e.target.value) || 0
                            });
                          }
                        }}
                        placeholder="Enter correct answer"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none font-mono text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Unit (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingQuestion?.unit || ''}
                        onChange={(e) => {
                          if (editingQuestion) {
                            setEditingQuestion({
                              ...editingQuestion,
                              unit: e.target.value
                            });
                          }
                        }}
                        placeholder="e.g., kg, m/s, °C"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Precision and Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Decimal Precision
                      </label>
                      <select
                        value={editingQuestion?.precision || 2}
                        onChange={(e) => {
                          if (editingQuestion) {
                            setEditingQuestion({
                              ...editingQuestion,
                              precision: parseInt(e.target.value)
                            });
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary focus:border-purple-500 focus:outline-none"
                      >
                        <option value={0}>Integer (0 decimals)</option>
                        <option value={1}>1 decimal place</option>
                        <option value={2}>2 decimal places</option>
                        <option value={3}>3 decimal places</option>
                        <option value={4}>4 decimal places</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Acceptable Range (±)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingQuestion?.acceptableRange || 0}
                        onChange={(e) => {
                          if (editingQuestion) {
                            setEditingQuestion({
                              ...editingQuestion,
                              acceptableRange: parseFloat(e.target.value) || 0
                            });
                          }
                        }}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TRUE/FALSE SPECIFIC FIELDS */}
              {editingQuestion?.type === 'true-false' && (
                <>
                  {/* Question Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Question Description
                    </label>
                    <textarea
                      value={editingQuestion?.description || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion,
                            description: e.target.value
                          });
                        }
                      }}
                      placeholder="Enter the statement to be evaluated as true or false"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* True/False Answer */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Correct Answer
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          value="true"
                          checked={editingQuestion?.correctAnswer === true}
                          onChange={(e) => {
                            if (editingQuestion) {
                              setEditingQuestion({
                                ...editingQuestion,
                                correctAnswer: true
                              });
                            }
                          }}
                          className="text-green-500 focus:ring-green-500"
                        />
                        <span className="text-primary font-medium">True</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          value="false"
                          checked={editingQuestion?.correctAnswer === false}
                          onChange={(e) => {
                            if (editingQuestion) {
                              setEditingQuestion({
                                ...editingQuestion,
                                correctAnswer: false
                              });
                            }
                          }}
                          className="text-red-500 focus:ring-red-500"
                        />
                        <span className="text-primary font-medium">False</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* SHORT ANSWER / ESSAY SPECIFIC FIELDS */}
              {(editingQuestion?.type === 'short-answer' || editingQuestion?.type === 'essay') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question Description
                  </label>
                  <textarea
                    value={editingQuestion?.description || ''}
                    onChange={(e) => {
                      if (editingQuestion) {
                        setEditingQuestion({
                          ...editingQuestion,
                          description: e.target.value
                        });
                      }
                    }}
                    placeholder={editingQuestion?.type === 'essay' 
                      ? "Enter the essay prompt or question details" 
                      : "Enter the question that requires a short text answer"
                    }
                    rows={editingQuestion?.type === 'essay' ? 5 : 3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Common Fields for All Question Types */}
              <div className="grid grid-cols-2 gap-4">
                {/* Points */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={editingQuestion?.points || 1}
                    onChange={(e) => {
                      if (editingQuestion) {
                        setEditingQuestion({
                          ...editingQuestion,
                          points: parseInt(e.target.value) || 1
                        });
                      }
                    }}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={editingQuestion?.difficulty || 'medium'}
                    onChange={(e) => {
                      if (editingQuestion) {
                        setEditingQuestion({
                          ...editingQuestion,
                          difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                        });
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-primary focus:border-purple-500 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700/50 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-primary font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestion}
                disabled={!editingQuestion?.title?.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-primary font-semibold transition-all"
              >
                {editingQuestion?.id ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
