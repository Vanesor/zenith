-- Add start_date and start_time fields to assignments table
ALTER TABLE assignments
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;

-- Add validation check to ensure start_date is before due_date when both are provided
ALTER TABLE assignments
ADD CONSTRAINT check_start_date_before_due_date 
CHECK (start_date IS NULL OR start_date <= due_date);

-- Update any existing assignments to have start_date same as created_at
UPDATE assignments
SET start_date = created_at
WHERE start_date IS NULL;
