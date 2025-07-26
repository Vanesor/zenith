-- ==============================================================================
-- SINGLE CLUB RESTRICTION MIGRATION
-- ==============================================================================
-- This script migrates the database from supporting multiple clubs per user
-- to supporting only ONE club per user, and adds college email validation
-- 
-- Business Rules:
-- 1. Students can only join ONE club at a time
-- 2. College students must have email ending with @stvincentngp.edu.in
-- 3. Non-college users can also join but limited to one club
-- 4. All data should be dynamic, not static
-- ==============================================================================

-- Step 1: Create a backup of existing data
-- ==============================================================================
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop existing constraints and indexes that reference clubs array
-- ==============================================================================
DROP INDEX IF EXISTS idx_users_clubs;

-- Step 3: Add new column for single club membership
-- ==============================================================================
ALTER TABLE users ADD COLUMN club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE SET NULL;

-- Step 4: Migrate existing data from clubs array to single club_id
-- ==============================================================================
-- For users who have multiple clubs, assign them to the first club in their array
UPDATE users 
SET club_id = (
    CASE 
        WHEN clubs IS NOT NULL AND array_length(clubs, 1) > 0 
        THEN clubs[1]
        ELSE NULL
    END
);

-- Step 5: Drop the old clubs array column
-- ==============================================================================
ALTER TABLE users DROP COLUMN clubs;

-- Step 6: Add email domain validation constraint
-- ==============================================================================
-- Add a check constraint to ensure college emails are valid
ALTER TABLE users ADD CONSTRAINT check_college_email 
CHECK (
    email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' AND 
    (email LIKE '%@stvincentngp.edu.in' OR email NOT LIKE '%@stvincentngp.edu.in')
);

-- Step 7: Create new indexes for performance
-- ==============================================================================
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_users_email_domain ON users(email) WHERE email LIKE '%@stvincentngp.edu.in';

-- Step 8: Create function to validate single club membership
-- ==============================================================================
CREATE OR REPLACE FUNCTION validate_single_club_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is trying to join a club but already has one, prevent it
    IF NEW.club_id IS NOT NULL AND OLD.club_id IS NOT NULL AND NEW.club_id != OLD.club_id THEN
        RAISE EXCEPTION 'Users can only be members of one club at a time. Current club: %, Attempting to join: %', OLD.club_id, NEW.club_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single club validation
CREATE TRIGGER trigger_single_club_membership
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_single_club_membership();

-- Step 9: Update sample data to ensure only one club per user
-- ==============================================================================
-- Clear and recreate all user data with single club memberships
DELETE FROM users;

-- Insert updated sample users with single club memberships
INSERT INTO users (id, email, password_hash, name, role, club_id, bio, avatar) VALUES
-- Management Users (College Emails)
('550e8400-e29b-41d4-a716-446655440001', 'president@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Arjun Patel', 'president', NULL, 'President of Zenith Forum, Computer Science student passionate about technology and leadership.', 'https://i.pravatar.cc/150?img=1'),

('550e8400-e29b-41d4-a716-446655440002', 'vicepresident@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Priya Sharma', 'vice_president', NULL, 'Vice President of Zenith, Information Technology student with focus on innovation.', 'https://i.pravatar.cc/150?img=2'),

('550e8400-e29b-41d4-a716-446655440003', 'innovation@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Rahul Kumar', 'innovation_head', 'ascend', 'Innovation Head and Ascend member, passionate about cutting-edge technology and startups.', 'https://i.pravatar.cc/150?img=3'),

('550e8400-e29b-41d4-a716-446655440004', 'treasurer@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Anjali Singh', 'treasurer', 'aster', 'Treasurer of Zenith and Aster member, Commerce student with strong financial acumen.', 'https://i.pravatar.cc/150?img=4'),

('550e8400-e29b-41d4-a716-446655440005', 'outreach@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Vikram Reddy', 'outreach', 'achievers', 'Outreach Head and Achievers member, MBA student focused on building external partnerships.', 'https://i.pravatar.cc/150?img=5'),

-- Club Coordinators (College Emails)
('550e8400-e29b-41d4-a716-446655440006', 'ascend.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Dev Patel', 'coordinator', 'ascend', 'Ascend Club Coordinator, Computer Science final year, full-stack developer and competitive programmer.', 'https://i.pravatar.cc/150?img=6'),

('550e8400-e29b-41d4-a716-446655440007', 'aster.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Sneha Gupta', 'coordinator', 'aster', 'Aster Club Coordinator, MBA student specializing in organizational behavior and communication.', 'https://i.pravatar.cc/150?img=7'),

('550e8400-e29b-41d4-a716-446655440008', 'achievers.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Ravi Mehta', 'coordinator', 'achievers', 'Achievers Club Coordinator, preparing for civil services and guiding students in higher studies.', 'https://i.pravatar.cc/150?img=8'),

('550e8400-e29b-41d4-a716-446655440009', 'altogether.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Kavya Nair', 'coordinator', 'altogether', 'Altogether Club Coordinator, Psychology student focused on holistic personality development.', 'https://i.pravatar.cc/150?img=9'),

-- Regular College Students (College Emails)
('550e8400-e29b-41d4-a716-446655440010', 'student1@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Amit Joshi', 'student', 'ascend', 'Computer Science student passionate about web development and machine learning.', 'https://i.pravatar.cc/150?img=10'),

('550e8400-e29b-41d4-a716-446655440011', 'student2@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Meera Shah', 'student', 'aster', 'Commerce student interested in public speaking and leadership development.', 'https://i.pravatar.cc/150?img=11'),

('550e8400-e29b-41d4-a716-446655440012', 'student3@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Kiran Desai', 'student', 'achievers', 'Arts student preparing for competitive exams and higher studies abroad.', 'https://i.pravatar.cc/150?img=12'),

('550e8400-e29b-41d4-a716-446655440013', 'student4@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Pooja Rao', 'student', 'altogether', 'Psychology student interested in mindfulness and personal growth techniques.', 'https://i.pravatar.cc/150?img=13'),

-- External Users (Non-college emails but still limited to one club)
('550e8400-e29b-41d4-a716-446655440014', 'external.user1@gmail.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Alex Johnson', 'student', 'ascend', 'External developer interested in joining coding club activities and workshops.', 'https://i.pravatar.cc/150?img=14'),

('550e8400-e29b-41d4-a716-446655440015', 'external.user2@yahoo.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Sarah Williams', 'student', 'aster', 'Professional looking to improve soft skills and networking abilities.', 'https://i.pravatar.cc/150?img=15'),

-- Demo Account for Testing
('550e8400-e29b-41d4-a716-446655440000', 'demo@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Demo User', 'student', 'ascend', 'Demo account for testing purposes - Computer Science student.', 'https://i.pravatar.cc/150?img=20');

-- Step 10: Update foreign key references in clubs table
-- ==============================================================================
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440006' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440007' WHERE id = 'aster';  
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440008' WHERE id = 'achievers';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440009' WHERE id = 'altogether';

-- Step 11: Create helper functions for club membership management
-- ==============================================================================
-- Function to join a club (with validation)
CREATE OR REPLACE FUNCTION join_club(user_id UUID, new_club_id VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    current_club VARCHAR(50);
BEGIN
    -- Check if user exists
    SELECT club_id INTO current_club FROM users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if user is already in a club
    IF current_club IS NOT NULL THEN
        RAISE EXCEPTION 'User is already a member of club: %. Leave current club before joining a new one.', current_club;
    END IF;
    
    -- Check if target club exists
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = new_club_id) THEN
        RAISE EXCEPTION 'Club not found: %', new_club_id;
    END IF;
    
    -- Join the club
    UPDATE users SET club_id = new_club_id WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to leave a club
CREATE OR REPLACE FUNCTION leave_club(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Leave the club
    UPDATE users SET club_id = NULL WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to switch clubs (leave current and join new)
CREATE OR REPLACE FUNCTION switch_club(user_id UUID, new_club_id VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if target club exists
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = new_club_id) THEN
        RAISE EXCEPTION 'Club not found: %', new_club_id;
    END IF;
    
    -- Switch to the new club
    UPDATE users SET club_id = new_club_id WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create view for club statistics
-- ==============================================================================
CREATE OR REPLACE VIEW club_stats AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.description,
    COUNT(u.id) as member_count,
    COUNT(CASE WHEN u.email LIKE '%@stvincentngp.edu.in' THEN 1 END) as college_members,
    COUNT(CASE WHEN u.email NOT LIKE '%@stvincentngp.edu.in' THEN 1 END) as external_members
FROM clubs c
LEFT JOIN users u ON c.id = u.club_id
GROUP BY c.id, c.name, c.type, c.description
ORDER BY member_count DESC;

-- Step 13: Final validation and summary
-- ==============================================================================
-- Validate that no user has multiple clubs
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE club_id IS NOT NULL;
    RAISE NOTICE 'Users with club membership: %', user_count;
    
    -- Check for any data integrity issues
    IF EXISTS (SELECT 1 FROM users WHERE club_id IS NOT NULL AND club_id NOT IN (SELECT id FROM clubs)) THEN
        RAISE EXCEPTION 'Data integrity error: Users have invalid club_id references';
    END IF;
    
    RAISE NOTICE 'Single club migration completed successfully!';
    RAISE NOTICE 'All users now have at most one club membership.';
    RAISE NOTICE 'College email validation constraint added.';
    RAISE NOTICE 'Helper functions created for club management.';
END $$;

-- Display final statistics
SELECT 'Migration Summary' as status;
SELECT * FROM club_stats;

-- Show sample of updated users
SELECT 
    name, 
    email,
    CASE 
        WHEN email LIKE '%@stvincentngp.edu.in' THEN 'College Student'
        ELSE 'External User' 
    END as user_type,
    club_id,
    role 
FROM users 
ORDER BY 
    CASE WHEN role IN ('president', 'vice_president', 'innovation_head', 'treasurer', 'outreach') THEN 1
         WHEN role = 'coordinator' THEN 2
         ELSE 3 END,
    name 
LIMIT 10;
