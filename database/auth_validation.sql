-- =============================================================================
-- AUTHENTICATION VALIDATION QUERIES FOR ZENITH FORUM
-- =============================================================================
-- Use these queries in your authentication system to validate user logins

-- 1. USER LOGIN VALIDATION
-- This query validates email and password for login
-- Replace 'user_email@zenith.edu' and 'provided_password_hash' with actual values

-- Example login validation query (use in your backend):
SELECT 
    id,
    email,
    name,
    role,
    clubs,
    avatar,
    bio
FROM users 
WHERE email = $1 AND password_hash = $2;

-- Note: In your application, you should:
-- 1. Hash the provided password using bcrypt
-- 2. Compare it with the stored password_hash
-- 3. Never store plain text passwords

-- 2. CHECK IF EMAIL EXISTS (for registration)
SELECT id, email 
FROM users 
WHERE email = $1;

-- 3. GET USER BY ID (for session management)
SELECT 
    id,
    email,
    name,
    role,
    clubs,
    avatar,
    bio,
    social_links,
    preferences
FROM users 
WHERE id = $1;

-- 4. GET USER WITH ROLE PERMISSIONS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.clubs,
    u.avatar,
    u.bio,
    -- Check if user is coordinator of any club
    CASE 
        WHEN EXISTS (SELECT 1 FROM clubs WHERE coordinator_id = u.id) THEN true
        ELSE false
    END as is_coordinator,
    -- Check if user is co-coordinator of any club
    CASE 
        WHEN EXISTS (SELECT 1 FROM clubs WHERE co_coordinator_id = u.id) THEN true
        ELSE false
    END as is_co_coordinator,
    -- Check if user is secretary of any club
    CASE 
        WHEN EXISTS (SELECT 1 FROM clubs WHERE secretary_id = u.id) THEN true
        ELSE false
    END as is_secretary,
    -- Check if user is media head of any club
    CASE 
        WHEN EXISTS (SELECT 1 FROM clubs WHERE media_id = u.id) THEN true
        ELSE false
    END as is_media_head
FROM users u
WHERE u.email = $1;

-- 5. TEST ALL USER ACCOUNTS (for development only)
-- This query shows all users with their basic info for testing
SELECT 
    email,
    name,
    role,
    clubs,
    'password123' as test_password
FROM users 
ORDER BY role, name;

-- =============================================================================
-- SAMPLE BCRYPT IMPLEMENTATION (for reference)
-- =============================================================================
-- In your Node.js/Next.js application, use bcrypt like this:

-- For registration (JavaScript):
-- const bcrypt = require('bcrypt');
-- const saltRounds = 10;
-- const hashedPassword = await bcrypt.hash(password, saltRounds);

-- For login validation (JavaScript):
-- const bcrypt = require('bcrypt');
-- const isValid = await bcrypt.compare(password, hashedPassword);

-- =============================================================================
-- ROLE-BASED PERMISSIONS CHECK
-- =============================================================================
-- Check if user has permission to perform admin actions
SELECT 
    u.id,
    u.role,
    CASE 
        WHEN u.role IN ('president', 'vice_president', 'innovation_head', 'treasurer', 'outreach') THEN 'zenith_admin'
        WHEN u.role IN ('coordinator', 'co_coordinator', 'secretary', 'media') THEN 'club_admin'
        ELSE 'student'
    END as permission_level,
    -- Get clubs where user has admin rights
    ARRAY(
        SELECT c.id 
        FROM clubs c 
        WHERE c.coordinator_id = u.id 
           OR c.co_coordinator_id = u.id 
           OR c.secretary_id = u.id 
           OR c.media_id = u.id
    ) as admin_clubs
FROM users u
WHERE u.id = $1;
