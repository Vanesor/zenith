-- Insert sample data for discussions and chat rooms
-- Run this AFTER management_accounts.sql

-- Insert default chat rooms for each club
INSERT INTO chat_rooms (name, description, club_id, type, created_by) VALUES
('Ascend General', 'General discussion for Ascend club members', 'ascend', 'public', '550e8400-e29b-41d4-a716-446655440101'),
('Ascend Announcements', 'Official announcements for Ascend club', 'ascend', 'announcement', '550e8400-e29b-41d4-a716-446655440101'),
('Aster General', 'General discussion for Aster club members', 'aster', 'public', '550e8400-e29b-41d4-a716-446655440201'),
('Aster Announcements', 'Official announcements for Aster club', 'aster', 'announcement', '550e8400-e29b-41d4-a716-446655440201'),
('Achievers General', 'General discussion for Achievers club members', 'achievers', 'public', '550e8400-e29b-41d4-a716-446655440301'),
('Achievers Announcements', 'Official announcements for Achievers club', 'achievers', 'announcement', '550e8400-e29b-41d4-a716-446655440301'),
('Altogether General', 'General discussion for Altogether club members', 'altogether', 'public', '550e8400-e29b-41d4-a716-446655440401'),
('Altogether Announcements', 'Official announcements for Altogether club', 'altogether', 'announcement', '550e8400-e29b-41d4-a716-446655440401'),
('Zenith Forum', 'General discussion for all Zenith members', NULL, 'public', '550e8400-e29b-41d4-a716-446655440501');

-- Insert sample discussions
INSERT INTO discussions (title, description, author_id, club_id, category, tags, pinned) VALUES
('Welcome to Ascend!', 'Introduce yourself and let us know what programming languages you''re interested in learning.', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'introductions', '{"welcome", "introductions"}', true),
('React vs Vue: Which framework to choose?', 'Let''s discuss the pros and cons of different JavaScript frameworks for beginners.', '550e8400-e29b-41d4-a716-446655440102', 'ascend', 'technical', '{"react", "vue", "javascript"}', false),
('Public Speaking Tips', 'Share your best tips for overcoming stage fright and delivering effective presentations.', '550e8400-e29b-41d4-a716-446655440201', 'aster', 'tips', '{"public-speaking", "presentations"}', false),
('Graduate School Application Timeline', 'When should you start preparing for graduate school applications?', '550e8400-e29b-41d4-a716-446655440301', 'achievers', 'guidance', '{"graduate-school", "applications"}', false),
('Daily Mindfulness Practices', 'What mindfulness techniques work best for you during stressful periods?', '550e8400-e29b-41d4-a716-446655440401', 'altogether', 'wellness', '{"mindfulness", "stress-relief"}', false);

-- Insert sample user badges for management
INSERT INTO user_badges (user_id, badge_type, badge_name, description, icon, color) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'role', 'Coordinator', 'Club Coordinator', '👑', '#FFD700'),
('550e8400-e29b-41d4-a716-446655440102', 'role', 'Co-Coordinator', 'Club Co-Coordinator', '🛡️', '#4A90E2'),
('550e8400-e29b-41d4-a716-446655440103', 'role', 'Secretary', 'Club Secretary', '📝', '#50C878'),
('550e8400-e29b-41d4-a716-446655440104', 'role', 'Media Head', 'Club Media Head', '✏️', '#9B59B6'),
('550e8400-e29b-41d4-a716-446655440201', 'role', 'Coordinator', 'Club Coordinator', '👑', '#FFD700'),
('550e8400-e29b-41d4-a716-446655440202', 'role', 'Co-Coordinator', 'Club Co-Coordinator', '🛡️', '#4A90E2'),
('550e8400-e29b-41d4-a716-446655440203', 'role', 'Secretary', 'Club Secretary', '📝', '#50C878'),
('550e8400-e29b-41d4-a716-446655440204', 'role', 'Media Head', 'Club Media Head', '✏️', '#9B59B6'),
('550e8400-e29b-41d4-a716-446655440301', 'role', 'Coordinator', 'Club Coordinator', '👑', '#FFD700'),
('550e8400-e29b-41d4-a716-446655440302', 'role', 'Co-Coordinator', 'Club Co-Coordinator', '🛡️', '#4A90E2'),
('550e8400-e29b-41d4-a716-446655440303', 'role', 'Secretary', 'Club Secretary', '📝', '#50C878'),
('550e8400-e29b-41d4-a716-446655440304', 'role', 'Media Head', 'Club Media Head', '✏️', '#9B59B6'),
('550e8400-e29b-41d4-a716-446655440401', 'role', 'Coordinator', 'Club Coordinator', '👑', '#FFD700'),
('550e8400-e29b-41d4-a716-446655440402', 'role', 'Co-Coordinator', 'Club Co-Coordinator', '🛡️', '#4A90E2'),
('550e8400-e29b-41d4-a716-446655440403', 'role', 'Secretary', 'Club Secretary', '📝', '#50C878'),
('550e8400-e29b-41d4-a716-446655440404', 'role', 'Media Head', 'Club Media Head', '✏️', '#9B59B6'),
('550e8400-e29b-41d4-a716-446655440501', 'role', 'President', 'Zenith Forum President', '⭐', '#E74C3C'),
('550e8400-e29b-41d4-a716-446655440502', 'role', 'Vice President', 'Zenith Forum Vice President', '⭐', '#F39C12');

-- Insert some sample events
INSERT INTO events (title, description, date, time, location, club_id, created_by, max_attendees, status) VALUES
('Advanced React Workshop', 'Learn advanced React patterns, hooks, and performance optimization', '2025-02-10', '14:00', 'Tech Lab A', 'ascend', '550e8400-e29b-41d4-a716-446655440101', 30, 'upcoming'),
('Hackathon 2025', '48-hour coding challenge to build innovative solutions', '2025-02-15', '09:00', 'Main Auditorium', 'ascend', '550e8400-e29b-41d4-a716-446655440101', 100, 'upcoming'),
('Public Speaking Masterclass', 'Overcome stage fright and deliver impactful presentations', '2025-02-12', '10:00', 'Conference Room B', 'aster', '550e8400-e29b-41d4-a716-446655440201', 25, 'upcoming'),
('Leadership Workshop', 'Develop essential leadership skills for team management', '2025-02-20', '15:00', 'Meeting Room C', 'aster', '550e8400-e29b-41d4-a716-446655440201', 20, 'upcoming'),
('GRE Strategy Session', 'Comprehensive guide to GRE preparation and test strategies', '2025-02-15', '16:00', 'Study Hall', 'achievers', '550e8400-e29b-41d4-a716-446655440301', 40, 'upcoming'),
('Research Methodology Workshop', 'Learn research techniques and academic writing', '2025-02-25', '11:00', 'Library Conference Room', 'achievers', '550e8400-e29b-41d4-a716-446655440301', 35, 'upcoming'),
('Mindfulness & Meditation', 'Stress relief and mental wellness session', '2025-02-18', '18:00', 'Wellness Center', 'altogether', '550e8400-e29b-41d4-a716-446655440401', 50, 'upcoming'),
('Personal Development Seminar', 'Build confidence and discover your potential', '2025-02-22', '14:00', 'Multipurpose Hall', 'altogether', '550e8400-e29b-41d4-a716-446655440401', 45, 'upcoming');

-- Insert some sample posts
INSERT INTO posts (title, content, author_id, club_id) VALUES
('Tips for Effective Debugging', 'Debugging is an essential skill for every programmer. Here are some proven techniques that will help you identify and fix bugs more efficiently...', '550e8400-e29b-41d4-a716-446655440101', 'ascend'),
('Best Practices for React Development', 'Working with React for years has taught me valuable lessons. Let me share some best practices that will make your code cleaner and more maintainable...', '550e8400-e29b-41d4-a716-446655440102', 'ascend'),
('Building Confidence in Presentations', 'Public speaking can be intimidating, but with the right techniques and practice, anyone can become a confident presenter. Here''s how to overcome your fears...', '550e8400-e29b-41d4-a716-446655440201', 'aster'),
('Effective Team Communication', 'Clear communication is the foundation of successful teamwork. Learn how to communicate effectively with your team members...', '550e8400-e29b-41d4-a716-446655440202', 'aster'),
('Research Paper Writing Guide', 'Writing a research paper can seem overwhelming, but breaking it down into manageable steps makes the process much easier...', '550e8400-e29b-41d4-a716-446655440301', 'achievers'),
('Preparing for Graduate School', 'Getting into graduate school requires careful planning and preparation. Here''s a comprehensive guide to help you succeed...', '550e8400-e29b-41d4-a716-446655440302', 'achievers'),
('Daily Wellness Routines', 'Small daily habits can have a profound impact on your overall well-being. Here are some simple routines to incorporate into your day...', '550e8400-e29b-41d4-a716-446655440401', 'altogether'),
('Managing Stress During Exams', 'Exam season can be stressful, but with the right strategies, you can maintain your mental health while performing well...', '550e8400-e29b-41d4-a716-446655440402', 'altogether');

-- Insert some announcements
INSERT INTO announcements (title, content, type, author_id, club_id, priority) VALUES
('Upcoming Hackathon Registration', 'Registration is now open for our annual hackathon! Limited spots available. Register early to secure your place.', 'event', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'high'),
('New Workshop Series on Communication', 'We''re excited to announce a new workshop series focusing on advanced communication skills. Sessions will be held every Friday.', 'event', '550e8400-e29b-41d4-a716-446655440201', 'aster', 'medium'),
('Graduate School Fair Next Month', 'Representatives from top universities will be visiting our campus. Don''t miss this opportunity to learn about graduate programs.', 'event', '550e8400-e29b-41d4-a716-446655440301', 'achievers', 'high'),
('Mental Health Awareness Week', 'Join us for a week of activities focused on mental health and wellness. Various workshops and sessions available.', 'event', '550e8400-e29b-41d4-a716-446655440401', 'altogether', 'medium'),
('Welcome to Zenith Forum!', 'Welcome to the new academic year! We have exciting events and opportunities planned for all our clubs.', 'general', '550e8400-e29b-41d4-a716-446655440501', NULL, 'high');

SELECT 'Sample data inserted successfully! You now have users, clubs, discussions, chat rooms, events, posts, and announcements.' as message;
