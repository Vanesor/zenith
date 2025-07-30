-- Update schema for enhanced assignment system
-- This adds missing columns and tables needed for the comprehensive test system

-- Add missing columns to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update assignments table with new columns
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_calculator boolean DEFAULT true;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS show_results boolean DEFAULT true;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_review boolean DEFAULT true;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS shuffle_options boolean DEFAULT false;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT 1;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Update assignment_questions table to match our enhanced system
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS type character varying;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS title character varying;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS correct_answer text;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS points integer DEFAULT 1;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS question_order integer DEFAULT 0;
ALTER TABLE public.assignment_questions ADD COLUMN IF NOT EXISTS starter_code text;

-- Create assignment_attempts table (new table for tracking attempts)
CREATE TABLE IF NOT EXISTS public.assignment_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  end_time timestamp with time zone,
  time_spent integer DEFAULT 0,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  percentage numeric(5,2) DEFAULT 0,
  is_passing boolean DEFAULT false,
  answers jsonb DEFAULT '{}'::jsonb,
  graded_answers jsonb DEFAULT '{}'::jsonb,
  violations jsonb DEFAULT '[]'::jsonb,
  status character varying DEFAULT 'in_progress',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assignment_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_attempts_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE,
  CONSTRAINT assignment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create assignment_audit_log table (new table for audit logging)
CREATE TABLE IF NOT EXISTS public.assignment_audit_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempt_id uuid,
  action character varying NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assignment_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_audit_log_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE,
  CONSTRAINT assignment_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT assignment_audit_log_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assignment_attempts(id) ON DELETE CASCADE
);

-- Update question_type values to match our system
UPDATE public.assignment_questions SET type = 
  CASE 
    WHEN question_type = 'single_choice' THEN 'multiple-choice'
    WHEN question_type = 'multiple_choice' THEN 'multiple-choice'
    WHEN question_type = 'coding' THEN 'coding'
    WHEN question_type = 'essay' THEN 'essay'
    ELSE 'multiple-choice'
  END
WHERE type IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_assignment_user ON public.assignment_attempts(assignment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_status ON public.assignment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assignment_audit_log_assignment ON public.assignment_audit_log(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_published ON public.assignments(is_published);
