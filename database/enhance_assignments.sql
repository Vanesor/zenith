-- Zenith Forum - Enhanced Assignments System
-- Run this SQL in your Supabase SQL editor to enhance the assignment system

-- 1. Add new columns to the assignments table
ALTER TABLE public.assignments 
ADD COLUMN assignment_type VARCHAR DEFAULT 'regular' CHECK (assignment_type IN ('regular', 'objective', 'coding', 'essay')),
ADD COLUMN target_audience VARCHAR DEFAULT 'club' CHECK (target_audience IN ('club', 'all_clubs', 'specific_clubs')),
ADD COLUMN target_clubs VARCHAR[] DEFAULT '{}',
ADD COLUMN time_limit INTEGER, -- in minutes
ADD COLUMN allow_navigation BOOLEAN DEFAULT true,
ADD COLUMN instructions TEXT,
ADD COLUMN passing_score INTEGER DEFAULT 60,
ADD COLUMN is_proctored BOOLEAN DEFAULT false,
ADD COLUMN shuffle_questions BOOLEAN DEFAULT false;

-- 2. Create a questions table for objective assessments
CREATE TABLE public.assignment_questions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'coding', 'essay')),
  marks INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER, -- optional time limit per question in seconds
  code_language VARCHAR, -- for coding questions (python, java, c, etc.)
  code_template TEXT, -- starter code for coding questions
  test_cases JSONB, -- for automated testing of code
  expected_output TEXT, -- for coding questions
  solution TEXT, -- model answer or explanation
  ordering INTEGER NOT NULL DEFAULT 0, -- for question sequence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assignment_questions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE
);

-- 3. Create options table for multiple choice questions
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  ordering INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_options_pkey PRIMARY KEY (id),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES public.assignment_questions(id) ON DELETE CASCADE
);

-- 4. Enhance the assignment submissions table
ALTER TABLE public.assignment_submissions
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN violation_count INTEGER DEFAULT 0,
ADD COLUMN time_spent INTEGER, -- in seconds
ADD COLUMN auto_submitted BOOLEAN DEFAULT false,
ADD COLUMN ip_address VARCHAR,
ADD COLUMN user_agent TEXT,
ADD COLUMN total_score INTEGER DEFAULT 0;

-- 5. Create a table for individual question responses
CREATE TABLE public.question_responses (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_options UUID[], -- for multiple choice questions
  code_answer TEXT, -- for coding questions
  essay_answer TEXT, -- for essay questions
  is_correct BOOLEAN,
  score INTEGER DEFAULT 0,
  time_spent INTEGER, -- in seconds
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_responses_pkey PRIMARY KEY (id),
  CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES public.assignment_questions(id) ON DELETE CASCADE
);

-- 6. Create a table for security violations
CREATE TABLE public.assignment_violations (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL,
  violation_type VARCHAR NOT NULL, -- tab_switch, screen_extend, focus_loss, etc.
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  details JSONB,
  CONSTRAINT assignment_violations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE
);

-- 7. Create a table for code compilation results
CREATE TABLE public.code_results (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL,
  test_case_index INTEGER,
  passed BOOLEAN,
  stdout TEXT,
  stderr TEXT,
  execution_time INTEGER, -- in milliseconds
  memory_used INTEGER, -- in KB
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT code_results_pkey PRIMARY KEY (id),
  CONSTRAINT fk_response FOREIGN KEY (response_id) REFERENCES public.question_responses(id) ON DELETE CASCADE
);

-- 8. Create indexes for performance
CREATE INDEX idx_assignment_questions_assignment_id ON public.assignment_questions(assignment_id);
CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX idx_question_responses_submission_id ON public.question_responses(submission_id);
CREATE INDEX idx_question_responses_question_id ON public.question_responses(question_id);
CREATE INDEX idx_assignment_violations_submission_id ON public.assignment_violations(submission_id);
CREATE INDEX idx_code_results_response_id ON public.code_results(response_id);

-- Done! Your database schema is now ready for the enhanced assignments system
