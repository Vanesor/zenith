'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  type: 'multiple-choice' | 'multi-select' | 'true-false' | 'short-answer' | 'essay' | 'coding' | 'integer';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean | number[]; // Support array for multi-select
  points: number;
  timeLimit?: number;
  timeAllocation?: number; // Time allocated for this specific question in seconds
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string; // For coding questions - if specified, user must use this language
  allowedLanguages?: string[]; // For coding questions - if specified, user can choose from these
  allowAnyLanguage?: boolean; // If true, user can choose any supported language
  starterCode?: string;
  testCases?: Array<{ id: string; input: string; output: string; isHidden?: boolean }>;
  explanation?: string; // Explanation of the answer for feedback
  // For integer type questions
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
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
  const [isDistributed, setIsDistributed] = useState(false);
  const clubsFetched = useRef(false);

  // Add logging for loading state changes
  useEffect(() => {
    console.log('Loading state changed to:', loading);
  }, [loading]);

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

  // Effect to update question type when assignment type changes
  useEffect(() => {
    if (formData.assignmentType !== 'mixed') {
      let questionType: Question['type'] = 'multiple-choice';
      let questionOptions: string[] | undefined = ['', ''];
      let correctAnswer: string | number | boolean | undefined = 0;

      switch (formData.assignmentType) {
        case 'objective':
          questionType = 'multiple-choice';
          questionOptions = ['', ''];
          correctAnswer = 0;
          break;
        case 'coding':
          questionType = 'coding';
          questionOptions = undefined;
          correctAnswer = undefined;
          break;
        case 'essay':
          questionType = 'essay';
          questionOptions = undefined;
          correctAnswer = undefined;
          break;
      }

      setCurrentQuestion(prev => ({
        ...prev,
        type: questionType,
        options: questionOptions,
        correctAnswer: correctAnswer
      }));
    }
  }, [formData.assignmentType]);

  // Effect to check authorization and fetch clubs
  useEffect(() => {
    console.log('useEffect triggered - user:', user, 'clubsFetched:', clubsFetched.current);
    if (!user || clubsFetched.current) return;

    const authorizedRoles = [
      'admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 
      'vice_president', 'instructor', 'teacher', 'staff', 'management'
    ];
    
    console.log('User role:', user.role, 'Authorized:', authorizedRoles.includes(user.role));
    
    if (!authorizedRoles.includes(user.role)) {
      console.log('User not authorized, redirecting...');
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
        console.log('Fetching clubs...');
        clubsFetched.current = true;
        const response = await fetch('/api/clubs');
        console.log('Clubs API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Clubs data received:', data);
          setClubs(data);
          if (user.club_id) {
            console.log('Setting user club_id:', user.club_id);
            // If targetAudience is 'club', set the clubId to the user's club
            if (formData.targetAudience === 'club') {
              setFormData(prev => ({ 
                ...prev, 
                clubId: user.club_id || '' 
              }));
            }
          }
        } else {
          console.error('Failed to fetch clubs, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        clubsFetched.current = false; // Reset on error to allow retry
      }
    };
    
    fetchClubs();
  }, [user, router, showToast]);

  // Validation functions
  const validateBasicInfo = () => {
    const isBasicValid = formData.title.trim() !== '' && 
           formData.description.trim() !== '' && 
           formData.dueDate !== '';
    
    if (!isBasicValid) return false;
    
    // Additional validation for specific clubs
    if (formData.targetAudience === 'specific_clubs') {
      return formData.targetClubs.length > 0;
    }
    
    // For club assignments, need clubId
    if (formData.targetAudience === 'club') {
      return formData.clubId !== '';
    }
    
    return true;
  };

  const validateSettings = () => {
    return formData.timeLimit > 0 && 
           formData.passingScore >= 0 && 
           formData.passingScore <= 100 &&
           formData.maxAttempts > 0;
  };

  // Modified to not show toast during validation - will show toast only on submit
  const validateQuestionsAndPoints = (showMessages = false, enforceTimeLimit = true) => {
    console.log('validateQuestionsAndPoints - questions count:', questions.length);
    console.log('validateQuestionsAndPoints - questions:', questions);
    
    if (questions.length === 0) {
      console.log('Validation failed: No questions');
      if (showMessages) {
        showToast({
          title: 'No Questions',
          message: 'Please add at least one question to the assignment',
          type: 'error'
        });
      }
      return false;
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    console.log('Total points:', totalPoints);
    
    if (totalPoints <= 0) {
      console.log('Validation failed: Invalid points');
      if (showMessages) {
        showToast({
          title: 'Invalid Points',
          message: 'Total points must be greater than 0',
          type: 'error'
        });
      }
      return false;
    }
    
    if (totalPoints > formData.maxPoints) {
      console.log('Validation failed: Points exceed maximum');
      if (showMessages) {
        showToast({
          title: 'Points Exceed Maximum',
          message: `Total question points (${totalPoints}) exceed the assignment max points (${formData.maxPoints})`,
          type: 'error'
        });
      }
      return false;
    }

    const totalTime = questions.reduce((sum, q) => sum + (q.timeAllocation || 0), 0);
    const timeLimitSeconds = formData.timeLimit * 60;
    console.log('Total time:', totalTime, 'Time limit:', timeLimitSeconds);
    
    if (totalTime > timeLimitSeconds) {
      console.log('Time allocation warning: Time exceeds limit');
      
      if (showMessages) {
        // Convert excess time to minutes and seconds for better readability
        const excessSeconds = totalTime - timeLimitSeconds;
        const excessMinutes = Math.floor(excessSeconds / 60);
        const excessRemainingSeconds = excessSeconds % 60;
        const excessTimeFormatted = excessMinutes > 0 
          ? `${excessMinutes}m ${excessRemainingSeconds}s`
          : `${excessRemainingSeconds}s`;
        
        if (enforceTimeLimit) {
          showToast({
            title: 'Time Allocation Error',
            message: `Total question time exceeds assignment time limit by ${excessTimeFormatted}. 
                      Please adjust question times or increase the assignment time limit.`,
            type: 'error'
          });
          return false;
        } else {
          showToast({
            title: 'Time Allocation Warning',
            message: `Total question time exceeds assignment time limit by ${excessTimeFormatted}. 
                      Consider adjusting question times or increasing the assignment time limit.`,
            type: 'warning'
          });
          // Continue with validation even though time exceeds limit
        }
      }
      
      // Only return false if we're enforcing the time limit
      if (enforceTimeLimit) return false;
    }

    console.log('Validation passed');
    return true;
  };

  const distributeTimeEqually = () => {
    if (questions.length === 0) {
      showToast({
        title: 'No Questions',
        message: 'Add questions first before distributing time',
        type: 'error'
      });
      return;
    }

    // Toggle distributed state
    setIsDistributed(!isDistributed);
    
    if (!isDistributed) {
      // If not currently distributed, distribute the time
      const totalTimeInSeconds = formData.timeLimit * 60;
      const timePerQuestion = Math.floor(totalTimeInSeconds / questions.length);
      const timePerQuestionMinutes = Math.floor(timePerQuestion / 60);
      const timePerQuestionSeconds = timePerQuestion % 60;
      
      const updatedQuestions = questions.map(q => ({
        ...q,
        timeAllocation: timePerQuestion
      }));
  
      setQuestions(updatedQuestions);
      
      showToast({
        title: 'Time Distributed Successfully',
        message: `${timePerQuestionMinutes}m ${timePerQuestionSeconds}s allocated to each of the ${questions.length} questions`,
        type: 'success'
      });
    } else {
      // If already distributed, just show a message that distribution has been disabled
      showToast({
        title: 'Equal Distribution Disabled',
        message: 'You can now set custom time allocations for each question',
        type: 'info'
      });
    }
  };

  const validateScoring = () => {
    if (formData.maxPoints <= 0) {
      showToast({
        title: 'Invalid Max Points',
        message: 'Maximum points must be greater than 0',
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const validateQuestions = (showMessages = false, enforceTimeLimit = true) => {
    console.log('validateQuestions called, enforceTimeLimit:', enforceTimeLimit);
    const result = validateQuestionsAndPoints(showMessages, enforceTimeLimit);
    console.log('validateQuestionsAndPoints result:', result);
    return result;
  };

  // Time validation
  const getTotalQuestionTime = () => {
    return Math.round(questions.reduce((total, q) => total + (q.timeAllocation || 0), 0) / 60); // Convert seconds to minutes
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
    
    if (currentQuestion.type === 'multi-select') {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        showToast({ 
          title: 'Validation Error',
          message: 'Add at least two options for multi-select questions', 
          type: 'error' 
        });
        return;
      }
      
      if (!Array.isArray(currentQuestion.correctAnswer) || currentQuestion.correctAnswer.length === 0) {
        showToast({ 
          title: 'Validation Error',
          message: 'Select at least one correct answer for multi-select questions', 
          type: 'error' 
        });
        return;
      }
    }
    
    const totalQuestionTime = getTotalQuestionTime() + (currentQuestion.timeAllocation || 0) / 60;
    if (totalQuestionTime > formData.timeLimit) {
      showToast({
        title: 'Time Limit Exceeded',
        message: `Adding this question would exceed the assignment time limit by ${Math.ceil(totalQuestionTime - formData.timeLimit)} minutes`,
        type: 'warning'
      });
      // We'll continue but show the warning
    }
    
    // Check points
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) + currentQuestion.points;
    if (totalPoints > formData.maxPoints) {
      showToast({
        title: 'Points Exceeded',
        message: `Adding this question will exceed the maximum points (${formData.maxPoints}). Current total: ${totalPoints - currentQuestion.points}, Adding: ${currentQuestion.points}`,
        type: 'error'
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
    
    // Reset the distribute equally state when questions change
    setIsDistributed(false);
    
    resetCurrentQuestion();
  };

  const addSampleQuestion = () => {
    console.log('Adding enhanced sample question');
    
    // Based on the assignment type, create a relevant question type
    let sampleQuestion: Question;
    
    if (formData.assignmentType === 'objective') {
      // Randomly choose between multiple-choice, multi-select, true-false, or integer for objective assignments
      const questionTypes = ['multiple-choice', 'multi-select', 'true-false', 'integer'];
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)] as 'multiple-choice' | 'multi-select' | 'true-false' | 'integer';
      
      if (randomType === 'multiple-choice') {
        sampleQuestion = {
          id: Date.now().toString(),
          type: 'multiple-choice',
          title: 'Sample Multiple Choice Question',
          description: 'This is a sample multiple choice question for testing purposes. Choose the correct option below.',
          options: ['Option A - This is incorrect', 'Option B - This is correct', 'Option C - This is incorrect', 'Option D - This is incorrect'],
          correctAnswer: 1, // Option B is correct
          points: 10,
          timeAllocation: 120, // 2 minutes
          tags: ['sample', 'multiple-choice'],
          difficulty: 'medium'
        };
      } else if (randomType === 'multi-select') {
        sampleQuestion = {
          id: Date.now().toString(),
          type: 'multi-select',
          title: 'Sample Multi-Select Question',
          description: 'This is a sample multi-select question for testing purposes. Choose all correct options below.',
          options: ['Option A - This is correct', 'Option B - This is incorrect', 'Option C - This is correct', 'Option D - This is incorrect'],
          correctAnswer: [0, 2], // Options A and C are correct
          points: 15,
          timeAllocation: 150, // 2.5 minutes
          tags: ['sample', 'multi-select'],
          difficulty: 'medium'
        };
      } else if (randomType === 'true-false') {
        sampleQuestion = {
          id: Date.now().toString(),
          type: 'true-false',
          title: 'Sample True/False Question',
          description: 'This is a sample true/false question. Determine whether the statement is true or false.',
          correctAnswer: true,
          points: 5,
          timeAllocation: 60, // 1 minute
          tags: ['sample', 'true-false'],
          difficulty: 'easy'
        };
      } else {
        sampleQuestion = {
          id: Date.now().toString(),
          type: 'integer',
          title: 'Sample Integer Question',
          description: 'This is a sample integer question. Enter the correct number as your answer.',
          correctAnswer: 42,
          minValue: 0,
          maxValue: 100,
          stepValue: 1,
          points: 8,
          timeAllocation: 90, // 1.5 minutes
          tags: ['sample', 'integer'],
          difficulty: 'medium'
        };
      }
    } else if (formData.assignmentType === 'coding') {
      // Create a coding question
      sampleQuestion = {
        id: Date.now().toString(),
        type: 'coding',
        title: 'Sample Coding Question',
        description: 'Write a function that returns the sum of two numbers.',
        points: 20,
        timeAllocation: 300, // 5 minutes
        tags: ['sample', 'coding'],
        difficulty: 'medium',
        language: 'javascript',
        starterCode: 'function sum(a, b) {\n  // Write your code here\n  \n}',
        testCases: [
          { id: '1', input: '5, 7', output: '12', isHidden: false },
          { id: '2', input: '-3, 8', output: '5', isHidden: false },
          { id: '3', input: '0, 0', output: '0', isHidden: true }
        ]
      };
    } else if (formData.assignmentType === 'essay') {
      // Create an essay question
      sampleQuestion = {
        id: Date.now().toString(),
        type: 'essay',
        title: 'Sample Essay Question',
        description: 'Discuss the impacts of climate change on global agriculture.',
        points: 20,
        timeAllocation: 600, // 10 minutes
        tags: ['sample', 'essay'],
        difficulty: 'medium'
      };
    } else {
      // Mixed type - default to multiple choice
      sampleQuestion = {
        id: Date.now().toString(),
        type: 'multiple-choice',
        title: 'Sample Multiple Choice Question',
        description: 'This is a sample multiple choice question for mixed assignment type.',
        options: ['Option A - This is incorrect', 'Option B - This is correct', 'Option C - This is incorrect', 'Option D - This is incorrect'],
        correctAnswer: 1, // Option B is correct
        points: 10,
        timeAllocation: 120, // 2 minutes
        tags: ['sample', 'multiple-choice'],
        difficulty: 'medium'
      };
    }

    setQuestions(prev => [...prev, sampleQuestion]);
    showToast({
      title: 'Sample Question Added',
      message: `A sample question has been added for ${formData.assignmentType} assignment. You can edit or delete it.`,
      type: 'success'
    });
  };

  const resetCurrentQuestion = () => {
    // Determine the default question type based on assignment type
    let defaultQuestionType = 'multiple-choice';
    if (formData.assignmentType === 'coding') {
      defaultQuestionType = 'coding';
    } else if (formData.assignmentType === 'essay') {
      defaultQuestionType = 'essay';
    }
    
    setCurrentQuestion({
      id: '',
      type: defaultQuestionType as any,
      title: '',
      description: '',
      options: defaultQuestionType === 'multiple-choice' ? ['', ''] : undefined,
      correctAnswer: defaultQuestionType === 'multiple-choice' ? 0 : undefined,
      points: 1,
      timeLimit: undefined,
      timeAllocation: 120, // Default to 2 minutes
      tags: [],
      difficulty: 'medium',
      language: 'python',
      starterCode: defaultQuestionType === 'coding' ? '# Write your code here\n\n' : '',
      testCases: defaultQuestionType === 'coding' ? [] : undefined,
      // Reset integer specific fields
      minValue: undefined,
      maxValue: undefined,
      stepValue: 1
    });
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    // Reset the distribute equally state when questions change
    setIsDistributed(false);
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
    
    let updatedCorrectAnswer: any = currentQuestion.correctAnswer;
    
    if (currentQuestion.type === 'multi-select' && Array.isArray(currentQuestion.correctAnswer)) {
      // For multi-select, adjust array indices
      updatedCorrectAnswer = currentQuestion.correctAnswer
        .filter(answerIndex => answerIndex !== index) // Remove the deleted option
        .map(answerIndex => answerIndex > index ? answerIndex - 1 : answerIndex); // Adjust indices
    } else if (typeof currentQuestion.correctAnswer === 'number' && currentQuestion.correctAnswer >= index) {
      // For single-choice, adjust index
      updatedCorrectAnswer = Math.max(0, currentQuestion.correctAnswer - 1);
    }
    
    setCurrentQuestion({ 
      ...currentQuestion, 
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
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
    console.log('canProceedToNext called for stage:', currentStage);
    let result = false;
    switch (currentStage) {
      case 'basic': 
        result = validateBasicInfo();
        console.log('validateBasicInfo result:', result);
        break;
      case 'settings': 
        result = validateSettings();
        console.log('validateSettings result:', result);
        break;
      case 'scoring': 
        result = validateScoring();
        console.log('validateScoring result:', result);
        break;
      case 'questions': 
        result = validateQuestions(false);
        console.log('validateQuestions result:', result);
        break;
      default: 
        result = false;
        console.log('Unknown stage, returning false');
    }
    console.log('canProceedToNext final result:', result);
    return result;
  };

  // Form submission
  const handleSubmit = async () => {
    console.log('handleSubmit triggered');
    console.log('Current formData:', formData);
    console.log('Current questions:', questions);
    
    // Validate with time limit warnings but don't enforce them
    if (!validateQuestions(true, false)) {
      console.log('Validation failed for non-time-related issues');
      // No need to show toast here as validateQuestions with true will handle it
      return;
    }

    console.log('Validation passed, starting submission...');
    setLoading(true);
    
    try {
      // Apply equal time distribution if it's active
      let finalQuestions = questions;
      if (isDistributed && questions.length > 0) {
        const totalTimeInSeconds = formData.timeLimit * 60;
        const timePerQuestion = Math.floor(totalTimeInSeconds / questions.length);
        finalQuestions = questions.map(q => ({
          ...q,
          timeAllocation: timePerQuestion
        }));
      }
      
      const assignmentData = {
        ...formData,
        questions: finalQuestions
      };

      console.log('Assignment data to submit:', assignmentData);

      const token = localStorage.getItem('zenith-token');
      console.log('Auth token exists:', !!token);

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentData)
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Assignment created successfully:', result);
        setCreatedAssignmentId(result.id);
        showToast({ 
          title: 'Success',
          message: 'Assignment created successfully', 
          type: 'success' 
        });
      } else {
        const errorData = await response.text();
        console.error('API error response:', errorData);
        throw new Error(`Failed to create assignment: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      // Detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // More user-friendly error message
      let errorMessage = 'An unexpected error occurred while creating the assignment.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Authentication error: Please log in again and retry.';
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to create assignments.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      showToast({ 
        title: 'Error Creating Assignment',
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      console.log('Submission process complete - setting loading to false');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (loading) {
    return <FullscreenLoading title="Creating Assignment..." message="Please wait while we save your assignment." />;
  }

  if (createdAssignmentId) {
    return (
      <div className="min-h-screen bg-zenith-main transition-colors duration-300 py-8">
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
    <div className="min-h-screen bg-zenith-main transition-colors duration-300 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/assignments')}
            className="flex items-center text-zenith-accent hover:text-zenith-brand mb-4 transition-colors focus-ring"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </button>
          
          <h1 className="text-3xl font-bold text-zenith-primary">
            Create New Assignment
          </h1>
          <p className="text-zenith-secondary mt-2">
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
                      validateQuestions(false) 
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
            <div className="bg-zenith-card border border-zenith-border rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-zenith-primary mb-6">
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      placeholder="Enter assignment title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Assignment Type
                    </label>
                    <select
                      value={formData.assignmentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                    >
                      <option value="mixed">Mixed (All Types)</option>
                      <option value="objective">Objective (MCQ/True-False)</option>
                      <option value="coding">Coding Challenge</option>
                      <option value="essay">Essay/Subjective</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
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
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => {
                        const audience = e.target.value as any;
                        // If changing to "club", set the clubId to the user's club automatically
                        if (audience === 'club' && user?.club_id) {
                          setFormData(prev => ({ 
                            ...prev, 
                            targetAudience: audience,
                            clubId: user.club_id || ''
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, targetAudience: audience }));
                        }
                      }}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                    >
                      <option value="club">My Club Only</option>
                      <option value="all_clubs">All Clubs</option>
                      <option value="specific_clubs">Specific Clubs</option>
                    </select>
                  </div>

                  {formData.targetAudience === 'club' && (
                    <div>
                      <label className="block text-sm font-medium text-zenith-secondary mb-2">
                        Club *
                      </label>
                      <select
                        value={user?.club_id || formData.clubId}
                        disabled={true} // Disabled because this is "My Club" option
                        className="w-full px-4 py-3 border border-zenith-border rounded-lg bg-zenith-card text-zenith-secondary"
                      >
                        {user?.club_id ? (
                          <option value={user.club_id}>
                            {clubs.find(club => club.id === user.club_id)?.name || 'Your Club'}
                          </option>
                        ) : (
                          <option value="">You're not assigned to a club</option>
                        )}
                      </select>
                      <p className="text-xs text-zenith-muted mt-1">
                        Assignment will be created for your current club
                      </p>
                    </div>
                  )}

                  {formData.targetAudience === 'specific_clubs' && (
                    <div>
                      <label className="block text-sm font-medium text-zenith-secondary mb-2">
                        Select Clubs * (At least one required)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-zenith-border rounded-lg p-3">
                        {clubs.map(club => (
                          <label key={club.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.targetClubs.includes(club.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    targetClubs: [...prev.targetClubs, club.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    targetClubs: prev.targetClubs.filter(id => id !== club.id)
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-zenith-brand border-zenith-border rounded focus:ring-zenith-brand mr-3"
                            />
                            <span className="text-zenith-secondary">{club.name}</span>
                          </label>
                        ))}
                      </div>
                      {formData.targetClubs.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Please select at least one club
                        </p>
                      )}
                      <p className="text-xs text-zenith-muted dark:text-zenith-muted mt-1">
                        Assignment will be available to selected clubs: {formData.targetClubs.length} selected
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Settings Stage */}
          {currentStage === 'settings' && (
            <div className="bg-zenith-card border border-zenith-border rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-zenith-primary mb-6">
                Test Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Time Limit (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-zenith-primary dark:text-white mb-4">
                      Navigation & Behavior
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowNavigation}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowNavigation: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Allow navigation between questions
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.shuffleQuestions}
                          onChange={(e) => setFormData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Shuffle question order
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.shuffleOptions}
                          onChange={(e) => setFormData(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Shuffle answer options
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowCalculator}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowCalculator: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Allow calculator access
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-zenith-primary dark:text-white mb-4">
                      Security & Proctoring
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isProctored}
                          onChange={(e) => setFormData(prev => ({ ...prev, isProctored: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Enable proctoring features
                        </span>
                      </label>

                      {formData.isProctored && (
                        <div className="ml-7 space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.requireCamera}
                              onChange={(e) => setFormData(prev => ({ ...prev, requireCamera: e.target.checked }))}
                              className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                            />
                            <span className="ml-3 text-zenith-secondary">
                              Require camera access for identity verification
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.requireMicrophone}
                              onChange={(e) => setFormData(prev => ({ ...prev, requireMicrophone: e.target.checked }))}
                              className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                            />
                            <span className="ml-3 text-zenith-secondary">
                              Require microphone access for audio monitoring
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.requireFaceVerification}
                              onChange={(e) => setFormData(prev => ({ ...prev, requireFaceVerification: e.target.checked }))}
                              className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                            />
                            <span className="ml-3 text-zenith-secondary">
                              Require face verification before starting
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.requireFullscreen}
                              onChange={(e) => setFormData(prev => ({ ...prev, requireFullscreen: e.target.checked }))}
                              className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                            />
                            <span className="ml-3 text-zenith-secondary">
                              Force fullscreen mode during test
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.autoSubmitOnViolation}
                              onChange={(e) => setFormData(prev => ({ ...prev, autoSubmitOnViolation: e.target.checked }))}
                              className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                            />
                            <span className="ml-3 text-zenith-secondary">
                              Auto-submit test after maximum violations
                            </span>
                          </label>

                          <div className="flex items-center space-x-3">
                            <label className="text-sm font-medium text-zenith-secondary">
                              Maximum violations allowed:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={formData.maxViolations}
                              onChange={(e) => setFormData(prev => ({ ...prev, maxViolations: parseInt(e.target.value) }))}
                              className="w-20 px-3 py-1 border border-zenith-border rounded-md focus:ring-zenith-primary focus:border-zenith-primary dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.showResults}
                          onChange={(e) => setFormData(prev => ({ ...prev, showResults: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Show results after submission
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowReview}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowReview: e.target.checked }))}
                          className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary"
                        />
                        <span className="ml-3 text-zenith-secondary">
                          Allow answer review after submission
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
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
            <div className="bg-zenith-card border border-zenith-border rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-zenith-primary mb-6">
                Marks & Time Distribution
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <Target className="w-6 h-6 text-zenith-primary dark:text-blue-400 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                      Total Points
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-zenith-primary dark:text-blue-400 mb-2">
                    {questions.reduce((total, q) => total + q.points, 0)} / {formData.maxPoints}
                  </div>
                  <input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-zenith-brand/30 rounded-lg bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
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
                  <div className="text-sm text-green-700 dark:text-green-400 mb-3">
                    {formData.timeLimit - getTotalQuestionTime()} minutes available
                  </div>
                  <button
                    onClick={distributeTimeEqually}
                    className={`w-full px-3 py-2 ${isDistributed ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg text-sm font-medium transition-colors`}
                    disabled={questions.length === 0}
                    title={isDistributed ? "Disable equal time distribution" : "This will divide the total time limit equally among all questions"}
                  >
                    {isDistributed ? 'Disable Equal Distribution' : 'Distribute Time Equally'}
                  </button>
                  <div className="text-xs text-green-700 dark:text-green-400 mt-2">
                    {isDistributed && questions.length > 0
                      ? `Time is equally distributed: ${Math.floor((formData.timeLimit * 60) / questions.length / 60)}m ${((formData.timeLimit * 60) / questions.length % 60).toFixed(0)}s per question`
                      : questions.length > 0 
                        ? `Automatically divide the ${formData.timeLimit} minutes equally among all ${questions.length} questions`
                        : 'Add questions first to distribute time'
                    }
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
              <div className="bg-zenith-card border border-zenith-border rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-zenith-primary">
                    {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <button
                    onClick={addSampleQuestion}
                    className="px-4 py-2 bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {questions.length === 0 ? 'Add Sample Question' : 'Add Another Sample'}
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {formData.assignmentType === 'mixed' && (
                      <div>
                        <label className="block text-sm font-medium text-zenith-secondary mb-2">
                          Question Type
                        </label>
                        <select
                          value={currentQuestion.type}
                          onChange={(e) => setCurrentQuestion(prev => ({ 
                            ...prev, 
                            type: e.target.value as any,
                            options: e.target.value === 'multiple-choice' || e.target.value === 'multi-select' ? ['', ''] : undefined,
                            correctAnswer: e.target.value === 'multiple-choice' ? 0 : 
                                         e.target.value === 'multi-select' ? [] : undefined
                          }))}
                          className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="multi-select">Multi-Select</option>
                          <option value="true-false">True/False</option>
                          <option value="short-answer">Short Answer</option>
                          <option value="essay">Essay</option>
                          <option value="coding">Coding</option>
                          <option value="integer">Numeric Input</option>
                        </select>
                      </div>
                    )}

                    {formData.assignmentType !== 'mixed' && (
                      <div>
                        <label className="block text-sm font-medium text-zenith-secondary mb-2">
                          Question Type
                        </label>
                        <div className="w-full px-4 py-3 border border-zenith-border rounded-lg bg-zenith-section dark:bg-gray-700 text-zenith-primary dark:text-white">
                          {formData.assignmentType === 'objective' ? 'Multiple Choice / True-False' :
                           formData.assignmentType === 'coding' ? 'Coding Challenge' :
                           formData.assignmentType === 'essay' ? 'Essay / Subjective' : 'Mixed'}
                        </div>
                        <p className="text-xs text-zenith-muted dark:text-zenith-muted mt-1">
                          Question type is fixed based on assignment type selected in Basic Info
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-zenith-secondary mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zenith-secondary mb-2">
                        Time Allocation (seconds)
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.timeAllocation || 0}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeAllocation: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                        min="0"
                        max={formData.timeLimit * 60}
                      />
                      <p className="text-xs text-zenith-muted dark:text-zenith-muted mt-1">
                        Optional: Time in seconds (e.g., 120 = 2 minutes). Leave 0 for no specific time limit for this question.
                        Maximum allowed: {formData.timeLimit * 60} seconds ({formData.timeLimit} minutes).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
                      Question Title *
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.title}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                      placeholder="Enter question title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zenith-secondary mb-2">
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
                        <label className="block text-sm font-medium text-zenith-secondary">
                          Answer Options
                        </label>
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center px-3 py-2 bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-lg font-medium"
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
                              className="w-4 h-4 text-zenith-primary"
                            />
                            <div className="flex-1 flex items-center space-x-2">
                              <span className="w-6 h-6 bg-zenith-section dark:bg-zenith-secondary rounded-full flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
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

                  {/* Multi-Select Options */}
                  {currentQuestion.type === 'multi-select' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-zenith-secondary">
                          Answer Options (Select Multiple Correct Answers)
                        </label>
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center px-3 py-2 bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-lg font-medium"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(currentQuestion.options || []).map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.includes(index)}
                              onChange={(e) => {
                                const currentAnswers = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [];
                                if (e.target.checked) {
                                  setCurrentQuestion(prev => ({ 
                                    ...prev, 
                                    correctAnswer: [...currentAnswers, index].sort((a, b) => a - b)
                                  }));
                                } else {
                                  setCurrentQuestion(prev => ({ 
                                    ...prev, 
                                    correctAnswer: currentAnswers.filter(a => a !== index)
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-zenith-primary rounded"
                            />
                            <div className="flex-1 flex items-center space-x-2">
                              <span className="w-6 h-6 bg-zenith-section dark:bg-zenith-secondary rounded-full flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
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
                      
                      {Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length === 0 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                          Please select at least one correct answer
                        </p>
                      )}
                    </div>
                  )}

                  {/* Integer Question */}
                  {currentQuestion.type === 'integer' && (
                    <div className="col-span-1 lg:col-span-2">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-zenith-secondary mb-2">
                          Correct Answer (Integer)
                        </label>
                        <input
                          type="number"
                          value={typeof currentQuestion.correctAnswer === 'number' ? currentQuestion.correctAnswer : 0}
                          onChange={(e) => setCurrentQuestion(prev => ({
                            ...prev,
                            correctAnswer: parseInt(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-zenith-secondary mb-2">
                            Minimum Value (Optional)
                          </label>
                          <input
                            type="number"
                            value={currentQuestion.minValue || ''}
                            onChange={(e) => setCurrentQuestion(prev => ({
                              ...prev,
                              minValue: e.target.value ? parseInt(e.target.value) : undefined
                            }))}
                            className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                            placeholder="Minimum"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zenith-secondary mb-2">
                            Maximum Value (Optional)
                          </label>
                          <input
                            type="number"
                            value={currentQuestion.maxValue || ''}
                            onChange={(e) => setCurrentQuestion(prev => ({
                              ...prev,
                              maxValue: e.target.value ? parseInt(e.target.value) : undefined
                            }))}
                            className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                            placeholder="Maximum"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zenith-secondary mb-2">
                            Step Size (Optional)
                          </label>
                          <input
                            type="number"
                            value={currentQuestion.stepValue || ''}
                            onChange={(e) => setCurrentQuestion(prev => ({
                              ...prev,
                              stepValue: e.target.value ? parseInt(e.target.value) : undefined
                            }))}
                            className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                            placeholder="Step"
                            min="1"
                          />
                        </div>
                      </div>
                      
                      <p className="text-sm text-zenith-muted dark:text-zenith-muted mt-1 mb-3">
                        For integer questions, students will enter a number as their answer. You can optionally set min/max bounds and step size.
                      </p>
                    </div>
                  )}
                  
                  {/* True/False */}
                  {currentQuestion.type === 'true-false' && (
                    <div>
                      <label className="block text-sm font-medium text-zenith-secondary mb-3">
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
                        {/* Language Selection Strategy */}
                        <div>
                          <label className="block text-sm font-medium text-zenith-secondary mb-2">
                            Language Selection
                          </label>
                          <select
                            value={
                              currentQuestion.allowAnyLanguage ? 'any' :
                              currentQuestion.allowedLanguages && currentQuestion.allowedLanguages.length > 0 ? 'multiple' :
                              'fixed'
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'any') {
                                setCurrentQuestion(prev => ({
                                  ...prev,
                                  allowAnyLanguage: true,
                                  allowedLanguages: [],
                                  language: undefined
                                }));
                              } else if (value === 'multiple') {
                                setCurrentQuestion(prev => ({
                                  ...prev,
                                  allowAnyLanguage: false,
                                  allowedLanguages: ['python', 'java'],
                                  language: undefined
                                }));
                              } else {
                                setCurrentQuestion(prev => ({
                                  ...prev,
                                  allowAnyLanguage: false,
                                  allowedLanguages: [],
                                  language: 'python'
                                }));
                              }
                            }}
                            className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                          >
                            <option value="fixed">Fixed Language - Students must use specific language</option>
                            <option value="multiple">Multiple Languages - Students choose from allowed languages</option>
                            <option value="any">Any Language - Students can use any supported language</option>
                          </select>
                        </div>

                        {/* Fixed Language Selection */}
                        {!currentQuestion.allowAnyLanguage && (!currentQuestion.allowedLanguages || currentQuestion.allowedLanguages.length === 0) && (
                          <div>
                            <label className="block text-sm font-medium text-zenith-secondary mb-2">
                              Required Language
                            </label>
                            <select
                              value={currentQuestion.language || 'python'}
                              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, language: e.target.value }))}
                              className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                            >
                              <option value="python">Python</option>
                              <option value="java">Java</option>
                              <option value="javascript">JavaScript</option>
                              <option value="typescript">TypeScript</option>
                              <option value="c">C</option>
                              <option value="cpp">C++</option>
                              <option value="csharp">C#</option>
                              <option value="go">Go</option>
                              <option value="rust">Rust</option>
                              <option value="php">PHP</option>
                            </select>
                          </div>
                        )}

                        {/* Multiple Languages Selection */}
                        {!currentQuestion.allowAnyLanguage && currentQuestion.allowedLanguages && currentQuestion.allowedLanguages.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-zenith-secondary mb-2">
                              Allowed Languages
                            </label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {['python', 'java', 'javascript', 'typescript', 'c', 'cpp', 'csharp', 'go', 'rust', 'php'].map(lang => (
                                <label key={lang} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={currentQuestion.allowedLanguages?.includes(lang) || false}
                                    onChange={(e) => {
                                      const currentAllowed = currentQuestion.allowedLanguages || [];
                                      if (e.target.checked) {
                                        setCurrentQuestion(prev => ({
                                          ...prev,
                                          allowedLanguages: [...currentAllowed, lang]
                                        }));
                                      } else {
                                        setCurrentQuestion(prev => ({
                                          ...prev,
                                          allowedLanguages: currentAllowed.filter(l => l !== lang)
                                        }));
                                      }
                                    }}
                                    className="w-4 h-4 text-zenith-primary rounded mr-2"
                                  />
                                  <span className="text-sm text-zenith-secondary capitalize">
                                    {lang === 'cpp' ? 'C++' : lang === 'csharp' ? 'C#' : lang}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Any Language Info */}
                        {currentQuestion.allowAnyLanguage && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              Students will be able to choose from all supported languages: Python, Java, JavaScript, TypeScript, C, C++, C#, Go, Rust, PHP
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zenith-secondary mb-2">
                          Time Allocation (seconds)
                        </label>
                        <input
                          type="number"
                          value={currentQuestion.timeAllocation || 0}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeAllocation: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary"
                          placeholder="Time in seconds"
                          min="0"
                          max={formData.timeLimit * 60}
                        />
                        <p className="text-xs text-zenith-muted dark:text-zenith-muted mt-1">
                          {(formData.timeLimit * 60)} seconds ({formData.timeLimit} minutes) available for the entire assignment.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zenith-secondary mb-2">
                          Starter Code (Optional)
                        </label>
                        <textarea
                          value={currentQuestion.starterCode}
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, starterCode: e.target.value }))}
                          className="w-full px-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary font-mono"
                          rows={6}
                          placeholder="// Provide starter code template for students..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-zenith-secondary">
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
                            <div key={testCase.id} className="p-4 border border-zenith-border dark:border-gray-600 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-zenith-primary dark:text-white">
                                  Test Case {index + 1}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={testCase.isHidden}
                                      onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                                      className="w-4 h-4 text-zenith-primary border-zenith-border rounded focus:ring-zenith-primary mr-2"
                                    />
                                    <span className="text-zenith-secondary">Hidden</span>
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
                                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
                                    Input
                                  </label>
                                  <textarea
                                    value={testCase.input}
                                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                    className="w-full px-3 py-2 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary font-mono"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-zenith-secondary mb-2">
                                    Expected Output
                                  </label>
                                  <textarea
                                    value={testCase.output}
                                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                    className="w-full px-3 py-2 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-brand bg-zenith-input text-zenith-primary font-mono"
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

                  <div className="flex items-center justify-between pt-4 border-t border-zenith-border dark:border-gray-600">
                    {editingQuestionIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionIndex(null);
                          resetCurrentQuestion();
                        }}
                        className="px-4 py-2 text-zenith-secondary hover:text-zenith-primary dark:text-zenith-muted dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                    )}
                    
                    <div className="flex space-x-3 ml-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion(currentQuestion)}
                        className="flex items-center px-4 py-2 bg-zenith-secondary hover:bg-zenith-secondary/90 text-white rounded-lg font-medium"
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
          <div className="flex items-center justify-between pt-8 border-t border-zenith-border">
            <button
              onClick={goToPreviousStage}
              disabled={currentStage === 'basic'}
              className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                currentStage === 'basic'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-zenith-primary border-2 border-zenith-primary hover:bg-zenith-primary hover:text-white'
              }`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {currentStage === 'questions' ? (
                <button
                  onClick={() => {
                    console.log('Create Assignment button clicked');
                    if (canProceedToNext()) {
                      handleSubmit();
                    } else {
                      console.log('Cannot proceed - showing validation messages');
                      if (questions.length === 0) {
                        showToast({
                          title: 'No Questions Added',
                          message: 'Please add at least one question before creating the assignment. Use the form above to add questions.',
                          type: 'warning'
                        });
                      } else {
                        validateQuestions(true); // This will show specific validation errors
                      }
                    }
                  }}
                  className={`flex items-center px-10 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                    canProceedToNext()
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white cursor-pointer'
                  }`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {canProceedToNext() ? 'Create Assignment' : 'Add Questions First'}
                </button>
              ) : (
                <button
                  onClick={goToNextStage}
                  disabled={!canProceedToNext()}
                  className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                    canProceedToNext()
                      ? 'bg-gradient-to-r from-zenith-primary to-blue-600 hover:from-blue-600 hover:to-purple-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
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
