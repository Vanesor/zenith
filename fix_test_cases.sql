-- Fix test cases to ensure they have proper expectedOutput field
-- This script ensures compatibility between the database schema and UI

-- Check current test_cases structure
SELECT 
    id, 
    title, 
    test_cases
FROM assignment_questions 
WHERE test_cases IS NOT NULL 
AND test_cases != '[]'::jsonb
LIMIT 5;

-- Update test cases to use expectedOutput instead of output if needed
-- This is a safe operation that adds expectedOutput field where missing
UPDATE assignment_questions 
SET test_cases = (
    SELECT jsonb_agg(
        CASE 
            WHEN testcase ? 'expectedOutput' THEN testcase
            WHEN testcase ? 'output' THEN testcase || jsonb_build_object('expectedOutput', testcase->>'output')
            ELSE testcase || jsonb_build_object('expectedOutput', '6')  -- Default for add two numbers
        END
    )
    FROM jsonb_array_elements(test_cases) AS testcase
)
WHERE test_cases IS NOT NULL 
AND test_cases != '[]'::jsonb;

-- Add sample test case for coding questions that don't have any
UPDATE assignment_questions 
SET test_cases = '[
    {
        "input": "2 4",
        "expectedOutput": "6",
        "isHidden": false
    },
    {
        "input": "10 15",
        "expectedOutput": "25",
        "isHidden": false
    },
    {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": true
    }
]'::jsonb
WHERE question_type = 'coding' 
AND (test_cases IS NULL OR test_cases = '[]'::jsonb);

-- Verify the update
SELECT 
    id, 
    title, 
    test_cases
FROM assignment_questions 
WHERE test_cases IS NOT NULL 
AND test_cases != '[]'::jsonb
LIMIT 3;
