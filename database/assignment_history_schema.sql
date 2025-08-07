-- Schema updates for user assignment history tracking
-- Run this in Supabase SQL Editor

-- The current schema already supports assignment history tracking through:
-- 1. assignment_attempts table - tracks each attempt with scores, timing, etc.
-- 2. assignment_submissions table - tracks submissions with scores and feedback
-- 3. question_responses table - tracks individual question responses

-- However, let's add some indexes for better performance when fetching user history:

-- Index for faster assignment history queries by user
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_user_status 
ON assignment_attempts(user_id, status, submitted_at DESC);

-- Index for faster assignment lookup with user attempts
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_assignment_user 
ON assignment_attempts(assignment_id, user_id, attempt_number);

-- Index for faster submission history queries
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_submitted 
ON assignment_submissions(user_id, submitted_at DESC);

-- Add a view for easy assignment history retrieval
CREATE OR REPLACE VIEW user_assignment_history AS
SELECT 
    a.id as assignment_id,
    a.title,
    c.name as club_name,
    aa.id as attempt_id,
    aa.user_id,
    aa.attempt_number,
    aa.score,
    aa.max_score,
    aa.percentage,
    aa.status,
    aa.submitted_at,
    aa.time_spent,
    aa.start_time,
    aa.end_time,
    COUNT(aa2.id) as total_attempts
FROM assignments a
JOIN assignment_attempts aa ON a.id = aa.assignment_id
LEFT JOIN clubs c ON a.club_id = c.id
LEFT JOIN assignment_attempts aa2 ON a.id = aa2.assignment_id AND aa2.user_id = aa.user_id
WHERE aa.status IN ('completed', 'submitted', 'graded')
    AND aa.submitted_at IS NOT NULL
GROUP BY a.id, a.title, c.name, aa.id, aa.user_id, aa.attempt_number, 
         aa.score, aa.max_score, aa.percentage, aa.status, aa.submitted_at, 
         aa.time_spent, aa.start_time, aa.end_time;

-- Grant permissions for the view
GRANT SELECT ON user_assignment_history TO authenticated;

-- Optional: Add a function to get user assignment statistics
CREATE OR REPLACE FUNCTION get_user_assignment_stats(p_user_id UUID)
RETURNS TABLE (
    total_assignments BIGINT,
    completed_assignments BIGINT,
    average_score NUMERIC,
    total_time_spent BIGINT,
    best_score NUMERIC,
    recent_activity_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT aa.assignment_id) as total_assignments,
        COUNT(DISTINCT CASE WHEN aa.status IN ('completed', 'graded') THEN aa.assignment_id END) as completed_assignments,
        COALESCE(AVG(aa.percentage), 0) as average_score,
        COALESCE(SUM(aa.time_spent), 0) as total_time_spent,
        COALESCE(MAX(aa.percentage), 0) as best_score,
        MAX(aa.submitted_at) as recent_activity_date
    FROM assignment_attempts aa
    WHERE aa.user_id = p_user_id 
        AND aa.status IN ('completed', 'submitted', 'graded')
        AND aa.submitted_at IS NOT NULL;
END;
$$;

-- Grant execute permission for the function
GRANT EXECUTE ON FUNCTION get_user_assignment_stats(UUID) TO authenticated;

-- Add RLS policies if not already present
DO $$
BEGIN
    -- Policy for assignment_attempts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assignment_attempts' 
        AND policyname = 'Users can view their own attempts'
    ) THEN
        CREATE POLICY "Users can view their own attempts" 
        ON assignment_attempts FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    -- Policy for assignment_submissions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assignment_submissions' 
        AND policyname = 'Users can view their own submissions'
    ) THEN
        CREATE POLICY "Users can view their own submissions" 
        ON assignment_submissions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on tables if not already enabled
ALTER TABLE assignment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Example usage queries:
/*
-- Get user's assignment history
SELECT * FROM user_assignment_history 
WHERE user_id = 'your-user-id' 
ORDER BY submitted_at DESC;

-- Get user assignment statistics
SELECT * FROM get_user_assignment_stats('your-user-id');

-- Get recent assignments with scores
SELECT 
    title,
    club_name,
    score,
    max_score,
    percentage,
    submitted_at,
    time_spent
FROM user_assignment_history 
WHERE user_id = 'your-user-id' 
    AND submitted_at >= NOW() - INTERVAL '30 days'
ORDER BY submitted_at DESC;
*/
