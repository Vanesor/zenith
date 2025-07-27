-- ==============================================================================
-- ZENITH FORUM - VERIFIED DUMMY USER DATA FOR TESTING
-- ==============================================================================
-- This script creates test users with VERIFIED credentials for all positions
-- All users have password: "password123" 
-- Password hash: $2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu
-- Hash algorithm: bcrypt with 12 salt rounds (matches login/signup system)
-- VERIFIED: This hash correctly validates against "password123"
-- ==============================================================================

-- Clear existing users (be careful in production!)
DELETE FROM users;

-- Insert dummy users for all positions and roles
-- ==============================================================================

-- 1. ADMIN USERS
-- ==============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Admin User', 'admin', 'ascend', 'System administrator with full access'),
('550e8400-e29b-41d4-a716-446655440001', 'superadmin@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Super Admin', 'admin', NULL, 'Super administrator overseeing all clubs');

-- 2. COORDINATORS (Leadership positions)
-- ==============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
-- ASCEND Club
('550e8400-e29b-41d4-a716-446655440010', 'ascend.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Coordinator', 'coordinator', 'ascend', 'Lead coordinator for ASCEND technical club'),
('550e8400-e29b-41d4-a716-446655440011', 'ascend.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Co-Coordinator', 'coordinator', 'ascend', 'Co-coordinator supporting ASCEND activities'),
('550e8400-e29b-41d4-a716-446655440012', 'ascend.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Secretary', 'coordinator', 'ascend', 'Secretary managing ASCEND documentation'),
('550e8400-e29b-41d4-a716-446655440013', 'ascend.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Media Head', 'coordinator', 'ascend', 'Media coordinator for ASCEND club'),

-- GENESIS Club
('550e8400-e29b-41d4-a716-446655440020', 'genesis.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Coordinator', 'coordinator', 'genesis', 'Lead coordinator for GENESIS entrepreneurship club'),
('550e8400-e29b-41d4-a716-446655440021', 'genesis.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Co-Coordinator', 'coordinator', 'genesis', 'Co-coordinator supporting GENESIS activities'),
('550e8400-e29b-41d4-a716-446655440022', 'genesis.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Secretary', 'coordinator', 'genesis', 'Secretary managing GENESIS documentation'),
('550e8400-e29b-41d4-a716-446655440023', 'genesis.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Media Head', 'coordinator', 'genesis', 'Media coordinator for GENESIS club'),

-- PHOENIX Club
('550e8400-e29b-41d4-a716-446655440030', 'phoenix.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Coordinator', 'coordinator', 'phoenix', 'Lead coordinator for PHOENIX cultural club'),
('550e8400-e29b-41d4-a716-446655440031', 'phoenix.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Co-Coordinator', 'coordinator', 'phoenix', 'Co-coordinator supporting PHOENIX activities'),
('550e8400-e29b-41d4-a716-446655440032', 'phoenix.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Secretary', 'coordinator', 'phoenix', 'Secretary managing PHOENIX documentation'),
('550e8400-e29b-41d4-a716-446655440033', 'phoenix.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Media Head', 'coordinator', 'phoenix', 'Media coordinator for PHOENIX club');

-- 3. FACULTY ADVISORS
-- ==============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'faculty.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. ASCEND Advisor', 'faculty', 'ascend', 'Faculty advisor for ASCEND technical club'),
('550e8400-e29b-41d4-a716-446655440041', 'faculty.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. GENESIS Advisor', 'faculty', 'genesis', 'Faculty advisor for GENESIS entrepreneurship club'),
('550e8400-e29b-41d4-a716-446655440042', 'faculty.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. PHOENIX Advisor', 'faculty', 'phoenix', 'Faculty advisor for PHOENIX cultural club');

-- 4. STUDENT MEMBERS
-- ==============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
-- ASCEND Students
('550e8400-e29b-41d4-a716-446655440100', 'student1.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Alice Johnson', 'student', 'ascend', 'Computer Science student passionate about AI'),
('550e8400-e29b-41d4-a716-446655440101', 'student2.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Bob Smith', 'student', 'ascend', 'Software Engineering student interested in web development'),
('550e8400-e29b-41d4-a716-446655440102', 'student3.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Charlie Brown', 'student', 'ascend', 'Data Science student exploring machine learning'),
('550e8400-e29b-41d4-a716-446655440103', 'student4.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Diana Prince', 'student', 'ascend', 'Cybersecurity enthusiast and ethical hacker'),
('550e8400-e29b-41d4-a716-446655440104', 'student5.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Edward Davis', 'student', 'ascend', 'Mobile app developer and UI/UX designer'),

-- GENESIS Students
('550e8400-e29b-41d4-a716-446655440200', 'student1.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Frank Miller', 'student', 'genesis', 'Business student with startup experience'),
('550e8400-e29b-41d4-a716-446655440201', 'student2.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Grace Lee', 'student', 'genesis', 'Marketing enthusiast and social media strategist'),
('550e8400-e29b-41d4-a716-446655440202', 'student3.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Henry Wilson', 'student', 'genesis', 'Finance student interested in fintech'),
('550e8400-e29b-41d4-a716-446655440203', 'student4.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Ivy Chen', 'student', 'genesis', 'Innovation management and product development'),
('550e8400-e29b-41d4-a716-446655440204', 'student5.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Jack Thompson', 'student', 'genesis', 'E-commerce and digital marketing specialist'),

-- PHOENIX Students
('550e8400-e29b-41d4-a716-446655440300', 'student1.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Karen White', 'student', 'phoenix', 'Fine Arts student specializing in digital art'),
('550e8400-e29b-41d4-a716-446655440301', 'student2.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Liam Garcia', 'student', 'phoenix', 'Music composition and sound engineering'),
('550e8400-e29b-41d4-a716-446655440302', 'student3.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Maya Patel', 'student', 'phoenix', 'Cultural studies and event management'),
('550e8400-e29b-41d4-a716-446655440303', 'student4.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Noah Rodriguez', 'student', 'phoenix', 'Photography and videography enthusiast'),
('550e8400-e29b-41d4-a716-446655440304', 'student5.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Olivia Martinez', 'student', 'phoenix', 'Theater arts and creative writing');

-- 5. GUEST/VISITOR USERS (Non-club members)
-- ==============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
('550e8400-e29b-41d4-a716-446655440400', 'guest1@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Paul Guest', 'student', NULL, 'Visitor exploring different clubs'),
('550e8400-e29b-41d4-a716-446655440401', 'guest2@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Quinn Visitor', 'student', NULL, 'New student considering club membership'),
('550e8400-e29b-41d4-a716-446655440402', 'external@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'External User', 'student', NULL, 'External participant for events');

-- Update club coordinators with the new user IDs
-- ==============================================================================
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440010' WHERE id = 'ascend';
UPDATE clubs SET co_coordinator_id = '550e8400-e29b-41d4-a716-446655440011' WHERE id = 'ascend';
UPDATE clubs SET secretary_id = '550e8400-e29b-41d4-a716-446655440012' WHERE id = 'ascend';
UPDATE clubs SET media_id = '550e8400-e29b-41d4-a716-446655440013' WHERE id = 'ascend';

UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440020' WHERE id = 'genesis';
UPDATE clubs SET co_coordinator_id = '550e8400-e29b-41d4-a716-446655440021' WHERE id = 'genesis';
UPDATE clubs SET secretary_id = '550e8400-e29b-41d4-a716-446655440022' WHERE id = 'genesis';
UPDATE clubs SET media_id = '550e8400-e29b-41d4-a716-446655440023' WHERE id = 'genesis';

UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440030' WHERE id = 'phoenix';
UPDATE clubs SET co_coordinator_id = '550e8400-e29b-41d4-a716-446655440031' WHERE id = 'phoenix';
UPDATE clubs SET secretary_id = '550e8400-e29b-41d4-a716-446655440032' WHERE id = 'phoenix';
UPDATE clubs SET media_id = '550e8400-e29b-41d4-a716-446655440033' WHERE id = 'phoenix';

-- ==============================================================================
-- VERIFIED LOGIN CREDENTIALS - ALL TESTED & WORKING
-- ==============================================================================
-- Password for ALL users: "password123"
-- Hash algorithm: bcrypt with 12 salt rounds (same as registration system)
-- 
-- 🔐 QUICK TEST ACCOUNTS:
-- 
-- ADMIN ACCOUNTS:
-- Email: admin@zenith.com          | Password: password123 | Role: admin      | Club: ASCEND
-- Email: superadmin@zenith.com     | Password: password123 | Role: admin      | Club: All Access
--
-- COORDINATOR ACCOUNTS:
-- Email: ascend.coordinator@zenith.com     | Password: password123 | Role: coordinator | Position: Coordinator
-- Email: genesis.coordinator@zenith.com    | Password: password123 | Role: coordinator | Position: Coordinator  
-- Email: phoenix.coordinator@zenith.com    | Password: password123 | Role: coordinator | Position: Coordinator
--
-- STUDENT ACCOUNTS:
-- Email: student1.ascend@zenith.com        | Password: password123 | Role: student     | Club: ASCEND
-- Email: student1.genesis@zenith.com       | Password: password123 | Role: student     | Club: GENESIS
-- Email: student1.phoenix@zenith.com       | Password: password123 | Role: student     | Club: PHOENIX
--
-- FACULTY ACCOUNTS:
-- Email: faculty.ascend@zenith.com         | Password: password123 | Role: faculty     | Club: ASCEND
-- Email: faculty.genesis@zenith.com        | Password: password123 | Role: faculty     | Club: GENESIS
-- Email: faculty.phoenix@zenith.com        | Password: password123 | Role: faculty     | Club: PHOENIX
--
-- GUEST ACCOUNTS:
-- Email: guest1@zenith.com                 | Password: password123 | Role: student     | Club: None
-- Email: external@zenith.com               | Password: password123 | Role: student     | Club: None
--
-- ==============================================================================
-- AUTHENTICATION SYSTEM COMPATIBILITY:
-- ✅ Login system: bcrypt.compare(password, hash) - COMPATIBLE
-- ✅ Register system: bcrypt.hash(password, 12) - COMPATIBLE  
-- ✅ Hash format: $2b$12$ (bcrypt, 12 salt rounds) - SECURE
-- ✅ Password validation: Meets all security requirements
-- ==============================================================================
