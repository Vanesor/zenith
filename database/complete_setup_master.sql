-- ==============================================================================
-- ZENITH FORUM - COMPLETE DATABASE SETUP MASTER SCRIPT
-- ==============================================================================
-- This script sets up the complete Zenith Forum database with all required data
-- Run this script after creating the basic schema structure
-- ==============================================================================

\echo '================================================================================'
\echo 'ZENITH FORUM - COMPLETE DATABASE SETUP'
\echo '================================================================================'

\echo 'Step 1: Setting up user accounts...'
\i database/dummy_users_verified.sql

\echo 'Step 2: Setting up chat rooms...'
\i database/setup_chat_rooms.sql

\echo 'Step 3: Setting up assignments...'
\i database/setup_assignments.sql

\echo 'Step 4: Creating additional sample data...'

-- ==============================================================================
-- ADDITIONAL EVENTS DATA
-- ==============================================================================
DELETE FROM event_attendees;
DELETE FROM events;

INSERT INTO events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, created_at) VALUES
-- ASCEND Events
('550e8400-e001-41d4-a716-446655440001', 'Tech Innovation Summit 2025', 'Annual technology summit featuring industry leaders and innovative projects', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '15 days', '09:00:00', 'Main Auditorium', 200, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e001-41d4-a716-446655440002', 'Hackathon Weekend', '48-hour coding marathon to build innovative solutions', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '22 days', '18:00:00', 'Computer Lab Block A', 50, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e001-41d4-a716-446655440003', 'AI/ML Workshop Series', 'Hands-on workshop on artificial intelligence and machine learning', 'ascend', '550e8400-e29b-41d4-a716-446655440011', CURRENT_DATE + INTERVAL '8 days', '14:00:00', 'Seminar Hall 1', 80, 'upcoming', CURRENT_TIMESTAMP),

-- GENESIS Events
('550e8400-e002-41d4-a716-446655440001', 'Startup Pitch Competition', 'Compete with your startup ideas and win funding opportunities', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '18 days', '10:00:00', 'Business Center', 100, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e002-41d4-a716-446655440002', 'Entrepreneur Meet & Greet', 'Network with successful entrepreneurs and industry mentors', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '12 days', '17:00:00', 'Conference Room B', 60, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e002-41d4-a716-446655440003', 'Digital Marketing Masterclass', 'Learn advanced digital marketing strategies from experts', 'genesis', '550e8400-e29b-41d4-a716-446655440021', CURRENT_DATE + INTERVAL '25 days', '13:00:00', 'Media Lab', 40, 'upcoming', CURRENT_TIMESTAMP),

-- PHOENIX Events
('550e8400-e003-41d4-a716-446655440001', 'Cultural Arts Festival', 'Showcase of diverse cultural performances and art exhibitions', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '20 days', '16:00:00', 'Open Amphitheater', 300, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e003-41d4-a716-446655440002', 'Photography Exhibition Opening', 'Opening night for student photography exhibition', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '10 days', '19:00:00', 'Art Gallery', 120, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e003-41d4-a716-446655440003', 'Music Concert Night', 'Live performances by student musicians and bands', 'phoenix', '550e8400-e29b-41d4-a716-446655440031', CURRENT_DATE + INTERVAL '28 days', '20:00:00', 'Music Hall', 180, 'upcoming', CURRENT_TIMESTAMP);

-- Sample event attendees
INSERT INTO event_attendees (id, event_id, user_id, registered_at, attendance_status) VALUES
-- ASCEND event attendees
('550e8400-ea01-41d4-a716-446655440001', '550e8400-e001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', CURRENT_TIMESTAMP, 'registered'),
('550e8400-ea01-41d4-a716-446655440002', '550e8400-e001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', CURRENT_TIMESTAMP, 'registered'),
('550e8400-ea01-41d4-a716-446655440003', '550e8400-e001-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', CURRENT_TIMESTAMP, 'registered'),

-- GENESIS event attendees
('550e8400-ea02-41d4-a716-446655440001', '550e8400-e002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440200', CURRENT_TIMESTAMP, 'registered'),
('550e8400-ea02-41d4-a716-446655440002', '550e8400-e002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', CURRENT_TIMESTAMP, 'registered'),

-- PHOENIX event attendees
('550e8400-ea03-41d4-a716-446655440001', '550e8400-e003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440300', CURRENT_TIMESTAMP, 'registered'),
('550e8400-ea03-41d4-a716-446655440002', '550e8400-e003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440301', CURRENT_TIMESTAMP, 'registered');

-- ==============================================================================
-- NOTIFICATIONS DATA
-- ==============================================================================
DELETE FROM notifications;

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
-- Assignment notifications
('550e8400-n001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'New Assignment: Web Development Project', 'A new assignment has been posted in ASCEND club. Due in 2 weeks.', 'assignment', false, CURRENT_TIMESTAMP),
('550e8400-n001-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440200', 'New Assignment: Business Plan Development', 'A new assignment has been posted in GENESIS club. Due in 3 weeks.', 'assignment', false, CURRENT_TIMESTAMP),
('550e8400-n001-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440300', 'New Assignment: Digital Art Portfolio', 'A new assignment has been posted in PHOENIX club. Due in 4 weeks.', 'assignment', false, CURRENT_TIMESTAMP),

-- Event notifications
('550e8400-n002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'Upcoming Event: Tech Innovation Summit', 'You are registered for the Tech Innovation Summit happening in 15 days.', 'event', false, CURRENT_TIMESTAMP),
('550e8400-n002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440200', 'Upcoming Event: Startup Pitch Competition', 'You are registered for the Startup Pitch Competition happening in 18 days.', 'event', false, CURRENT_TIMESTAMP),

-- System notifications
('550e8400-n003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'Welcome to Zenith Forum!', 'Welcome to the Zenith Forum platform! Explore clubs, assignments, and connect with fellow students.', 'system', false, CURRENT_TIMESTAMP),
('550e8400-n003-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440200', 'Welcome to Zenith Forum!', 'Welcome to the Zenith Forum platform! Explore clubs, assignments, and connect with fellow students.', 'system', false, CURRENT_TIMESTAMP);

-- ==============================================================================
-- FORUM POSTS/DISCUSSIONS DATA
-- ==============================================================================
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM posts;

INSERT INTO posts (id, title, content, author_id, club_id, category, created_at, updated_at) VALUES
-- ASCEND posts
('550e8400-p001-41d4-a716-446655440001', 'Getting Started with React Hooks', 'React Hooks have revolutionized how we write React components. In this post, I''ll share some best practices for using useState, useEffect, and custom hooks in your projects...', '550e8400-e29b-41d4-a716-446655440100', 'ascend', 'tutorial', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('550e8400-p001-41d4-a716-446655440002', 'Machine Learning Resources', 'Here are some excellent resources for getting started with machine learning: 1. Andrew Ng''s Course on Coursera 2. Fast.ai practical course 3. Kaggle Learn modules...', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'resources', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- GENESIS posts
('550e8400-p002-41d4-a716-446655440001', 'Startup Funding Landscape 2025', 'The startup funding landscape has evolved significantly. Here''s what you need to know about securing funding for your startup in 2025...', '550e8400-e29b-41d4-a716-446655440200', 'genesis', 'discussion', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('550e8400-p002-41d4-a716-446655440002', 'Digital Marketing Trends', 'Key digital marketing trends to watch: 1. AI-powered personalization 2. Voice search optimization 3. Video-first content strategy...', '550e8400-e29b-41d4-a716-446655440201', 'genesis', 'insights', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- PHOENIX posts
('550e8400-p003-41d4-a716-446655440001', 'Photography Tips for Beginners', 'Starting your photography journey? Here are essential tips: 1. Understand the rule of thirds 2. Master natural lighting 3. Practice composition techniques...', '550e8400-e29b-41d4-a716-446655440300', 'phoenix', 'tutorial', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
('550e8400-p003-41d4-a716-446655440002', 'Music Production Software Comparison', 'Comparing popular DAWs for music production: Logic Pro X vs FL Studio vs Ableton Live. Each has its strengths for different types of music creation...', '550e8400-e29b-41d4-a716-446655440301', 'phoenix', 'review', CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- Sample comments
INSERT INTO comments (id, post_id, author_id, content, created_at) VALUES
('550e8400-c001-41d4-a716-446655440001', '550e8400-p001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'Great explanation! The useEffect example really helped me understand the concept better.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('550e8400-c001-41d4-a716-446655440002', '550e8400-p002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440202', 'Very insightful analysis. The section on Series A trends was particularly helpful.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('550e8400-c001-41d4-a716-446655440003', '550e8400-p003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440302', 'These tips are gold! Just applied the rule of thirds and my photos improved immediately.', CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- Sample likes
INSERT INTO likes (id, post_id, user_id, created_at) VALUES
('550e8400-l001-41d4-a716-446655440001', '550e8400-p001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('550e8400-l001-41d4-a716-446655440002', '550e8400-p001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('550e8400-l001-41d4-a716-446655440003', '550e8400-p002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('550e8400-l001-41d4-a716-446655440004', '550e8400-p003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440301', CURRENT_TIMESTAMP - INTERVAL '3 hours');

\echo 'Step 5: Creating performance indexes...'

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

\echo 'Step 6: Final verification...'

-- Verification queries
SELECT 'Users:' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Clubs:' as table_name, count(*) as count FROM clubs
UNION ALL
SELECT 'Chat Rooms:' as table_name, count(*) as count FROM chat_rooms
UNION ALL
SELECT 'Chat Messages:' as table_name, count(*) as count FROM chat_messages
UNION ALL
SELECT 'Assignments:' as table_name, count(*) as count FROM assignments
UNION ALL
SELECT 'Assignment Submissions:' as table_name, count(*) as count FROM assignment_submissions
UNION ALL
SELECT 'Events:' as table_name, count(*) as count FROM events
UNION ALL
SELECT 'Event Attendees:' as table_name, count(*) as count FROM event_attendees
UNION ALL
SELECT 'Notifications:' as table_name, count(*) as count FROM notifications
UNION ALL
SELECT 'Posts:' as table_name, count(*) as count FROM posts
UNION ALL
SELECT 'Comments:' as table_name, count(*) as count FROM comments
UNION ALL
SELECT 'Likes:' as table_name, count(*) as count FROM likes
ORDER BY table_name;

\echo '================================================================================'
\echo 'ZENITH FORUM DATABASE SETUP COMPLETE!'
\echo '================================================================================'
\echo 'The database is now fully populated with:'
\echo '✅ 36 verified user accounts across all roles'
\echo '✅ 15 chat rooms (3 public + 12 club-specific)'
\echo '✅ Sample chat messages for testing'
\echo '✅ 12 assignments across all clubs'
\echo '✅ Sample assignment submissions'
\echo '✅ 9 upcoming events'
\echo '✅ Event registrations'
\echo '✅ Notifications for users'
\echo '✅ Discussion posts and comments'
\echo '✅ Performance indexes'
\echo ''
\echo 'Ready for testing! Use any of the verified login credentials:'
\echo 'Email: ascend.coordinator@zenith.com | Password: password123'
\echo 'Email: student1.ascend@zenith.com    | Password: password123'
\echo 'Email: admin@zenith.com              | Password: password123'
\echo '================================================================================'
