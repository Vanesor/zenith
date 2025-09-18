-- Update club leadership hierarchy
-- This script updates the hierarchy for leadership roles that should be displayed
-- on the club home page alongside coordinators, co-coordinators, and secretaries

BEGIN;

-- Update hierarchy for leadership positions to hierarchy 4 
-- (between secretary at 3 and regular members at 5)
UPDATE club_members 
SET hierarchy = 4 
WHERE role IN ('mentor', 'outreach', 'technical_guide', 'event_incharge', 'media')
  AND is_current_term = true;


-- Add technical_guide role for any future assignments
-- (This ensures the role exists in the database for future use)

-- Verify the changes
SELECT 'Updated hierarchy for leadership roles' as status;

-- Show current leadership structure after update
SELECT DISTINCT role, hierarchy, COUNT(*) as count
FROM club_members 
WHERE academic_year = '2024-2025' 
  AND is_current_term = true 
  AND hierarchy <= 4
GROUP BY role, hierarchy
ORDER BY hierarchy, role;

COMMIT;