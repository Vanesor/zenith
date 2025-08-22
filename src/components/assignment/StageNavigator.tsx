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
    <div className="bg-card rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-primary mb-4">
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                    isActive
                      ? 'bg-zenith-primary text-primary shadow-lg scale-110 border-zenith-primary'
                      : isPast
                      ? 'bg-green-600 text-primary hover:bg-green-700 cursor-pointer border-green-600'
                      : 'bg-white dark:bg-gray-800 text-primary dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-zenith-hover dark:hover:bg-gray-700'
                  } ${isClickable ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                  disabled={!isClickable}
                >
                  {isPast ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </button>
                
                <div className="mt-3 text-center">
                  <p className={`text-sm font-semibold ${
                    isActive ? 'text-primary dark:text-blue-400' : 
                    isPast ? 'text-green-600 dark:text-green-400' : 
                    'text-zenith-secondary dark:text-gray-300'
                  }`}>
                    {stage.title}
                  </p>
                  <p className="text-xs text-zenith-muted dark:text-gray-400 max-w-24 mt-1">
                    {stage.description}
                  </p>
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-4 ${
                  index < currentIndex ? 'text-green-600' : 'text-gray-300 dark:text-zenith-secondary'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
