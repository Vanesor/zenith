'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Brain, Wand2, CheckCircle, AlertCircle, Loader, Edit, Eye, Hash, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ZenAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentGenerated: (assignment: any) => void;
}

interface Question {
  id?: string;
  question_type: 'single_choice' | 'multiple_choice' | 'multi_select' | 'coding' | 'essay' | 'true_false' | 'integer';
  title: string;
  description: string;
  options?: string[];
  correct_answer: any;
  points: number;
  ordering: number;
  time_limit?: number;
  code_language?: string;
  starter_code?: string;
  test_cases?: any[];
  expected_output?: string;
  explanation?: string;
  integer_min?: number;
  integer_max?: number;
  integer_step?: number;
}

interface GeneratedAssignment {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  totalPoints: number;
  allowRetakes: boolean;
  shuffleQuestions: boolean;
  questions: Question[];
}

const ZenAssistant: React.FC<ZenAssistantProps> = ({ isOpen, onClose, onAssignmentGenerated }) => {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'generating' | 'review' | 'edit'>('input');
  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [textInput, setTextInput] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedAssignment, setGeneratedAssignment] = useState<GeneratedAssignment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState('');
  const [showQuestionCountPrompt, setShowQuestionCountPrompt] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [preventClose, setPreventClose] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const detectQuestionCount = (text: string): number | null => {
    // Look for patterns like "5 questions", "generate 10 questions", "create 15 questions"
    const patterns = [
      /(\d+)\s*questions?/i,
      /generate\s*(\d+)/i,
      /create\s*(\d+)/i,
      /make\s*(\d+)/i,
      /(\d+)\s*items?/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        if (count > 0 && count <= 50) {
          return count;
        }
      }
    }
    return null;
  };

  const handleGenerate = async () => {
    const content = inputType === 'text' ? textInput : uploadedFile?.name || '';
    
    if (!content.trim()) {
      showToast({
        title: 'Missing Content',
        message: 'Please provide content for assignment generation',
        type: 'error'
      });
      return;
    }

    // First, analyze the content to see if question count is specified
    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('action', 'analyze');
      formData.append('content', content);

      const response = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const analysis = await response.json();
      setIsGenerating(false);
      
      // If analysis says we need user input for question count
      if (analysis.needsQuestionCount && !questionCount) {
        setShowQuestionCountPrompt(true);
        if (analysis.detectedCount) {
          setQuestionCount(analysis.detectedCount.toString());
        }
        showToast({
          title: 'Question Count Needed',
          message: 'Please specify the number of questions for this assignment.',
          type: 'info'
        });
        return;
      }

      // Proceed with generation using detected or specified count
      const finalCount = questionCount || analysis.detectedCount?.toString() || '5';
      await generateAssignment(content, parseInt(finalCount));
      
    } catch (error) {
      console.error('Error in generation process:', error);
      setIsGenerating(false);
      showToast({
        title: 'Generation Failed',
        message: 'Failed to analyze content. Please try again.',
        type: 'error'
      });
    }
  };

  const generateAssignment = async (content: string, finalQuestionCount: number) => {
    setIsGenerating(true);
    setStep('generating');

    try {
      const formData = new FormData();
      formData.append('action', 'generate');
      formData.append('content', content);
      formData.append('difficulty', difficulty);
      formData.append('questionCount', finalQuestionCount.toString());

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate assignment');
      }

      const assignment = await response.json();
      
      // Ensure questions have proper ordering and formatting
      assignment.questions = assignment.questions.map((q: Question, index: number) => ({
        ...q,
        ordering: index,
        // Ensure proper formatting for preview
        title: q.title || `Question ${index + 1}`,
        description: q.description || '',
        points: q.points || 5,
        explanation: q.explanation || ''
      }));

      setGeneratedAssignment(assignment);
      setStep('review');
      setPreventClose(true); // Prevent accidental modal closure during review/edit
      
      // Assignment generated successfully - user can now preview/edit
      if (process.env.NODE_ENV === 'development') {
        console.log('Assignment generated successfully, switching to review step', assignment);
      }
      
    } catch (error) {
      console.error('Error generating assignment:', error);
      showToast({
        title: 'Generation Failed',
        message: 'Failed to generate assignment. Please try again.',
        type: 'error'
      });
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast({
          title: 'Invalid file type',
          message: 'Please upload a PDF file',
          type: 'error'
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast({
          title: 'File too large',
          message: 'Please upload a PDF file smaller than 10MB',
          type: 'error'
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleQuestionEdit = (questionIndex: number, updatedQuestion: Question) => {
    if (!generatedAssignment) return;
    
    const updatedQuestions = generatedAssignment.questions.map((q, index) => 
      index === questionIndex ? updatedQuestion : q
    );
    
    setGeneratedAssignment({
      ...generatedAssignment,
      questions: updatedQuestions,
      totalPoints: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
    });
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    if (!generatedAssignment) return;
    
    const updatedQuestions = generatedAssignment.questions
      .filter((_, index) => index !== questionIndex)
      .map((q, index) => ({ ...q, ordering: index }));
    
    setGeneratedAssignment({
      ...generatedAssignment,
      questions: updatedQuestions,
      totalPoints: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
    });
  };

  const handleSaveAssignment = () => {
    if (!generatedAssignment) return;
    
    // Store assignment data in sessionStorage for seamless transfer
    const assignmentData = {
      ...generatedAssignment,
      // Add default settings from database schema
      assignment_type: 'regular',
      target_audience: 'club',
      max_points: generatedAssignment.totalPoints,
      time_limit: generatedAssignment.timeLimit,
      passing_score: 60,
      is_proctored: false,
      shuffle_questions: generatedAssignment.shuffleQuestions,
      allow_calculator: true,
      show_results: true,
      allow_review: true,
      shuffle_options: false,
      max_attempts: generatedAssignment.allowRetakes ? 3 : 1,
      require_fullscreen: false,
      auto_submit_on_violation: false,
      max_violations: 3,
      require_camera: false,
      require_microphone: false,
      require_face_verification: false,
      allow_navigation: true,
      coding_instructions: 'Write your code solution. Make sure to test your code thoroughly before submitting.',
      objective_instructions: 'Choose the correct answer(s) for each question. For multi-select questions, you may choose multiple options.',
      mixed_instructions: 'This assignment contains different types of questions. Read each question carefully and provide appropriate answers.',
      essay_instructions: 'Provide detailed written responses to the essay questions. Ensure your answers are well-structured and comprehensive.',
      code_editor_settings: {
        theme: 'vs-dark',
        autoSave: true,
        fontSize: 14,
        wordWrap: true,
        autoSaveInterval: 30000
      },
      proctoring_settings: {},
      // Set due date to 1 week from now as default
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      start_date: new Date().toISOString()
    };
    
    // First clean up any existing assignment data to prevent conflicts
    const cleanupExistingData = () => {
      try {
        // Clean up any existing zenith_assignment_ keys in both storage types
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('zenith_assignment_')) {
            sessionStorage.removeItem(key);
          }
        }
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('zenith_assignment_') || key.startsWith('backup_zenith_assignment_'))) {
            localStorage.removeItem(key);
          }
        }
        
        // Also clean up window object if exists
        if (typeof window !== 'undefined' && (window as any).__ZENITH_TEMP_ASSIGNMENT) {
          delete (window as any).__ZENITH_TEMP_ASSIGNMENT;
        }
        
        console.log('Cleaned up existing assignment data');
      } catch (error) {
        console.error('Error cleaning up existing assignment data:', error);
      }
    };
    
    // Run cleanup first
    cleanupExistingData();
    
    // Generate storage key using timestamp for uniqueness
    const storageKey = `zenith_assignment_${Date.now()}`;
    const assignmentString = JSON.stringify(assignmentData);
    
    try {
      // Storage Method 1: sessionStorage (primary)
      sessionStorage.setItem(storageKey, assignmentString);
      
      // Storage Method 2: localStorage backup with TTL
      const backupData = {
        data: assignmentString,
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes expiry (extended)
      };
      localStorage.setItem(`backup_${storageKey}`, JSON.stringify(backupData));
      
      // Storage Method 3: Direct localStorage for redundancy 
      localStorage.setItem(storageKey, assignmentString);
      
      // Storage Method 4: Window object temporary storage (for tab navigation issues)
      if (typeof window !== 'undefined') {
        // @ts-ignore - adding custom property
        window.__ZENITH_TEMP_ASSIGNMENT = assignmentString;
        console.log('Added temporary assignment data to window object');
      }
      
      // Verify storage success
      let verificationResults = {
        session: sessionStorage.getItem(storageKey) ? 'Success' : 'Failed',
        localBackup: localStorage.getItem(`backup_${storageKey}`) ? 'Success' : 'Failed',
        localDirect: localStorage.getItem(storageKey) ? 'Success' : 'Failed',
        window: typeof window !== 'undefined' && (window as any).__ZENITH_TEMP_ASSIGNMENT ? 'Success' : 'Failed'
      };
      
      console.log('Assignment data stored with key:', storageKey);
      console.log('Storage verification results:', verificationResults);
      
      // Check if all storage methods failed
      if (verificationResults.session === 'Failed' && 
          verificationResults.localBackup === 'Failed' &&
          verificationResults.localDirect === 'Failed') {
        console.error('All primary storage methods failed');
        showToast({
          title: 'Storage Warning',
          message: 'Your browser may have limited storage. Assignment data may not persist.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to store assignment data:', error);
      showToast({
        title: 'Storage Error',
        message: 'Failed to store assignment data. Please try again.',
        type: 'error'
      });
      return;
    }
    
    showToast({
      title: 'Assignment Ready!',
      message: 'Assignment has been prepared successfully. Opening editor...',
      type: 'success'
    });
    
    // Close modal first
    setPreventClose(false);
    onClose();
    
    // Add assignment data to a global window variable as a last resort backup
    if (typeof window !== 'undefined') {
      // @ts-ignore - we're adding a custom property to window
      window.__ZENITH_TEMP_ASSIGNMENT = assignmentString;
    }
    
    // Use a longer delay to ensure modal closes and storage is persisted, then navigate
    setTimeout(() => {
      // Verify storage one more time before navigation
      const verifyData = sessionStorage.getItem(storageKey);
      if (!verifyData) {
        console.warn('Data not found in primary storage, checking backup...');
        const backupItem = localStorage.getItem(`backup_${storageKey}`);
        if (!backupItem) {
          // Try direct localStorage as a last resort
          const directData = localStorage.getItem(storageKey);
          if (!directData) {
            console.error('Data not found in any storage location!');
            showToast({
              title: 'Storage Error',
              message: 'Assignment data was lost. Please try again.',
              type: 'error'
            });
            return;
          }
          console.log('Found data in direct localStorage, proceeding with navigation');
        } else {
          console.log('Found data in backup storage, proceeding with navigation');
        }
      } else {
        console.log('Verified data in sessionStorage, proceeding with navigation');
      }
      
      console.log('Navigating to editor with key:', storageKey);
      if (typeof window !== 'undefined') {
        try {
          // Use router.push for more reliable Next.js navigation
          router.push(`/assignments/editor?key=${storageKey}`);
        } catch (error) {
          console.error('Router navigation failed, falling back to direct location change:', error);
          window.location.href = `/assignments/editor?key=${storageKey}`;
        }
      }
    }, 500); // Increased delay to ensure storage persistence
  };

  const resetForm = () => {
    setStep('input');
    setTextInput('');
    setUploadedFile(null);
    setQuestionCount('');
    setShowQuestionCountPrompt(false);
    setGeneratedAssignment(null);
    setEditingQuestion(null);
    setIsGenerating(false);
    setPreventClose(false);
  };

  if (!isOpen) return null;

  // Debug logging for modal state
  if (process.env.NODE_ENV === 'development') {
    console.log('ZEN Assistant render - step:', step, 'hasAssignment:', !!generatedAssignment, 'preventClose:', preventClose);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-blue-900/40 backdrop-blur-md"
          onClick={() => {
            if (!preventClose) {
              onClose();
            }
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ZEN AI Assistant</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {step === 'input' && 'Create assignments with AI assistance'}
                  {step === 'generating' && 'Generating your assignment...'}
                  {step === 'review' && 'Review your generated assignment'}
                  {step === 'edit' && 'Edit assignment questions'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!preventClose) {
                  onClose();
                } else {
                  // Show a warning that they need to save or regenerate first
                  showToast({
                    title: 'Please Save or Regenerate',
                    message: 'Please save your generated assignment or regenerate a new one before closing.',
                    type: 'warning'
                  });
                }
              }}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            {/* Input Step */}
            {step === 'input' && (
              <div className="space-y-6">
                {/* Input Type Selection */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setInputType('text')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                      inputType === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <span className="block font-medium text-gray-900 dark:text-white">Text Input</span>
                  </button>
                  <button
                    onClick={() => setInputType('pdf')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                      inputType === 'pdf'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <span className="block font-medium text-gray-900 dark:text-white">PDF Upload</span>
                  </button>
                </div>

                {/* Content Input */}
                {inputType === 'text' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignment Content
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter the topic, learning objectives, or content for your assignment. You can specify the number of questions (e.g., '5 questions about React hooks')..."
                      className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload PDF Document
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-6 h-6 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">{uploadedFile.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">Click to upload a PDF document</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Maximum size: 10MB</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-3">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          difficulty === level
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={(!textInput.trim() && !uploadedFile) || isGenerating}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Assignment
                </button>
              </div>
            )}

            {/* Question Count Prompt */}
            {showQuestionCountPrompt && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <Hash className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200">Number of Questions Required</h3>
                    <p className="text-sm text-amber-600 dark:text-amber-300">
                      Please specify how many questions you'd like in this assignment.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQuestionCountPrompt(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowQuestionCountPrompt(false);
                      generateAssignment(inputType === 'text' ? textInput : uploadedFile?.name || '', parseInt(questionCount) || 5);
                    }}
                    disabled={!questionCount}
                    className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Generating Step */}
            {step === 'generating' && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Generating Your Assignment
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our AI is creating questions based on your content...
                </p>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && generatedAssignment && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStep('input');
                        setGeneratedAssignment(null);
                        setPreventClose(false); // Allow closing again when regenerating
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => setStep('edit')}
                      className="px-4 py-2 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Questions
                    </button>
                    <button
                      onClick={handleSaveAssignment}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      Continue to Assignment Editor
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{generatedAssignment.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{generatedAssignment.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
                        {generatedAssignment.difficulty.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{generatedAssignment.questions.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{generatedAssignment.totalPoints}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{generatedAssignment.timeLimit}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {generatedAssignment.allowRetakes ? 'Yes' : 'No'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Retakes</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {generatedAssignment.questions.map((question, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                              {question.title}
                            </h5>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                {question.question_type.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {question.points} points
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {question.points}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{question.description}</p>
                      </div>
                      
                      {question.options && (
                        <div className="mb-4">
                          <h6 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Answer Options:</h6>
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border transition-colors ${
                                  (Array.isArray(question.correct_answer) 
                                    ? question.correct_answer.includes(optIndex)
                                    : question.correct_answer === optIndex)
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span>{option}</span>
                                  {(Array.isArray(question.correct_answer) 
                                    ? question.correct_answer.includes(optIndex)
                                    : question.correct_answer === optIndex) && (
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.question_type === 'true_false' && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Correct Answer:</div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                            question.correct_answer 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                          }`}>
                            <CheckCircle className="w-4 h-4" />
                            {question.correct_answer ? 'True' : 'False'}
                          </div>
                        </div>
                      )}
                      
                      {question.question_type === 'integer' && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Correct Answer:</div>
                          <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                            {question.correct_answer}
                          </div>
                        </div>
                      )}
                      
                      {question.question_type === 'coding' && (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.starter_code && (
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Starter Code:</div>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm overflow-x-auto">
                                  <code>{question.starter_code}</code>
                                </pre>
                              </div>
                            )}
                            {question.expected_output && (
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Expected Output:</div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm font-mono">
                                  {question.expected_output}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation</div>
                              <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                {question.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Step */}
            {step === 'edit' && generatedAssignment && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('review')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Preview
                  </button>
                  <button
                    onClick={handleSaveAssignment}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                    Continue to Editor
                  </button>
                </div>

                {/* Assignment Metadata Editor */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assignment Title
                      </label>
                      <input
                        type="text"
                        value={generatedAssignment.title}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          title: e.target.value 
                        })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter assignment title..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assignment Description
                      </label>
                      <textarea
                        value={generatedAssignment.description}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          description: e.target.value 
                        })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none h-24"
                        placeholder="Enter assignment description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={generatedAssignment.timeLimit}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          timeLimit: parseInt(e.target.value) || 60 
                        })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={generatedAssignment.difficulty}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                        })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowRetakes"
                        checked={generatedAssignment.allowRetakes}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          allowRetakes: e.target.checked 
                        })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="allowRetakes" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Allow Retakes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="shuffleQuestions"
                        checked={generatedAssignment.shuffleQuestions}
                        onChange={(e) => setGeneratedAssignment({ 
                          ...generatedAssignment, 
                          shuffleQuestions: e.target.checked 
                        })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="shuffleQuestions" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Shuffle Questions
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {generatedAssignment.questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-900 dark:text-white">Question {index + 1}</h5>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      
                      {editingQuestion === index ? (
                        <QuestionEditor
                          question={question}
                          onSave={(updatedQuestion) => {
                            handleQuestionEdit(index, updatedQuestion);
                            setEditingQuestion(null);
                          }}
                          onCancel={() => setEditingQuestion(null)}
                        />
                      ) : (
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">{question.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{question.description}</p>
                          <button
                            onClick={() => setEditingQuestion(index)}
                            className="text-purple-500 hover:text-purple-700 text-sm"
                          >
                            Edit Question
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const [editedQuestion, setEditedQuestion] = useState<Question>({ ...question });

  const handleSave = () => {
    onSave(editedQuestion);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question Title
        </label>
        <input
          type="text"
          value={editedQuestion.title}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, title: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question Description
        </label>
        <textarea
          value={editedQuestion.description}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, description: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none h-20"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Points
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={editedQuestion.points}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, points: parseInt(e.target.value) || 1 })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question Type
          </label>
          <select
            value={editedQuestion.question_type}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              question_type: e.target.value as Question['question_type']
            })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="multi_select">Multi Select</option>
            <option value="true_false">True/False</option>
            <option value="coding">Coding</option>
            <option value="essay">Essay</option>
            <option value="integer">Integer</option>
          </select>
        </div>
      </div>

      {/* Options for choice questions */}
      {(['single_choice', 'multiple_choice', 'multi_select'].includes(editedQuestion.question_type)) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Answer Options
          </label>
          <div className="space-y-2">
            {editedQuestion.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(editedQuestion.options || [])];
                    newOptions[index] = e.target.value;
                    setEditedQuestion({ ...editedQuestion, options: newOptions });
                  }}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type={editedQuestion.question_type === 'multi_select' ? 'checkbox' : 'radio'}
                  name={`correct-${editedQuestion.ordering}`}
                  checked={
                    Array.isArray(editedQuestion.correct_answer)
                      ? editedQuestion.correct_answer.includes(index)
                      : editedQuestion.correct_answer === index
                  }
                  onChange={(e) => {
                    if (editedQuestion.question_type === 'multi_select') {
                      const currentAnswers = Array.isArray(editedQuestion.correct_answer) 
                        ? editedQuestion.correct_answer 
                        : [];
                      if (e.target.checked) {
                        setEditedQuestion({ 
                          ...editedQuestion, 
                          correct_answer: [...currentAnswers, index] 
                        });
                      } else {
                        setEditedQuestion({ 
                          ...editedQuestion, 
                          correct_answer: currentAnswers.filter(i => i !== index) 
                        });
                      }
                    } else {
                      setEditedQuestion({ ...editedQuestion, correct_answer: index });
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* True/False specific */}
      {editedQuestion.question_type === 'true_false' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Correct Answer
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`tf-${editedQuestion.ordering}`}
                checked={editedQuestion.correct_answer === true}
                onChange={() => setEditedQuestion({ ...editedQuestion, correct_answer: true })}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">True</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`tf-${editedQuestion.ordering}`}
                checked={editedQuestion.correct_answer === false}
                onChange={() => setEditedQuestion({ ...editedQuestion, correct_answer: false })}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">False</span>
            </label>
          </div>
        </div>
      )}

      {/* Integer specific */}
      {editedQuestion.question_type === 'integer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Correct Answer (Number)
          </label>
          <input
            type="number"
            value={editedQuestion.correct_answer || ''}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              correct_answer: parseFloat(e.target.value) || 0 
            })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}
      
      {/* Coding question specific */}
      {editedQuestion.question_type === 'coding' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Programming Language
            </label>
            <select
              value={editedQuestion.code_language || 'python'}
              onChange={(e) => setEditedQuestion({ 
                ...editedQuestion, 
                code_language: e.target.value 
              })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c++">C++</option>
              <option value="c#">C#</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Starter Code (Optional)
            </label>
            <textarea
              value={editedQuestion.starter_code || ''}
              onChange={(e) => setEditedQuestion({ 
                ...editedQuestion, 
                starter_code: e.target.value 
              })}
              placeholder={`# Example for Python
def solution(input_value):
    # Student should implement this function
    pass

# Write your solution here`}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono resize-y h-32"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expected Output/Solution
            </label>
            <textarea
              value={editedQuestion.expected_output || ''}
              onChange={(e) => setEditedQuestion({ 
                ...editedQuestion, 
                expected_output: e.target.value,
                correct_answer: e.target.value // Set correct_answer to match expected_output for consistency
              })}
              placeholder="Enter the expected output or solution for grading"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono resize-y h-24"
            />
          </div>
        </div>
      )}
      
      {/* Essay question specific */}
      {editedQuestion.question_type === 'essay' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Answer Guidelines (Optional)
            </label>
            <textarea
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion({ 
                ...editedQuestion, 
                explanation: e.target.value 
              })}
              placeholder="Enter guidelines for the essay response (e.g., word count, structure, key points to address)"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scoring Rubric (Optional)
            </label>
            <textarea
              value={editedQuestion.correct_answer || ''}
              onChange={(e) => setEditedQuestion({ 
                ...editedQuestion, 
                correct_answer: e.target.value 
              })}
              placeholder="Enter a scoring rubric or key points that should be included in a good response"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y h-32"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ZenAssistant;
