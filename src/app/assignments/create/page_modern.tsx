"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Sparkles,
  Clock,
  Target,
  Users,
  BookOpen,
  Code,
  Brain,
  FileText,
  Lightbulb,
  Zap,
  Trophy,
  Calendar,
  Tag,
  Plus,
  Minus,
  Eye,
  Upload,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ModernZenChatbot from "@/components/ModernZenChatbot";
import TokenManager from "@/lib/TokenManager";

interface AssignmentForm {
  title: string;
  description: string;
  clubId: string;
  dueDate: string;
  maxPoints: number;
  difficulty: "easy" | "medium" | "hard";
  type: "quiz" | "project" | "coding" | "essay" | "presentation";
  estimatedTime: number;
  instructions: string;
  allowLateSubmission: boolean;
  isPublished: boolean;
}

const ModernCreateAssignment = () => {
  const { user } = useAuth();
  const { isAuthenticated } = useAuthGuard({
    redirectReason: "Please sign in to create assignments",
    redirectOnClose: true,
    redirectPath: "/login"
  });
  const router = useRouter();
  
  const [formData, setFormData] = useState<AssignmentForm>({
    title: "",
    description: "",
    clubId: "",
    dueDate: "",
    maxPoints: 100,
    difficulty: "medium",
    type: "project",
    estimatedTime: 60,
    instructions: "",
    allowLateSubmission: false,
    isPublished: false,
  });

  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    // Fetch clubs for the dropdown
    const fetchClubs = async () => {
      try {
        const tokenManager = TokenManager.getInstance();
        const response = await tokenManager.authenticatedFetch("/api/clubs");
        if (response.ok) {
          const data = await response.json();
          setClubs(data);
        }
      } catch (error) {
        console.error("Error fetching clubs:", error);
      }
    };

    if (isAuthenticated) {
      fetchClubs();
    }
  }, [isAuthenticated]);

  const handleInputChange = (field: keyof AssignmentForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    try {
      const tokenManager = TokenManager.getInstance();
      const response = await tokenManager.authenticatedFetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isPublished: !isDraft && formData.isPublished,
        }),
      });

      if (response.ok) {
        router.push("/assignments");
      } else {
        throw new Error("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "from-green-400 to-emerald-500";
      case "medium": return "from-yellow-400 to-orange-500";
      case "hard": return "from-red-400 to-pink-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "coding": return <Code className="w-5 h-5" />;
      case "quiz": return <Brain className="w-5 h-5" />;
      case "project": return <Target className="w-5 h-5" />;
      case "essay": return <FileText className="w-5 h-5" />;
      case "presentation": return <Users className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Assignment</h1>
                <p className="text-gray-600 dark:text-gray-400">Design engaging learning experiences</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index + 1 <= currentStep
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                      <p className="text-gray-600 dark:text-gray-400">Start with the fundamentals</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assignment Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter an engaging title..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe what students will learn and accomplish..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Club
                        </label>
                        <select
                          value={formData.clubId}
                          onChange={(e) => handleInputChange("clubId", e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                        >
                          <option value="">Select a club</option>
                          {clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                              {club.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.dueDate}
                          onChange={(e) => handleInputChange("dueDate", e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Assignment Type & Difficulty */}
              {currentStep === 2 && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assignment Configuration</h2>
                      <p className="text-gray-600 dark:text-gray-400">Choose type and difficulty</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Assignment Type
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { key: "project", label: "Project", icon: Target, color: "from-blue-500 to-cyan-500" },
                          { key: "quiz", label: "Quiz", icon: Brain, color: "from-green-500 to-emerald-500" },
                          { key: "coding", label: "Coding", icon: Code, color: "from-purple-500 to-pink-500" },
                          { key: "essay", label: "Essay", icon: FileText, color: "from-orange-500 to-red-500" },
                          { key: "presentation", label: "Presentation", icon: Users, color: "from-indigo-500 to-purple-500" },
                        ].map((type) => (
                          <button
                            key={type.key}
                            onClick={() => handleInputChange("type", type.key)}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              formData.type === type.key
                                ? `border-transparent bg-gradient-to-r ${type.color} text-white shadow-lg`
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            <type.icon className={`w-6 h-6 mx-auto mb-2 ${
                              formData.type === type.key ? "text-white" : "text-gray-600 dark:text-gray-400"
                            }`} />
                            <span className={`text-sm font-medium ${
                              formData.type === type.key ? "text-white" : "text-gray-700 dark:text-gray-300"
                            }`}>
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { key: "easy", label: "Easy", color: "from-green-400 to-emerald-500" },
                          { key: "medium", label: "Medium", color: "from-yellow-400 to-orange-500" },
                          { key: "hard", label: "Hard", color: "from-red-400 to-pink-500" },
                        ].map((difficulty) => (
                          <button
                            key={difficulty.key}
                            onClick={() => handleInputChange("difficulty", difficulty.key)}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              formData.difficulty === difficulty.key
                                ? `border-transparent bg-gradient-to-r ${difficulty.color} text-white shadow-lg`
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            <span className={`text-lg font-bold ${
                              formData.difficulty === difficulty.key ? "text-white" : "text-gray-700 dark:text-gray-300"
                            }`}>
                              {difficulty.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Maximum Points
                        </label>
                        <input
                          type="number"
                          value={formData.maxPoints}
                          onChange={(e) => handleInputChange("maxPoints", parseInt(e.target.value))}
                          min="1"
                          max="1000"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedTime}
                          onChange={(e) => handleInputChange("estimatedTime", parseInt(e.target.value))}
                          min="5"
                          max="480"
                          step="5"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Instructions */}
              {currentStep === 3 && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instructions & Guidelines</h2>
                      <p className="text-gray-600 dark:text-gray-400">Provide clear guidance for students</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Instructions
                      </label>
                      <textarea
                        value={formData.instructions}
                        onChange={(e) => handleInputChange("instructions", e.target.value)}
                        placeholder="Provide detailed instructions, requirements, and expectations..."
                        rows={8}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowLateSubmission}
                          onChange={(e) => handleInputChange("allowLateSubmission", e.target.checked)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Allow late submissions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Publish */}
              {currentStep === 4 && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review & Publish</h2>
                      <p className="text-gray-600 dark:text-gray-400">Final review before publishing</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Assignment Preview */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getDifficultyColor(formData.difficulty)} rounded-xl flex items-center justify-center`}>
                          {getTypeIcon(formData.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {formData.title || "Untitled Assignment"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {formData.description || "No description provided"}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.maxPoints} pts
                              </span>
                            </div>
                            <div className="text-center">
                              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.estimatedTime}m
                              </span>
                            </div>
                            <div className="text-center">
                              <Target className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.difficulty}
                              </span>
                            </div>
                            <div className="text-center">
                              <Calendar className="w-5 h-5 text-green-500 mx-auto mb-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : "No due date"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublished}
                          onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Publish immediately
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep} of {totalSteps}
                </span>

                {currentStep === totalSteps ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSubmit(false)}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {loading ? "Publishing..." : "Publish"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Tips</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use clear, actionable titles that indicate what students will accomplish</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Break complex assignments into smaller, manageable tasks</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Provide examples and resources to guide student learning</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Set realistic time estimates based on difficulty level</p>
                </div>
              </div>
            </div>

            {/* Assignment Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Difficulty</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(formData.difficulty)} text-white`}>
                    {formData.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formData.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Points</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formData.maxPoints}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModernZenChatbot />
    </div>
  );
};

export default ModernCreateAssignment;
