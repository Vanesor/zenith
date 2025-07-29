'use client';

import { useState } from 'react';
import { GripVertical, Eye, Edit, Trash2, Clock } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  title: string;
  description: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  timeLimit?: number;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  starterCode?: string;
  testCases?: Array<{ input: string; output: string }>;
}

interface DraggableQuestionItemProps {
  question: Question;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetIndex: number) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export function DraggableQuestionItem({
  question,
  index,
  onEdit,
  onDelete,
  onPreview,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverIndex
}: DraggableQuestionItemProps) {
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

  return (
    <>
      {/* Drop indicator above */}
      {dragOverIndex === index && (
        <div className="h-1 bg-blue-500 rounded-full mx-4 mb-2 transition-all duration-200" />
      )}
      
      <div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(index)}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 cursor-move group hover:shadow-md ${
          isDragging ? 'opacity-50 scale-95 shadow-lg' : ''
        }`}
      >
        <div className="flex items-start space-x-4">
          {/* Drag Handle */}
          <div className="flex-shrink-0 pt-1">
            <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </div>

          {/* Question Number */}
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {index + 1}
            </span>
          </div>

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                {getQuestionTypeIcon(question.type)} {question.type.replace('-', ' ')}
              </span>
              {question.difficulty && (
                <span className={`text-xs font-medium capitalize ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
              {question.title}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {question.description.length > 100 
                ? `${question.description.substring(0, 100)}...` 
                : question.description
              }
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onPreview}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Preview question"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit question"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Delete question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Drop indicator below */}
      {dragOverIndex === index + 1 && (
        <div className="h-1 bg-blue-500 rounded-full mx-4 mt-2 transition-all duration-200" />
      )}
    </>
  );
}
