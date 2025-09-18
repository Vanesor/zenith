-- Fix Script: Synchronize club_id between users and club_members tables
-- Date: 2025-09-18
-- Purpose: Update users.club_id to match club_members.club_id for current term members

-- First, let's see the current state
SELECT 'BEFORE FIX - Mismatch Summary:' as status;
SELECT 
    cm.club_id,
    COUNT(*) as users_with_null_club_id
FROM users u
JOIN club_members cm ON u.id = cm.user_id
WHERE cm.is_current_term = true 
    AND u.role = 'student'
    AND u.club_id IS NULL
GROUP BY cm.club_id
ORDER BY users_with_null_club_id DESC;

-- Show total count before fix
SELECT 'Total users with NULL club_id but active membership:' as description, COUNT(*) as count
FROM users u
JOIN club_members cm ON u.id = cm.user_id
WHERE cm.is_current_term = true 
    AND u.role = 'student'
    AND u.club_id IS NULL;

-- BEGIN TRANSACTION for safety
BEGIN;

-- Update users.club_id based on current club_members data
-- This will sync club_id for all students who have active club memberships
UPDATE users 
SET club_id = cm.club_id
FROM club_members cm
WHERE users.id = cm.user_id 
    AND cm.is_current_term = true
    AND users.role = 'student'
    AND users.club_id IS NULL;

-- Verify the fix worked
SELECT 'AFTER FIX - Remaining mismatches (should be 0):' as status;
SELECT 
    cm.club_id,
    COUNT(*) as remaining_mismatches
FROM users u
JOIN club_members cm ON u.id = cm.user_id
WHERE cm.is_current_term = true 
    AND u.role = 'student'
    AND u.club_id IS NULL
GROUP BY cm.club_id
ORDER BY remaining_mismatches DESC;

-- Show total count after fix (should be 0)
SELECT 'Remaining users with NULL club_id but active membership:' as description, COUNT(*) as count
FROM users u
JOIN club_members cm ON u.id = cm.user_id
WHERE cm.is_current_term = true 
    AND u.role = 'student'
    AND u.club_id IS NULL;

-- Show updated counts by club
SELECT 'AFTER FIX - Users by club:' as status;
SELECT 
    club_id,
    COUNT(*) as user_count
FROM users 
WHERE role = 'student' 
    AND club_id IS NOT NULL
GROUP BY club_id
ORDER BY user_count DESC;

-- COMMIT the transaction
COMMIT;

-- Final verification: Check for any remaining inconsistencies
SELECT 'FINAL VERIFICATION - Any remaining mismatches:' as status;
SELECT 
    u.id,
    u.email,
    u.club_id as users_club_id,
    cm.club_id as members_club_id,
    'MISMATCH' as status
FROM users u
JOIN club_members cm ON u.id = cm.user_id
WHERE cm.is_current_term = true 
    AND u.role = 'student'
    AND (u.club_id IS NULL OR u.club_id != cm.club_id)
LIMIT 10;