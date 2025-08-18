"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Clock,
  ArrowLeft,
  Flag,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Send,
  Timer,
  Target,
  BookOpen,
  Brain,
  Code,
  FileText,
  Users,
  Lightbulb,
  Zap,
  Trophy,
  Star,
  Heart,
  Shield,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TokenManager from "@/lib/TokenManager";

interface Question {
  id: string;
  type: "multiple-choice" | "multi-select" | "true-false" | "short-answer" | "essay" | "coding";
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number | boolean | number[];
  points: number;
  timeLimit?: number;
  code?: string;
  language?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  maxPoints: number;
  questions: Question[];
  difficulty: "easy" | "medium" | "hard";
  type: "quiz" | "project" | "coding" | "essay" | "presentation";
  club: { id: string; name: string; color?: string; icon?: string };
}

const ModernTakeAssignment = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useAuthGuard({
    redirectReason: "Please sign in to take assignments",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState<Record<number, number>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sample assignment data
  const sampleAssignment: Assignment = {
    id: assignmentId,
    title: "React Component Architecture",
    description: "Test your understanding of React components, hooks, and state management",
    instructions: "Read each question carefully. You have 60 minutes to complete this assignment. Make sure to review your answers before submitting.",
    timeLimit: 3600, // 60 minutes in seconds
    maxPoints: 100,
    difficulty: "medium",
    type: "quiz",
    club: { id: "tech", name: "Tech Club", color: "#3B82F6", icon: "💻" },
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        title: "What is the purpose of useEffect in React?",
        description: "Choose the most accurate description of the useEffect hook.",
        options: [
          "To manage component state",
          "To handle side effects in functional components",
          "To create reusable components",
          "To optimize component rendering"
        ],
        points: 10,
        timeLimit: 120,
      },
      {
        id: "q2",
        type: "multi-select",
        title: "Which of the following are valid React hooks?",
        description: "Select all that apply.",
        options: [
          "useState",
          "useEffect",
          "useContext",
          "useClass",
          "useReducer"
        ],
        points: 15,
        timeLimit: 150,
      },
      {
        id: "q3",
        type: "short-answer",
        title: "Explain the difference between props and state",
        description: "Provide a brief explanation (2-3 sentences) of how props and state differ in React.",
        points: 20,
        timeLimit: 300,
      },
      {
        id: "q4",
        type: "coding",
        title: "Create a Counter Component",
        description: "Write a React functional component that implements a simple counter with increment and decrement buttons.",
        points: 25,
        timeLimit: 600,
        language: "javascript",
        code: `import React, { useState } from 'react';

const Counter = () => {
  // Your code here
  
  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
};

export default Counter;`
      },
    ]
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // const tokenManager = TokenManager.getInstance();
        // const response = await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}/take`);
        
        // For now, use sample data
        setTimeout(() => {
          setAssignment(sampleAssignment);
          setTimeRemaining(sampleAssignment.timeLimit);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching assignment:", error);
        setLoading(false);
      }
    };

    if (isAuthenticated && assignmentId) {
      fetchAssignment();
    }
  }, [isAuthenticated, assignmentId]);

  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && !showInstructions) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, isPaused, showInstructions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, submit to API
      // const tokenManager = TokenManager.getInstance();
      // await tokenManager.authenticatedFetch(`/api/assignments/${assignmentId}/submit`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ answers })
      // });
      
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push(`/assignments/${assignmentId}/results`);
    } catch (error) {
      console.error("Error submitting assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAssignment = () => {
    setShowInstructions(false);
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / (assignment?.questions.length || 1)) * 100;
  };

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id];

    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="space-y-4">
            {question.options?.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  answer === optionIndex
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={optionIndex}
                  checked={answer === optionIndex}
                  onChange={() => handleAnswerChange(question.id, optionIndex)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-4 text-gray-900 dark:text-white font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case "multi-select":
        return (
          <div className="space-y-4">
            {question.options?.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  answer?.includes(optionIndex)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={answer?.includes(optionIndex) || false}
                  onChange={() => {
                    const currentAnswers = answer || [];
                    const newAnswers = currentAnswers.includes(optionIndex)
                      ? currentAnswers.filter((a: number) => a !== optionIndex)
                      : [...currentAnswers, optionIndex];
                    handleAnswerChange(question.id, newAnswers);
                  }}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-4 text-gray-900 dark:text-white font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case "short-answer":
        return (
          <textarea
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none transition-all duration-200"
          />
        );

      case "essay":
        return (
          <textarea
            value={answer || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay here..."
            className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none transition-all duration-200"
          />
        );

      case "coding":
        return (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
              <span className="text-gray-300 text-sm font-medium">
                Language: {question.language || "JavaScript"}
              </span>
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={answer || question.code || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full h-80 p-4 bg-gray-900 text-gray-100 font-mono text-sm border-0 focus:ring-0 focus:outline-none resize-none"
              style={{ fontFamily: "Fira Code, Consolas, Monaco, monospace" }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !isAuthenticated) {
    return null;
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                    {assignment.club.icon}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
                    <p className="text-white/80">{assignment.club.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assignment Overview</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {assignment.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <Timer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Time Limit</p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-300">
                      {Math.floor(assignment.timeLimit / 60)} min
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Points</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-300">
                      {assignment.maxPoints}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                    <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Questions</p>
                    <p className="text-lg font-bold text-purple-800 dark:text-purple-300">
                      {assignment.questions.length}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                    <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Difficulty</p>
                    <p className="text-lg font-bold text-orange-800 dark:text-orange-300 capitalize">
                      {assignment.difficulty}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Instructions</h3>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 leading-relaxed">
                    {assignment.instructions}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={startAssignment}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors font-medium flex items-center gap-2 transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Start Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{assignment.title}</h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                Question {currentQuestion + 1} of {assignment.questions.length}
              </span>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
              timeRemaining < 300 ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
              timeRemaining < 900 ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
              "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="ml-2 w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center hover:bg-white/70 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{Object.keys(answers).length} answered</span>
              <span>{flaggedQuestions.size} flagged</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
                <button
                  onClick={() => setShowQuestionNav(!showQuestionNav)}
                  className="lg:hidden w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                >
                  {showQuestionNav ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
              
              <div className={`grid grid-cols-5 lg:grid-cols-4 gap-2 ${showQuestionNav ? 'block' : 'hidden lg:grid'}`}>
                {assignment.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`relative w-12 h-12 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      index === currentQuestion
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : answers[assignment.questions[index].id]
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {index + 1}
                    {flaggedQuestions.has(index) && (
                      <Flag className="absolute -top-1 -right-1 w-3 h-3 text-red-500" fill="currentColor" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Not answered</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Flag className="w-3 h-3 text-red-500" fill="currentColor" />
                  <span className="text-gray-600 dark:text-gray-400">Flagged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Question Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                        {assignment.questions[currentQuestion].points} points
                      </span>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium capitalize">
                        {assignment.questions[currentQuestion].type.replace('-', ' ')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {assignment.questions[currentQuestion].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {assignment.questions[currentQuestion].description}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                      flaggedQuestions.has(currentQuestion)
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Flag className="w-5 h-5" fill={flaggedQuestions.has(currentQuestion) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-8">
                {renderQuestion(assignment.questions[currentQuestion], currentQuestion)}

                {/* Confidence Level */}
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How confident are you in your answer?
                  </label>
                  <div className="flex items-center gap-4">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfidenceLevel(prev => ({ ...prev, [currentQuestion]: level }))}
                        className={`w-10 h-10 rounded-full font-medium text-sm transition-all duration-300 transform hover:scale-110 ${
                          confidenceLevel[currentQuestion] === level
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>Not confident</span>
                    <span>Very confident</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <button className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Progress
                  </button>
                </div>

                {currentQuestion === assignment.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Assignment
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(assignment.questions.length - 1, currentQuestion + 1))}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors font-medium transform hover:scale-105"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTakeAssignment;
