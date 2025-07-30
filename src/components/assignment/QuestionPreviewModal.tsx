'use client';

import { X, Eye } from 'lucide-react';

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
  testCases?: Array<{ input: string; output: string; isHidden?: boolean }>;
  explanation?: string;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
}

interface QuestionPreviewModalProps {
  question: Question;
  onClose: () => void;
}

export function QuestionPreviewModal({ question, onClose }: QuestionPreviewModalProps) {
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'multi-select':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
      case 'true-false':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'short-answer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'essay':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'coding':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'integer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Question Preview
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuestionTypeColor(question.type)}`}>
                {question.type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{question.points}</strong> points
              </span>
              {question.timeLimit && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{question.timeLimit}</strong> minutes
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Question Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {question.title}
              </h3>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(question.description) }}
              />
            </div>

            {/* Multiple Choice / Multi-Select / True-False Options */}
            {(question.type === 'multiple-choice' || question.type === 'multi-select' || question.type === 'true-false') && question.options && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Answer Options:
                </h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => {
                    const isCorrect = question.type === 'multi-select' 
                      ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(index)
                      : question.correctAnswer === index;
                    
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          isCorrect
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                      >
                        <div className={`flex items-start space-x-3 ${
                          isCorrect
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-gray-800 dark:text-gray-300'
                        }`}>
                          <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div 
                            className="flex-1"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(option) }}
                          />
                          {isCorrect && (
                            <span className="flex-shrink-0 text-xs font-medium bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coding Question Details */}
            {question.type === 'coding' && (
              <div className="space-y-4">
                {question.language && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Programming Language:
                    </h4>
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm">
                      {question.language}
                    </div>
                  </div>
                )}

                {question.starterCode && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starter Code:
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{question.starterCode}</code>
                    </pre>
                  </div>
                )}

                {question.testCases && question.testCases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Test Cases:
                    </h4>
                    <div className="space-y-3">
                      {question.testCases.map((testCase, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Input:
                              </h5>
                              <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Expected Output:
                              </h5>
                              <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                                {testCase.output}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Essay Question Guidelines */}
            {question.type === 'essay' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Essay Question Guidelines:
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Students will provide a written response to this question. 
                  {question.timeLimit && ` They will have ${question.timeLimit} minutes to complete their answer.`}
                </p>
              </div>
            )}

            {/* Short Answer Guidelines */}
            {question.type === 'short-answer' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  Short Answer Guidelines:
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Students will provide a brief written response to this question.
                  {question.timeLimit && ` They will have ${question.timeLimit} minutes to complete their answer.`}
                </p>
              </div>
            )}
            
            {/* Integer Question Guidelines */}
            {question.type === 'integer' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
                  Integer Question Guidelines:
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Students will provide an integer number as their answer.
                  {question.minValue !== undefined && question.maxValue !== undefined && 
                    ` Answer must be between ${question.minValue} and ${question.maxValue}.`}
                  {question.minValue !== undefined && question.maxValue === undefined && 
                    ` Answer must be at least ${question.minValue}.`}
                  {question.minValue === undefined && question.maxValue !== undefined && 
                    ` Answer must be at most ${question.maxValue}.`}
                  {question.stepValue && question.stepValue > 1 && 
                    ` Values must be in steps of ${question.stepValue}.`}
                </p>
              </div>
            )}
            
            {/* Display correct answer section for all question types */}
            {(question.type === 'multiple-choice' || question.type === 'multi-select' || question.type === 'true-false' || question.type === 'integer') && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  Correct Answer{question.type === 'multi-select' ? 's' : ''}:
                </h4>
                <div className="font-medium text-green-700 dark:text-green-400">
                  {question.type === 'multiple-choice' && question.options && 
                    typeof question.correctAnswer === 'number' && 
                    question.options[question.correctAnswer]}
                  
                  {question.type === 'multi-select' && question.options && 
                    Array.isArray(question.correctAnswer) && 
                    question.correctAnswer.map(index => question.options![index]).join(', ')}
                  
                  {question.type === 'true-false' && 
                    (question.correctAnswer === true ? 'True' : 'False')}
                  
                  {question.type === 'integer' && typeof question.correctAnswer === 'number' && (
                    <>{question.correctAnswer}</>
                  )}
                </div>
              </div>
            )}

            {/* Question Tags */}
            {question.tags && question.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
