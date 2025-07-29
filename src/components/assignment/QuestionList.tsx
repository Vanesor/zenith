'use client';

import { useState } from 'react';
import { Eye, Edit, Trash2, ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';
import { QuestionPreviewModal } from './QuestionPreviewModal';
import { ConfirmationModal } from './ConfirmationModal';

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
  testCases?: Array<{ input: string; output: string }>;
}

interface QuestionListProps {
  questions: Question[];
  onEditQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
  className?: string;
}

export function QuestionList({ questions, onEditQuestion, onDeleteQuestion, className = '' }: QuestionListProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    questionIndex: number;
    questionTitle: string;
  }>({
    isOpen: false,
    questionIndex: -1,
    questionTitle: ''
  });

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleDeleteClick = (index: number) => {
    setDeleteConfirmation({
      isOpen: true,
      questionIndex: index,
      questionTitle: questions[index].title
    });
  };

  const confirmDelete = () => {
    onDeleteQuestion(deleteConfirmation.questionIndex);
    setDeleteConfirmation({
      isOpen: false,
      questionIndex: -1,
      questionTitle: ''
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return '●';
      case 'true-false':
        return '✓';
      case 'short-answer':
        return '✎';
      case 'essay':
        return '📝';
      case 'coding':
        return '💻';
      default:
        return '?';
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'true-false':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'short-answer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'essay':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'coding':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'hard':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTotalPoints = () => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  const getTotalTime = () => {
    return questions.reduce((total, question) => total + (question.timeLimit || 0), 0);
  };

  if (questions.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No questions added yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add questions to your assignment to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Stats */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {questions.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Questions
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {getTotalPoints()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Points
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {getTotalTime()}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Time
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Question Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                      {getQuestionTypeIcon(question.type)} {question.type.replace('-', ' ')}
                    </span>
                    {question.difficulty && (
                      <span className={`text-xs font-medium capitalize ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                    {question.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <span className="font-medium">{question.points}</span> points
                    </span>
                    {question.timeLimit && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {question.timeLimit}m
                      </span>
                    )}
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {question.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {question.tags.length > 2 && (
                          <span className="text-xs">+{question.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setPreviewQuestion(question)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Preview question"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditQuestion(index)}
                    className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(index)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    title={expandedQuestions.has(index) ? "Collapse" : "Expand"}
                  >
                    {expandedQuestions.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedQuestions.has(index) && (
              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: question.description.replace(/\n/g, '<br>')
                    }}
                  />
                </div>

                {/* Show options for multiple choice and true/false */}
                {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options:
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded-lg text-sm ${
                            question.correctAnswer === optionIndex
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                          {question.correctAnswer === optionIndex && (
                            <span className="ml-2 text-xs font-medium">(Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show coding details */}
                {question.type === 'coding' && (
                  <div className="mt-4 space-y-4">
                    {question.language && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language: <span className="font-normal">{question.language}</span>
                        </h4>
                      </div>
                    )}
                    
                    {question.starterCode && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Starter Code:
                        </h4>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                          <code>{question.starterCode}</code>
                        </pre>
                      </div>
                    )}

                    {question.testCases && question.testCases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Test Cases:
                        </h4>
                        <div className="space-y-2">
                          {question.testCases.slice(0, 3).map((testCase, testIndex) => (
                            <div key={testIndex} className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium text-gray-500 dark:text-gray-400">Input:</span>
                                  <pre className="mt-1 text-gray-800 dark:text-gray-200">{testCase.input}</pre>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500 dark:text-gray-400">Expected:</span>
                                  <pre className="mt-1 text-gray-800 dark:text-gray-200">{testCase.output}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                          {question.testCases.length > 3 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              +{question.testCases.length - 3} more test cases
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Question"
        message={`Are you sure you want to delete "${deleteConfirmation.questionTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, questionIndex: -1, questionTitle: '' })}
      />
    </div>
  );
}
