-- ==============================================================================
-- ZENITH FORUM - CHAT ROOMS SETUP WITH PROPER DATA
-- ==============================================================================
-- This script creates proper chat room data for all clubs
-- Designed to work with the existing database schema
-- ==============================================================================

-- Clear existing chat rooms and messages
DELETE FROM chat_messages;
DELETE FROM chat_rooms;

-- ==============================================================================
-- 1. PUBLIC CHAT ROOMS (Accessible to all users)
-- ==============================================================================
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by, created_at) VALUES
('550e8400-c000-41d4-a716-446655440001', 'General Discussion', 'Open discussion for all members across clubs', NULL, 'public', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP),
('550e8400-c000-41d4-a716-446655440002', 'Announcements', 'Official announcements from administration', NULL, 'public', '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP),
('550e8400-c000-41d4-a716-446655440003', 'Help & Support', 'Get help and support from other members', NULL, 'public', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 2. ASCEND CLUB CHAT ROOMS
-- ==============================================================================
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by, created_at) VALUES
('550e8400-c001-41d4-a716-446655440001', 'ASCEND General', 'Main discussion room for ASCEND technical club', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP),
('550e8400-c001-41d4-a716-446655440002', 'ASCEND Projects', 'Discussion about ongoing technical projects', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP),
('550e8400-c001-41d4-a716-446655440003', 'ASCEND Study Group', 'Academic discussions and study materials', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440011', CURRENT_TIMESTAMP),
('550e8400-c001-41d4-a716-446655440004', 'ASCEND Events', 'Planning and coordination for technical events', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440012', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 3. GENESIS CLUB CHAT ROOMS
-- ==============================================================================
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by, created_at) VALUES
('550e8400-c002-41d4-a716-446655440001', 'GENESIS General', 'Main discussion room for GENESIS entrepreneurship club', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP),
('550e8400-c002-41d4-a716-446655440002', 'GENESIS Startups', 'Discussion about startup ideas and business ventures', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP),
('550e8400-c002-41d4-a716-446655440003', 'GENESIS Mentorship', 'Connect with mentors and share experiences', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440021', CURRENT_TIMESTAMP),
('550e8400-c002-41d4-a716-446655440004', 'GENESIS Workshops', 'Planning business workshops and seminars', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440022', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 4. PHOENIX CLUB CHAT ROOMS
-- ==============================================================================
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by, created_at) VALUES
('550e8400-c003-41d4-a716-446655440001', 'PHOENIX General', 'Main discussion room for PHOENIX cultural club', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP),
('550e8400-c003-41d4-a716-446655440002', 'PHOENIX Arts', 'Share and discuss artistic creations and ideas', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP),
('550e8400-c003-41d4-a716-446655440003', 'PHOENIX Events', 'Planning cultural events and performances', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440031', CURRENT_TIMESTAMP),
('550e8400-c003-41d4-a716-446655440004', 'PHOENIX Creative Corner', 'Showcase creative work and get feedback', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440032', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 5. SAMPLE CHAT MESSAGES FOR DEMONSTRATION
-- ==============================================================================

-- Messages in General Discussion (Public)
INSERT INTO chat_messages (id, room_id, user_id, message, created_at) VALUES
('550e8400-m001-41d4-a716-446655440001', '550e8400-c000-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Welcome to the Zenith Forum! 🎉', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('550e8400-m001-41d4-a716-446655440002', '550e8400-c000-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'Thanks for creating this platform! Excited to be here.', CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes'),
('550e8400-m001-41d4-a716-446655440003', '550e8400-c000-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440200', 'Great to connect with students from all clubs!', CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Messages in ASCEND General
INSERT INTO chat_messages (id, room_id, user_id, message, created_at) VALUES
('550e8400-m002-41d4-a716-446655440001', '550e8400-c001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'Welcome to ASCEND! Let''s build amazing tech projects together.', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('550e8400-m002-41d4-a716-446655440002', '550e8400-c001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'Looking forward to the upcoming hackathon!', CURRENT_TIMESTAMP - INTERVAL '2 hours 30 minutes'),
('550e8400-m002-41d4-a716-446655440003', '550e8400-c001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Anyone working on web development projects?', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Messages in GENESIS General
INSERT INTO chat_messages (id, room_id, user_id, message, created_at) VALUES
('550e8400-m003-41d4-a716-446655440001', '550e8400-c002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 'GENESIS is where entrepreneurial dreams come to life!', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('550e8400-m003-41d4-a716-446655440002', '550e8400-c002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440200', 'Excited to pitch my startup idea next week.', CURRENT_TIMESTAMP - INTERVAL '3 hours 30 minutes'),
('550e8400-m003-41d4-a716-446655440003', '550e8400-c002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', 'The mentorship program has been incredibly valuable!', CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- Messages in PHOENIX General
INSERT INTO chat_messages (id, room_id, user_id, message, created_at) VALUES
('550e8400-m004-41d4-a716-446655440001', '550e8400-c003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'PHOENIX - where creativity meets culture! 🎨', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
('550e8400-m004-41d4-a716-446655440002', '550e8400-c003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440300', 'Working on a digital art exhibition for next month.', CURRENT_TIMESTAMP - INTERVAL '4 hours 30 minutes'),
('550e8400-m004-41d4-a716-446655440003', '550e8400-c003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440301', 'The music composition workshop was amazing!', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- ==============================================================================
-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================
-- Uncomment to verify the data has been inserted correctly

-- SELECT 'Chat Rooms Created:' as info, count(*) as total FROM chat_rooms;
-- SELECT 'Messages Created:' as info, count(*) as total FROM chat_messages;
-- 
-- SELECT 
--   cr.name as room_name,
--   cr.type,
--   c.name as club_name,
--   count(cm.id) as message_count
-- FROM chat_rooms cr
-- LEFT JOIN clubs c ON cr.club_id = c.id
-- LEFT JOIN chat_messages cm ON cr.id = cm.room_id
-- GROUP BY cr.id, cr.name, cr.type, c.name
-- ORDER BY cr.type, c.name, cr.name;

-- ==============================================================================
-- SETUP COMPLETE
-- ==============================================================================
-- Chat rooms system is now properly initialized with:
-- ✅ 3 Public rooms (accessible to all)
-- ✅ 4 ASCEND club rooms
-- ✅ 4 GENESIS club rooms  
-- ✅ 4 PHOENIX club rooms
-- ✅ Sample messages for demonstration
-- ✅ Proper indexes for performance
-- ==============================================================================
