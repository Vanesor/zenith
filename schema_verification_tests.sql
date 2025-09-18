-- SQL Test Queries to verify our API endpoints match the schema

-- 1. Test club membership query (matches our API)
SELECT 
    clm.id,
    clm.club_id,
    cl.name as club_name,
    clm.role,
    clm.academic_year,
    clm.is_leader,
    clm.is_current_term,
    clm.hierarchy,
    clm.display_order,
    clm.bio,
    clm.achievements,
    clm.joined_at
FROM club_members clm
JOIN clubs cl ON clm.club_id = cl.id
WHERE clm.user_id = 'test-user-id'
ORDER BY clm.academic_year DESC, cl.name, clm.hierarchy;

-- 2. Test committee membership query (matches our API)
SELECT 
    cm.id,
    cm.committee_id,
    c.name as committee_name,
    cm.role_id,
    cr.name as role_name,
    cm.academic_year,
    cm.status,
    cm.is_current_term,
    cr.hierarchy,
    cm.joined_at,
    cm.term_start,
    cm.term_end
FROM committee_members cm
JOIN committees c ON cm.committee_id = c.id
JOIN committee_roles cr ON cm.role_id = cr.id
WHERE cm.user_id = 'test-user-id'
ORDER BY cm.academic_year DESC, c.name, cr.hierarchy;

-- 3. Test committee and roles query for dropdowns
SELECT 
    c.id as committee_id,
    c.name as committee_name,
    c.description,
    cr.id as role_id,
    cr.name as role_name,
    cr.hierarchy,
    cr.description as role_description
FROM committees c
LEFT JOIN committee_roles cr ON c.id = cr.committee_id
WHERE c.is_active = true
ORDER BY c.name, cr.hierarchy;

-- 4. Test clubs query for dropdowns
SELECT 
    id,
    name,
    type,
    description
FROM clubs
ORDER BY name;

-- 5. Test user query
SELECT id, name, email, role, updated_at 
FROM users 
WHERE id = 'test-user-id';

-- 6. Test insert club membership (our API format)
INSERT INTO club_members (
    user_id, club_id, role, academic_year, is_leader, 
    is_current_term, hierarchy, display_order, bio, achievements
) VALUES (
    'test-user-id', 
    'test-club-id', 
    'member', 
    '2024-2025', 
    false,
    true, 
    5, 
    0, 
    'Test bio', 
    ARRAY['achievement1', 'achievement2']
);

-- 7. Test insert committee membership (our API format)
INSERT INTO committee_members (
    user_id, committee_id, role_id, academic_year, status, 
    is_current_term, term_start, term_end
) VALUES (
    'test-user-id',
    'test-committee-id',
    'test-role-id',
    '2024-2025',
    'active',
    true,
    '2024-08-01',
    '2025-07-31'
);

-- 8. Check unique constraints work
-- This should fail if same user tries to join same club for same academic year
INSERT INTO club_members (user_id, club_id, academic_year) 
VALUES ('test-user-id', 'test-club-id', '2024-2025');

-- 9. Test data types compatibility
-- Check that our text[] achievements work
SELECT achievements FROM club_members WHERE id = 'test-id';

-- Check that our club_id is character varying (not uuid)
SELECT id, pg_typeof(id) as id_type FROM clubs LIMIT 1;

-- Check that user_id is uuid
SELECT id, pg_typeof(id) as id_type FROM users LIMIT 1;

-- 10. Test our academic year format
SELECT DISTINCT academic_year FROM club_members ORDER BY academic_year DESC;
SELECT DISTINCT academic_year FROM committee_members ORDER BY academic_year DESC;