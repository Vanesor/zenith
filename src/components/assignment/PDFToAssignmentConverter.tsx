'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Brain, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';

interface PDFUploadResult {
  success: boolean;
  assignmentId?: string;
  questionsGenerated?: number;
  error?: string;
}

interface PDFToAssignmentConverterProps {
  onAssignmentGenerated: (assignmentId: string) => void;
  onClose: () => void;
}

export function PDFToAssignmentConverter({ onAssignmentGenerated, onClose }: PDFToAssignmentConverterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<PDFUploadResult | null>(null);
  const [generationOptions, setGenerationOptions] = useState({
    assignmentTitle: '',
    assignmentType: 'mixed' as 'objective' | 'mixed' | 'coding',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 60,
    passingScore: 60,
    maxQuestions: 20,
    includeExplanations: true,
    shuffleQuestions: false,
    category: 'general'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
      // Auto-generate title from filename
      const fileName = file.name.replace('.pdf', '').replace(/[_-]/g, ' ');
      setGenerationOptions(prev => ({
        ...prev,
        assignmentTitle: prev.assignmentTitle || fileName
      }));
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProcessing(true);

    try {
      // Step 1: Upload PDF file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify(generationOptions));

      const uploadResponse = await fetch('/api/assignments/generate-from-pdf', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const uploadResult = await uploadResponse.json();
      setUploading(false);

      // Step 2: Monitor generation progress
      const generationId = uploadResult.generationId;
      await pollGenerationStatus(generationId);

    } catch (error) {
      console.error('Error processing PDF:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setUploading(false);
      setProcessing(false);
    }
  };

  const pollGenerationStatus = async (generationId: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/assignments/generation-status/${generationId}`);
        if (!response.ok) throw new Error('Failed to check status');

        const status = await response.json();

        if (status.status === 'completed') {
          setResult({
            success: true,
            assignmentId: status.assignmentId,
            questionsGenerated: status.questionsGenerated
          });
          setProcessing(false);
          return;
        }

        if (status.status === 'failed') {
          setResult({
            success: false,
            error: status.error || 'Generation failed'
          });
          setProcessing(false);
          return;
        }

        // Continue polling if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          throw new Error('Generation timeout');
        }
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Generation failed'
        });
        setProcessing(false);
      }
    };

    poll();
  };

  const handleViewGeneratedAssignment = () => {
    if (result?.assignmentId) {
      onAssignmentGenerated(result.assignmentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Assignment Generator</h2>
                <p className="text-purple-100">Generate assignments from PDF documents</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: File Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              1. Upload PDF Document
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                selectedFile 
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Click to upload a PDF document
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports question papers, study materials, and textbook chapters
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Generation Options */}
          {selectedFile && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Configure Generation Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={generationOptions.assignmentTitle}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, assignmentTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter assignment title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Type
                  </label>
                  <select
                    value={generationOptions.assignmentType}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, assignmentType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="objective">Objective (MCQ/True-False)</option>
                    <option value="mixed">Mixed (MCQ + Essay)</option>
                    <option value="coding">Coding Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={generationOptions.difficulty}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={generationOptions.timeLimit}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={generationOptions.maxQuestions}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, maxQuestions: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={generationOptions.passingScore}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generationOptions.includeExplanations}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, includeExplanations: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    Include answer explanations
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generationOptions.shuffleQuestions}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">
                    Shuffle questions for each student
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {(uploading || processing) && (
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800 dark:text-blue-400">
                    {uploading ? 'Uploading PDF...' : 'AI is analyzing the document and generating questions...'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-500">
                  This may take a few minutes depending on the document size and complexity.
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mb-6">
              {result.success ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <span className="text-green-800 dark:text-green-400 font-medium">
                      Assignment Generated Successfully!
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-500 mb-3">
                    {result.questionsGenerated} questions were extracted and created from your PDF.
                  </p>
                  <button
                    onClick={handleViewGeneratedAssignment}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Generated Assignment
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                    <span className="text-red-800 dark:text-red-400 font-medium">
                      Generation Failed
                    </span>
                  </div>
                  <p className="text-red-700 dark:text-red-500">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            
            <button
              onClick={handleUploadAndGenerate}
              disabled={!selectedFile || uploading || processing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : processing ? 'Generating...' : 'Generate Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
