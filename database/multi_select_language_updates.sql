-- Schema updates for multi-select questions and flexible language support
-- Run these updates to modify the existing database schema

-- 1. Update assignment_questions table to support multi-select and language flexibility

-- Add multi_select to question_type constraint
ALTER TABLE public.assignment_questions 
DROP CONSTRAINT IF EXISTS assignment_questions_question_type_check;

ALTER TABLE public.assignment_questions 
ADD CONSTRAINT assignment_questions_question_type_check 
CHECK (question_type::text = ANY (ARRAY[
    'single_choice'::character varying::text, 
    'multiple_choice'::character varying::text, 
    'multi_select'::character varying::text,
    'coding'::character varying::text, 
    'essay'::character varying::text, 
    'true_false'::character varying::text, 
    'integer'::character varying::text
]));

-- Change correct_answer to support JSON for multi-select (array of indices)
ALTER TABLE public.assignment_questions 
ALTER COLUMN correct_answer TYPE jsonb USING correct_answer::jsonb;

-- Add language flexibility fields for coding questions
ALTER TABLE public.assignment_questions 
ADD COLUMN IF NOT EXISTS allowed_languages jsonb DEFAULT '[]'::jsonb; 

ALTER TABLE public.assignment_questions 
ADD COLUMN IF NOT EXISTS allow_any_language boolean DEFAULT false;

-- Make code_language optional (it already is, but this clarifies intent)
-- code_language will be NULL if allow_any_language is true
-- code_language will have specific language if question restricts to one language
-- allowed_languages will have array of languages if multiple are allowed

-- 2. Update assignment_attempts table to support modern test platform features

-- Add full-screen mode tracking
ALTER TABLE public.assignment_attempts 
ADD COLUMN IF NOT EXISTS is_fullscreen boolean DEFAULT false;

-- Add auto-save state for coding questions
ALTER TABLE public.assignment_attempts 
ADD COLUMN IF NOT EXISTS auto_save_data jsonb DEFAULT '{}'::jsonb;

-- Add window/tab change violations tracking
ALTER TABLE public.assignment_attempts 
ADD COLUMN IF NOT EXISTS window_violations integer DEFAULT 0;

-- Add last auto-save timestamp
ALTER TABLE public.assignment_attempts 
ADD COLUMN IF NOT EXISTS last_auto_save timestamp with time zone;

-- Add browser/environment details
ALTER TABLE public.assignment_attempts 
ADD COLUMN IF NOT EXISTS browser_info jsonb DEFAULT '{}'::jsonb;

-- 3. Update assignment_violations table to support new violation types

-- The existing structure is fine, but we should document the new violation types:
-- - 'window_change': User switched windows/tabs
-- - 'fullscreen_exit': User exited fullscreen mode
-- - 'copy_paste': User attempted copy/paste
-- - 'right_click': User attempted right-click
-- - 'developer_tools': User opened developer tools
-- - 'auto_submit': Assignment was auto-submitted due to violations

-- 4. Update assignments table to support instruction display

-- Add specific instructions for different question types
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS coding_instructions text DEFAULT 'Write your code solution. Make sure to test your code thoroughly before submitting.';

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS objective_instructions text DEFAULT 'Choose the correct answer(s) for each question. For multi-select questions, you may choose multiple options.';

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS mixed_instructions text DEFAULT 'This assignment contains different types of questions. Read each question carefully and provide appropriate answers.';

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS essay_instructions text DEFAULT 'Provide detailed written responses to the essay questions. Ensure your answers are well-structured and comprehensive.';

-- Add proctoring settings
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS require_fullscreen boolean DEFAULT false;

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS auto_submit_on_violation boolean DEFAULT false;

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS max_violations integer DEFAULT 3;

-- Add code editor preferences
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS code_editor_settings jsonb DEFAULT '{
    "theme": "vs-dark",
    "fontSize": 14,
    "wordWrap": true,
    "autoSave": true,
    "autoSaveInterval": 30000
}'::jsonb;

-- 5. Create new table for tracking coding question submissions with multiple languages

CREATE TABLE IF NOT EXISTS public.coding_submissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    question_response_id uuid NOT NULL,
    language character varying NOT NULL,
    code text NOT NULL,
    is_final boolean DEFAULT false,
    execution_result jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT coding_submissions_pkey PRIMARY KEY (id),
    CONSTRAINT coding_submissions_question_response_id_fkey 
        FOREIGN KEY (question_response_id) REFERENCES public.question_responses(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_coding_submissions_question_response 
    ON public.coding_submissions(question_response_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_language 
    ON public.coding_submissions(language);

-- 6. Update question_responses table to support multi-select answers

-- The selected_options array already exists and can handle multi-select
-- But let's add a field to track the selected language for coding questions
ALTER TABLE public.question_responses 
ADD COLUMN IF NOT EXISTS selected_language character varying;

-- Add auto-save tracking
ALTER TABLE public.question_responses 
ADD COLUMN IF NOT EXISTS last_auto_save timestamp with time zone;

-- Add attempt tracking for coding questions (compile attempts, test runs, etc.)
ALTER TABLE public.question_responses 
ADD COLUMN IF NOT EXISTS attempt_history jsonb DEFAULT '[]'::jsonb;

-- 7. Create indexes for better performance

-- Multi-select questions will query correct_answer as jsonb
CREATE INDEX IF NOT EXISTS idx_assignment_questions_correct_answer_jsonb 
    ON public.assignment_questions USING gin(correct_answer);

-- Language queries
CREATE INDEX IF NOT EXISTS idx_assignment_questions_language_settings 
    ON public.assignment_questions(code_language, allow_any_language);

-- Auto-save queries
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_auto_save 
    ON public.assignment_attempts(assignment_id, user_id, last_auto_save);

-- Violation tracking
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_violations 
    ON public.assignment_attempts(assignment_id, window_violations);

-- Comments explaining the schema changes:

/*
MULTI-SELECT SUPPORT:
- question_type now includes 'multi_select'
- correct_answer is now jsonb to support arrays like [0, 2, 4] for multiple correct options
- For single choice: correct_answer = 1 (number)
- For multi-select: correct_answer = [0, 2] (array of numbers)

LANGUAGE FLEXIBILITY:
- allow_any_language: boolean - if true, user can choose any supported language
- allowed_languages: jsonb array - if set, user can choose from these languages
- code_language: string - if set and allow_any_language is false, user must use this language
- Examples:
  * Fixed language: code_language = "python", allow_any_language = false, allowed_languages = []
  * Multiple allowed: allowed_languages = ["python", "java", "cpp"], allow_any_language = false
  * Any language: allow_any_language = true, code_language = null, allowed_languages = []

MODERN TEST PLATFORM FEATURES:
- Full-screen mode enforcement
- Auto-save functionality with timestamps
- Window/tab change detection and violation tracking
- Browser environment tracking
- Auto-submission on excessive violations
- Detailed attempt history and execution results

INSTRUCTION SYSTEM:
- Type-specific instructions for different assignment types
- Customizable per assignment
- Supports rich text formatting
*/
