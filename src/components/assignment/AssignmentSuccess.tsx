'use client';

import { CheckCircle, ExternalLink, Eye, Settings } from 'lucide-react';

interface AssignmentSuccessProps {
  assignmentId: string;
  assignmentTitle: string;
  onViewAssignment: () => void;
  onCreateAnother: () => void;
  onGoToDashboard: () => void;
  className?: string;
}

export function AssignmentSuccess({
  assignmentId,
  assignmentTitle,
  onViewAssignment,
  onCreateAnother,
  onGoToDashboard,
  className = ''
}: AssignmentSuccessProps) {
  return (
    <div className={`max-w-2xl mx-auto text-center ${className}`}>
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Assignment Created Successfully!
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Your assignment <strong>"{assignmentTitle}"</strong> has been created and is ready to use.
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Assignment ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{assignmentId}</code>
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            View Assignment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Preview how students will see this assignment
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <Settings className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Manage Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure additional options and permissions
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <ExternalLink className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Share Link
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share the assignment with your students
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onViewAssignment}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <Eye className="w-5 h-5 inline mr-2" />
          View Assignment
        </button>
        
        <button
          onClick={onCreateAnother}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Create Another Assignment
        </button>
        
        <button
          onClick={onGoToDashboard}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Go to Dashboard
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          What's Next?
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 text-left">
          <li>• Share the assignment link with your students</li>
          <li>• Set up notifications for submission alerts</li>
          <li>• Prepare grading rubrics for essay questions</li>
          <li>• Monitor student progress in real-time</li>
        </ul>
      </div>
    </div>
  );
}
