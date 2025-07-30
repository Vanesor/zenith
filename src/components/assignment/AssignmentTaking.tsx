'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Maximize, AlertTriangle, Save, Play } from 'lucide-react';

interface AssignmentTakingProps {
  assignment: {
    id: string;
    title: string;
    description: string;
    assignment_type: 'objective' | 'coding' | 'essay' | 'mixed';
    time_limit: number;
    coding_instructions?: string;
    objective_instructions?: string;
    mixed_instructions?: string;
    essay_instructions?: string;
    require_fullscreen?: boolean;
    auto_submit_on_violation?: boolean;
    max_violations?: number;
  };
  onStart: () => void;
}

export function AssignmentTaking({ assignment, onStart }: AssignmentTakingProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [beginText, setBeginText] = useState('');

  // Get type-specific instructions
  const getInstructions = () => {
    switch (assignment.assignment_type) {
      case 'coding':
        return assignment.coding_instructions || 'Write your code solution. Make sure to test your code thoroughly before submitting.';
      case 'objective':
        return assignment.objective_instructions || 'Choose the correct answer(s) for each question. For multi-select questions, you may choose multiple options.';
      case 'essay':
        return assignment.essay_instructions || 'Provide detailed written responses to the essay questions. Ensure your answers are well-structured and comprehensive.';
      case 'mixed':
        return assignment.mixed_instructions || 'This assignment contains different types of questions. Read each question carefully and provide appropriate answers.';
      default:
        return 'Read each question carefully and provide your best answer.';
    }
  };

  // Force fullscreen for all assignments
  const shouldRequireFullscreen = () => {
    return true; // Force fullscreen for all assignments
  };

  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // Exit fullscreen warning
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (!isCurrentlyFullscreen && hasStarted && shouldRequireFullscreen()) {
      const newViolations = violations + 1;
      setViolations(newViolations);
      
      // Show warning
      alert(`Warning: You exited fullscreen mode. Violation ${newViolations}/${assignment.max_violations || 3}`);
      
      // Auto-submit if too many violations
      if (assignment.auto_submit_on_violation && newViolations >= (assignment.max_violations || 3)) {
        alert('Assignment auto-submitted due to too many violations.');
        // Here you would call the auto-submit function
      }
    }
  }, [hasStarted, violations, assignment]);

  // Window visibility change detection
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && hasStarted) {
      const newViolations = violations + 1;
      setViolations(newViolations);
      
      // Show warning when they return
      setTimeout(() => {
        if (!document.hidden) {
          alert(`Warning: You switched windows/tabs. Violation ${newViolations}/${assignment.max_violations || 3}`);
          
          if (assignment.auto_submit_on_violation && newViolations >= (assignment.max_violations || 3)) {
            alert('Assignment auto-submitted due to too many violations.');
            // Here you would call the auto-submit function
          }
        }
      }, 100);
    }
  }, [hasStarted, violations, assignment]);

  // Prevent context menu and certain key combinations
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (hasStarted) {
      // Prevent common shortcuts that could be used to cheat
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        alert('This action is not allowed during the assignment.');
        return false;
      }
    }
  }, [hasStarted]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (hasStarted) {
      e.preventDefault();
      alert('Right-click is disabled during the assignment.');
    }
  }, [hasStarted]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleFullscreenChange, handleVisibilityChange, handleKeyDown, handleContextMenu]);

  // Handle start assignment
  const handleStartAssignment = () => {
    if (beginText.toLowerCase() !== 'begin') {
      alert('Please type "begin" to start the assignment.');
      return;
    }

    setHasStarted(true);
    setShowInstructions(false);
    
    if (shouldRequireFullscreen()) {
      enterFullscreen();
    }
    
    onStart();
  };

  if (!showInstructions) {
    // This would be replaced with the actual assignment interface
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {assignment.title}
            </h1>
            <div className="flex items-center space-x-4">
              {violations > 0 && (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Violations: {violations}/{assignment.max_violations || 3}</span>
                </div>
              )}
              <button className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                <Save className="w-4 h-4 mr-1" />
                Auto-saved
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Assignment Started Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is where the actual assignment interface would be rendered.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Features: Full-screen mode, auto-save, violation tracking, modern code editor, etc.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">{assignment.title}</h1>
          <p className="text-blue-100 text-lg">
            {assignment.assignment_type.charAt(0).toUpperCase() + assignment.assignment_type.slice(1)} Assignment
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Assignment Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Instructions</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {getInstructions()}
              </p>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {assignment.time_limit}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {assignment.assignment_type.charAt(0).toUpperCase() + assignment.assignment_type.slice(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                Required
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fullscreen</div>
            </div>
          </div>

          {/* Important Notes */}
          {(shouldRequireFullscreen() || assignment.auto_submit_on_violation) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Important Notes
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <ul className="text-red-800 dark:text-red-300 space-y-2">
                  {shouldRequireFullscreen() && (
                    <li>• This assignment requires fullscreen mode. Exiting fullscreen will be tracked as a violation.</li>
                  )}
                  {assignment.auto_submit_on_violation && (
                    <li>• Excessive violations (switching windows, exiting fullscreen) will result in automatic submission.</li>
                  )}
                  <li>• Right-click and certain keyboard shortcuts are disabled during the assignment.</li>
                  <li>• Your progress will be auto-saved every 30 seconds.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Start Section */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ready to Begin?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Type "begin" in the field below and click the start button to begin your assignment.
            </p>
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={beginText}
                onChange={(e) => setBeginText(e.target.value)}
                placeholder="Type 'begin' to start"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartAssignment();
                  }
                }}
              />
              <button
                onClick={handleStartAssignment}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Assignment
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
