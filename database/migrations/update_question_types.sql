-- Add true_false and integer question types to the assignment_questions table

-- First, drop the existing check constraint
ALTER TABLE public.assignment_questions DROP CONSTRAINT IF EXISTS assignment_questions_question_type_check;

-- Then add a new constraint with additional question types
ALTER TABLE public.assignment_questions 
ADD CONSTRAINT assignment_questions_question_type_check 
CHECK (question_type::text = ANY (
  ARRAY[
    'single_choice'::character varying, 
    'multiple_choice'::character varying, 
    'coding'::character varying, 
    'essay'::character varying,
    'true_false'::character varying,
    'integer'::character varying
  ]::text[]
));

-- Also add a column for min and max value for integer type questions
ALTER TABLE public.assignment_questions
ADD COLUMN IF NOT EXISTS integer_min numeric,
ADD COLUMN IF NOT EXISTS integer_max numeric,
ADD COLUMN IF NOT EXISTS integer_step numeric DEFAULT 1;

-- Add explanation field for questions to provide feedback
ALTER TABLE public.assignment_questions
ADD COLUMN IF NOT EXISTS explanation text;

-- Update the schema.txt file with these changes
COMMENT ON TABLE public.assignment_questions IS 'Stores questions for assignments including multiple choice, coding, essay, true/false, and integer input types';
