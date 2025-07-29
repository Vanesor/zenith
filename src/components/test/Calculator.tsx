'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isResultShown, setIsResultShown] = useState(false);

  const handleNumber = (num: string) => {
    if (isResultShown) {
      setDisplay(num);
      setIsResultShown(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
    setIsResultShown(false);
  };

  const handleEquals = () => {
    try {
      const result = eval(equation + display);
      setDisplay(result.toString());
      setEquation('');
      setIsResultShown(true);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
      setIsResultShown(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsResultShown(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Calculator
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 h-6">
            {equation}
          </div>
          <div className="text-2xl font-mono text-gray-900 dark:text-white text-right">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleClear}
            className="col-span-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold"
          >
            Clear
          </button>
          <button
            onClick={handleBackspace}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-semibold"
          >
            ⌫
          </button>
          <button
            onClick={() => handleOperator('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
          >
            ÷
          </button>

          {['7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white p-3 rounded-lg font-semibold"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('*')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
          >
            ×
          </button>

          {['4', '5', '6'].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white p-3 rounded-lg font-semibold"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
          >
            −
          </button>

          {['1', '2', '3'].map(num => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white p-3 rounded-lg font-semibold"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('+')}
            className="row-span-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
          >
            +
          </button>

          <button
            onClick={() => handleNumber('0')}
            className="col-span-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white p-3 rounded-lg font-semibold"
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white p-3 rounded-lg font-semibold"
          >
            .
          </button>

          <button
            onClick={handleEquals}
            className="col-span-4 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold mt-2"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
