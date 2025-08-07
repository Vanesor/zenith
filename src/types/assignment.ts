// Assignment system type definitions

export interface Question {
  id?: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'coding' | 'essay';
  marks: number;
  timeLimit: number | null;
  codeLanguage?: string;
  codeTemplate?: string;
  testCases: TestCase[];
  expectedOutput?: string;
  solution?: string;
  ordering: number;
  options: QuestionOption[];
}

export interface QuestionOption {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  ordering?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface AssignmentFormData {
  title: string;
  description: string;
  clubId: string | undefined;
  assignmentType: 'regular' | 'objective' | 'coding' | 'essay';
  targetAudience: 'club' | 'all_clubs' | 'specific_clubs';
  targetClubs: string[];
  dueDate: string;
  timeLimit: number;
  maxPoints: number;
  allowNavigation: boolean;
  instructions: string;
  passingScore: number;
  isProctored: boolean;
  shuffleQuestions: boolean;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: string;
}
