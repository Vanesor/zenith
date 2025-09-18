-- User Club Assignment Script
-- This script assigns club memberships to users who don't have them
-- and updates the club_id in the users table

BEGIN;

-- 1. Assign remaining users to clubs and update users table
-- User: Aditi Jain -> ASCEND
INSERT INTO club_members (user_id, club_id, role, academic_year, is_leader, is_current_term, hierarchy, display_order, bio, achievements, joined_at)
VALUES (
    '086ebbaa-f6dd-4ce4-a836-246833f9573c', 
    'ascend', 
    'member', 
    '2025-2026', 
    false, 
    true, 
    5, 
    0, 
    NULL, 
    ARRAY[]::text[], 
    NOW()
);

UPDATE users SET club_id = 'ascend' WHERE id = '086ebbaa-f6dd-4ce4-a836-246833f9573c';

-- User: Atharva Naitam -> ASTER
INSERT INTO club_members (user_id, club_id, role, academic_year, is_leader, is_current_term, hierarchy, display_order, bio, achievements, joined_at)
VALUES (
    'e4a347e9-92ea-4d76-8cb0-c59918f0f58c', 
    'aster', 
    'member', 
    '2025-2026', 
    false, 
    true, 
    5, 
    0, 
    NULL, 
    ARRAY[]::text[], 
    NOW()
);

UPDATE users SET club_id = 'aster' WHERE id = 'e4a347e9-92ea-4d76-8cb0-c59918f0f58c';

-- User: Test User -> keep in ASCEND but add club_members entry
INSERT INTO club_members (user_id, club_id, role, academic_year, is_leader, is_current_term, hierarchy, display_order, bio, achievements, joined_at)
VALUES (
    '5aaf2cd5-eac6-4303-8c0c-d60e56576dc8', 
    'ascend', 
    'member', 
    '2025-2026', 
    false, 
    true, 
    5, 
    0, 
    NULL, 
    ARRAY[]::text[], 
    NOW()
);

-- 2. Create a view for club leadership team display (hierarchy 1-3 only)
CREATE OR REPLACE VIEW club_leadership_display AS
SELECT 
    cm.club_id,
    c.name as club_name,
    u.id as user_id,
    u.name as user_name,
    u.email,
    cm.role,
    cm.hierarchy,
    cm.academic_year,
    cm.is_current_term,
    cm.bio,
    cm.achievements
FROM club_members cm
JOIN users u ON cm.user_id = u.id
JOIN clubs c ON cm.club_id = c.id
WHERE cm.is_current_term = true 
    AND cm.hierarchy <= 3  -- Only show coordinators, co-coordinators, and secretaries
    AND cm.academic_year = '2024-2025'
ORDER BY cm.club_id, cm.hierarchy, u.name;

-- 3. Create a view for all active members (for admin purposes)
CREATE OR REPLACE VIEW club_all_members AS
SELECT 
    cm.club_id,
    c.name as club_name,
    u.id as user_id,
    u.name as user_name,
    u.email,
    cm.role,
    cm.hierarchy,
    cm.academic_year,
    cm.is_current_term,
    cm.is_leader,
    cm.bio,
    cm.achievements,
    cm.joined_at
FROM club_members cm
JOIN users u ON cm.user_id = u.id
JOIN clubs c ON cm.club_id = c.id
WHERE cm.is_current_term = true 
    AND cm.academic_year = '2024-2025'
ORDER BY cm.club_id, cm.hierarchy, u.name;

-- 4. Update club member counts
UPDATE clubs SET member_count = (
    SELECT COUNT(*) 
    FROM club_members cm 
    WHERE cm.club_id = clubs.id 
        AND cm.is_current_term = true 
        AND cm.academic_year = '2024-2025'
);

COMMIT;

-- Verification queries
SELECT 'Users without club memberships' as check_name, COUNT(*) as count
FROM users u 
LEFT JOIN club_members cm ON u.id = cm.user_id AND cm.academic_year = '2024-2025' AND cm.is_current_term = true
WHERE u.role = 'student' AND cm.user_id IS NULL

UNION ALL

SELECT 'Club leadership members' as check_name, COUNT(*) as count
FROM club_leadership_display

UNION ALL

SELECT 'Total club members' as check_name, COUNT(*) as count
FROM club_all_members

UNION ALL

SELECT 'ASCEND members' as check_name, COUNT(*) as count
FROM club_members WHERE club_id = 'ascend' AND is_current_term = true AND academic_year = '2024-2025'

UNION ALL

SELECT 'ASTER members' as check_name, COUNT(*) as count
FROM club_members WHERE club_id = 'aster' AND is_current_term = true AND academic_year = '2024-2025'

UNION ALL

SELECT 'ACHIEVERS members' as check_name, COUNT(*) as count
FROM club_members WHERE club_id = 'achievers' AND is_current_term = true AND academic_year = '2024-2025'

UNION ALL

SELECT 'ARTOVERT members' as check_name, COUNT(*) as count
FROM club_members WHERE club_id = 'artovert' AND is_current_term = true AND academic_year = '2024-2025';