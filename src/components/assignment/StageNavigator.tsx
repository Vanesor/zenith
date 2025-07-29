'use client';

import { CheckCircle, Circle, ChevronRight } from 'lucide-react';

interface Stage {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface StageNavigatorProps {
  currentStage: string;
  stages: Stage[];
  onStageChange: (stageId: string) => void;
}

export function StageNavigator({ currentStage, stages, onStageChange }: StageNavigatorProps) {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Assignment Creation Progress
      </h2>
      
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isActive = stage.id === currentStage;
          const isPast = index < currentIndex;
          const isClickable = isPast || isActive;

          return (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStageChange(stage.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : isPast
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                  } ${isClickable ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                  disabled={!isClickable}
                >
                  {isPast ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 
                    isPast ? 'text-green-600 dark:text-green-400' : 
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stage.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-24 mt-1">
                    {stage.description}
                  </p>
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-4 ${
                  index < currentIndex ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
