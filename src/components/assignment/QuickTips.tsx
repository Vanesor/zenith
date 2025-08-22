'use client';

import { useState } from 'react';
import { X, Lightbulb, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface QuickTipsProps {
  currentStage: string;
  className?: string;
}

export function QuickTips({ currentStage, className = '' }: QuickTipsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-zenith-primary hover:bg-zenith-primary/90 text-primary rounded-full shadow-lg transition-colors z-40"
        title="Show tips"
      >
        <Lightbulb className="w-5 h-5" />
      </button>
    );
  }

  const getTipsForStage = (stage: string) => {
    switch (stage) {
      case 'basic':
        return {
          title: 'Basic Information',
          tips: [
            'Use a clear, descriptive title that students will understand',
            'Add detailed instructions in the description',
            'Use markdown formatting for better readability',
            'Set appropriate deadlines considering student schedules'
          ],
          icon: <CheckCircle className="w-5 h-5 text-green-500" />
        };
      case 'settings':
        return {
          title: 'Test Settings',
          tips: [
            'Choose shuffle options to prevent cheating',
            'Enable plagiarism detection for coding questions',
            'Set appropriate attempt limits',
            'Consider allowing practice attempts'
          ],
          icon: <AlertCircle className="w-5 h-5 text-primary" />
        };
      case 'scoring':
        return {
          title: 'Marks & Time',
          tips: [
            'Allocate time based on question difficulty',
            'Allow extra time for students with accommodations',
            'Set passing grade according to your standards',
            'Consider bonus points for exceptional work'
          ],
          icon: <Clock className="w-5 h-5 text-yellow-500" />
        };
      case 'questions':
        return {
          title: 'Questions',
          tips: [
            'Mix different question types for comprehensive assessment',
            'Use drag-and-drop to reorder questions by difficulty',
            'Preview questions before adding them',
            'Check that total time matches your time limit'
          ],
          icon: <Lightbulb className="w-5 h-5 text-purple-500" />
        };
      default:
        return {
          title: 'General Tips',
          tips: [
            'Save your progress frequently',
            'Preview the entire assignment before publishing',
            'Test with sample data first',
            'Keep accessibility in mind'
          ],
          icon: <Lightbulb className="w-5 h-5 text-zenith-muted" />
        };
    }
  };

  const currentTips = getTipsForStage(currentStage);

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {currentTips.icon}
          <div className="flex-1">
            <h3 className="font-semibold text-primary mb-2 flex items-center">
              Quick Tips: {currentTips.title}
            </h3>
            <ul className="space-y-1">
              {currentTips.tips.map((tip, index) => (
                <li key={index} className="text-sm text-zenith-secondary dark:text-zenith-muted flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 text-zenith-muted hover:text-zenith-secondary dark:hover:text-gray-300 transition-colors"
          title="Hide tips"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
