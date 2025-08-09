-- Add missing columns to users table for profile functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
