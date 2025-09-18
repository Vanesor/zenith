-- Unified Role System Migration Script
-- This script consolidates all role information into the users.role column

BEGIN;

-- Step 1: Create backup tables
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE club_members_backup AS SELECT * FROM club_members;
CREATE TABLE committee_members_backup AS SELECT * FROM committee_members;

-- Step 2: Update users.role based on committee memberships for current term members
UPDATE users 
SET role = 'president'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'President' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'vice_president'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Vice President' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'innovation_head'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Innovation Head' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'treasurer'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Treasurer' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'secretary_committee'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Secretary' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'media_head'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Media Head' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'joint_secretary'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Joint Secretary' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'joint_treasurer'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Joint Treasurer' AND cm.is_current_term = true
);

UPDATE users 
SET role = 'outreach_head'
WHERE id IN (
    SELECT cm.user_id 
    FROM committee_members cm 
    JOIN committee_roles cr ON cm.role_id = cr.id 
    WHERE cr.name = 'Outreach Head' AND cm.is_current_term = true
);

-- Step 3: Update users.role based on club memberships (only if not already a committee member)
UPDATE users 
SET role = 'coordinator'
WHERE role = 'student' AND id IN (
    SELECT user_id FROM club_members WHERE role = 'coordinator'
);

UPDATE users 
SET role = 'co_coordinator'
WHERE role = 'student' AND id IN (
    SELECT user_id FROM club_members WHERE role = 'co_coordinator'
);

UPDATE users 
SET role = 'secretary'
WHERE role = 'student' AND id IN (
    SELECT user_id FROM club_members WHERE role = 'secretary'
);

UPDATE users 
SET role = 'media'
WHERE role = 'student' AND id IN (
    SELECT user_id FROM club_members WHERE role = 'media'
);

-- Step 4: Handle special cases - update any remaining inconsistencies
-- Fix users who have committee roles but aren't in committee_members
UPDATE users SET role = 'president' WHERE email = 'yash.siddhabhatti@zenith.edu';
UPDATE users SET role = 'vice_president' WHERE email = 'sarthak.thote@zenith.edu';
UPDATE users SET role = 'innovation_head' WHERE email = 'naitamatharva14@gmail.com';
UPDATE users SET role = 'treasurer' WHERE email = 'yogeshvar.chaudhari@zenith.edu';
UPDATE users SET role = 'secretary_committee' WHERE email = 'manasvi.giradkar@zenith.edu';
UPDATE users SET role = 'media_head' WHERE email = 'kaiwalya.pund@zenith.edu';

-- Step 5: Create new simplified tables structure (optional - for future use)
-- Remove role column from club_members (we'll use users.role instead)
-- ALTER TABLE club_members DROP COLUMN role;

-- Step 6: Verify the changes
SELECT 'Updated users roles - verification:' as status;
SELECT role, COUNT(*) as count 
FROM users 
WHERE role != 'student' 
GROUP BY role 
ORDER BY role;

COMMIT;

-- Save verification results
\copy (SELECT u.id, u.email, u.name, u.role as new_role, CASE WHEN cm.user_id IS NOT NULL THEN 'Has Committee Role' ELSE 'No Committee Role' END as committee_status, CASE WHEN cl.user_id IS NOT NULL THEN 'Has Club Role' ELSE 'No Club Role' END as club_status FROM users u LEFT JOIN committee_members cm ON u.id = cm.user_id AND cm.is_current_term = true LEFT JOIN club_members cl ON u.id = cl.user_id WHERE u.role != 'student' ORDER BY u.role, u.name) TO 'unified_role_verification.txt' WITH CSV HEADER;