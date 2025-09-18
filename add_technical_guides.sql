-- Add technical_guide roles to demonstrate the new leadership positions
-- This script adds sample technical_guide roles to show the functionality

BEGIN;

-- Add a technical_guide to ASCEND (using an existing member)
INSERT INTO club_members (user_id, club_id, role, academic_year, is_leader, is_current_term, hierarchy, display_order, bio, achievements, joined_at)
SELECT 
    id, 
    'ascend', 
    'technical_guide', 
    '2024-2025', 
    true, 
    true, 
    4, 
    0, 
    'Guides technical projects and mentors students in programming and development.',
    ARRAY['Led 5+ technical workshops', 'Mentored 20+ students', 'Developed club website']::text[], 
    NOW()
FROM users 
WHERE club_id = 'ascend' 
  AND role = 'student' 
  AND id NOT IN (SELECT user_id FROM club_members WHERE club_id = 'ascend' AND academic_year = '2024-2025' AND is_current_term = true)
LIMIT 1;

-- Add a technical_guide to ASTER
INSERT INTO club_members (user_id, club_id, role, academic_year, is_leader, is_current_term, hierarchy, display_order, bio, achievements, joined_at)
SELECT 
    id, 
    'aster', 
    'technical_guide', 
    '2024-2025', 
    true, 
    true, 
    4, 
    0, 
    'Provides technical guidance for skill development and training programs.',
    ARRAY['Organized technical bootcamps', 'Curriculum development', 'Industry connections']::text[], 
    NOW()
FROM users 
WHERE club_id = 'aster' 
  AND role = 'student' 
  AND id NOT IN (SELECT user_id FROM club_members WHERE club_id = 'aster' AND academic_year = '2024-2025' AND is_current_term = true)
LIMIT 1;

-- Show final leadership structure
SELECT 'Final Leadership Structure:' as summary;

SELECT club_id, role, hierarchy, COUNT(*) as count
FROM club_members 
WHERE academic_year = '2024-2025' 
  AND is_current_term = true 
  AND hierarchy <= 4
GROUP BY club_id, role, hierarchy
ORDER BY club_id, hierarchy;

COMMIT;