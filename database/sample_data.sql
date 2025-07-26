-- Sample data for Zenith Forum Database
-- Run this after creating the schema

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, role, clubs, bio) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alex.chen@zenith.edu', '$2b$10$example_hash', 'Alex Chen', 'coordinator', '{"ascend"}', 'Passionate about coding and innovation'),
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson@zenith.edu', '$2b$10$example_hash', 'Sarah Johnson', 'co_coordinator', '{"ascend"}', 'Full-stack developer and mentor'),
('550e8400-e29b-41d4-a716-446655440003', 'mike.davis@zenith.edu', '$2b$10$example_hash', 'Mike Davis', 'secretary', '{"ascend"}', 'Organizing tech events and workshops'),
('550e8400-e29b-41d4-a716-446655440004', 'emily.zhang@zenith.edu', '$2b$10$example_hash', 'Emily Zhang', 'media', '{"ascend"}', 'Social media and content creation'),
('550e8400-e29b-41d4-a716-446655440005', 'jessica.liu@zenith.edu', '$2b$10$example_hash', 'Jessica Liu', 'coordinator', '{"aster"}', 'Communication expert and public speaker'),
('550e8400-e29b-41d4-a716-446655440006', 'david.park@zenith.edu', '$2b$10$example_hash', 'David Park', 'co_coordinator', '{"aster"}', 'Leadership and team building specialist'),
('550e8400-e29b-41d4-a716-446655440007', 'rachel.green@zenith.edu', '$2b$10$example_hash', 'Rachel Green', 'secretary', '{"aster"}', 'Event planning and organization'),
('550e8400-e29b-41d4-a716-446655440008', 'tom.wilson@zenith.edu', '$2b$10$example_hash', 'Tom Wilson', 'media', '{"aster"}', 'Digital marketing and content strategy'),
('550e8400-e29b-41d4-a716-446655440009', 'priya.sharma@zenith.edu', '$2b$10$example_hash', 'Dr. Priya Sharma', 'coordinator', '{"achievers"}', 'Academic counselor and research guide'),
('550e8400-e29b-41d4-a716-446655440010', 'kevin.lee@zenith.edu', '$2b$10$example_hash', 'Kevin Lee', 'co_coordinator', '{"achievers"}', 'Graduate school preparation expert'),
('550e8400-e29b-41d4-a716-446655440011', 'lisa.wang@zenith.edu', '$2b$10$example_hash', 'Lisa Wang', 'secretary', '{"achievers"}', 'Research coordination and documentation'),
('550e8400-e29b-41d4-a716-446655440012', 'jake.thompson@zenith.edu', '$2b$10$example_hash', 'Jake Thompson', 'media', '{"achievers"}', 'Academic content and social outreach'),
('550e8400-e29b-41d4-a716-446655440013', 'maya.patel@zenith.edu', '$2b$10$example_hash', 'Maya Patel', 'coordinator', '{"altogether"}', 'Wellness coach and personal development'),
('550e8400-e29b-41d4-a716-446655440014', 'chris.martinez@zenith.edu', '$2b$10$example_hash', 'Chris Martinez', 'co_coordinator', '{"altogether"}', 'Mental health and mindfulness advocate'),
('550e8400-e29b-41d4-a716-446655440015', 'anna.brown@zenith.edu', '$2b$10$example_hash', 'Anna Brown', 'secretary', '{"altogether"}', 'Program coordination and member support'),
('550e8400-e29b-41d4-a716-446655440016', 'sam.rodriguez@zenith.edu', '$2b$10$example_hash', 'Sam Rodriguez', 'media', '{"altogether"}', 'Wellness content and community building'),
('550e8400-e29b-41d4-a716-446655440017', 'john.doe@zenith.edu', '$2b$10$example_hash', 'John Doe', 'student', '{"ascend", "aster"}', 'Computer Science student interested in coding and communication'),
('550e8400-e29b-41d4-a716-446655440018', 'jane.smith@zenith.edu', '$2b$10$example_hash', 'Jane Smith', 'student', '{"achievers", "altogether"}', 'Pre-med student focused on personal growth'),
('550e8400-e29b-41d4-a716-446655440019', 'robert.president@zenith.edu', '$2b$10$example_hash', 'Robert Johnson', 'president', '{"ascend", "aster", "achievers", "altogether"}', 'Zenith Forum President'),
('550e8400-e29b-41d4-a716-446655440020', 'maria.vp@zenith.edu', '$2b$10$example_hash', 'Maria Garcia', 'vice_president', '{"ascend", "aster", "achievers", "altogether"}', 'Zenith Forum Vice President');

-- Insert clubs
INSERT INTO clubs (id, name, type, description, long_description, icon, color, coordinator_id, co_coordinator_id, secretary_id, media_id) VALUES
('ascend', 'Ascend', 'Coding Club', 'Programming challenges and tech innovation', 'Ascend is the premier coding club of Zenith, dedicated to fostering excellence in programming, software development, and technological innovation. We organize hackathons, coding challenges, tech talks, and collaborative projects to help members grow their technical skills.', 'Code', 'from-blue-500 to-cyan-500', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'),
('aster', 'Aster', 'Soft Skills Club', 'Communication and leadership development', 'Aster focuses on developing essential soft skills including communication, leadership, teamwork, and interpersonal abilities. Through workshops, seminars, and practical sessions, we help members become confident communicators and effective leaders.', 'MessageSquare', 'from-green-500 to-emerald-500', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008'),
('achievers', 'Achievers', 'Higher Studies Club', 'Graduate preparation and academic excellence', 'Achievers is dedicated to helping students excel in their academic pursuits and prepare for higher studies. We provide guidance for competitive exams, research opportunities, graduate school applications, and academic skill development.', 'GraduationCap', 'from-purple-500 to-violet-500', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'),
('altogether', 'Altogether', 'Holistic Growth', 'Wellness and personality development', 'Altogether focuses on holistic personality development, mental wellness, and life skills. We organize wellness workshops, meditation sessions, personal development activities, and provide support for overall growth and well-being.', 'Heart', 'from-pink-500 to-rose-500', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440016');

-- Insert sample events
INSERT INTO events (title, description, date, time, location, club_id, created_by, max_attendees, status) VALUES
('Advanced React Workshop', 'Learn advanced React patterns, hooks, and performance optimization', '2025-02-10', '14:00', 'Tech Lab A', 'ascend', '550e8400-e29b-41d4-a716-446655440001', 30, 'upcoming'),
('Hackathon 2025', '48-hour coding challenge to build innovative solutions', '2025-02-15', '09:00', 'Main Auditorium', 'ascend', '550e8400-e29b-41d4-a716-446655440001', 100, 'upcoming'),
('Public Speaking Masterclass', 'Overcome stage fright and deliver impactful presentations', '2025-02-12', '10:00', 'Conference Room B', 'aster', '550e8400-e29b-41d4-a716-446655440005', 25, 'upcoming'),
('Leadership Workshop', 'Develop essential leadership skills for team management', '2025-02-20', '15:00', 'Meeting Room C', 'aster', '550e8400-e29b-41d4-a716-446655440005', 20, 'upcoming'),
('GRE Strategy Session', 'Comprehensive guide to GRE preparation and test strategies', '2025-02-15', '16:00', 'Study Hall', 'achievers', '550e8400-e29b-41d4-a716-446655440009', 40, 'upcoming'),
('Research Methodology Workshop', 'Learn research techniques and academic writing', '2025-02-25', '11:00', 'Library Conference Room', 'achievers', '550e8400-e29b-41d4-a716-446655440009', 35, 'upcoming'),
('Mindfulness & Meditation', 'Stress relief and mental wellness session', '2025-02-18', '18:00', 'Wellness Center', 'altogether', '550e8400-e29b-41d4-a716-446655440013', 50, 'upcoming'),
('Personal Development Seminar', 'Build confidence and discover your potential', '2025-02-22', '14:00', 'Multipurpose Hall', 'altogether', '550e8400-e29b-41d4-a716-446655440013', 45, 'upcoming');

-- Insert sample posts
INSERT INTO posts (title, content, author_id, club_id) VALUES
('Tips for Effective Debugging', 'Debugging is an essential skill for every programmer. Here are some proven techniques that will help you identify and fix bugs more efficiently...', '550e8400-e29b-41d4-a716-446655440001', 'ascend'),
('Best Practices for React Development', 'Working with React for years has taught me valuable lessons. Let me share some best practices that will make your code cleaner and more maintainable...', '550e8400-e29b-41d4-a716-446655440002', 'ascend'),
('Building Confidence in Presentations', 'Public speaking can be intimidating, but with the right techniques and practice, anyone can become a confident presenter. Here''s how to overcome your fears...', '550e8400-e29b-41d4-a716-446655440005', 'aster'),
('Effective Team Communication', 'Clear communication is the foundation of successful teamwork. Learn how to communicate effectively with your team members...', '550e8400-e29b-41d4-a716-446655440006', 'aster'),
('Research Paper Writing Guide', 'Writing a research paper can seem overwhelming, but breaking it down into manageable steps makes the process much easier...', '550e8400-e29b-41d4-a716-446655440009', 'achievers'),
('Preparing for Graduate School', 'Getting into graduate school requires careful planning and preparation. Here''s a comprehensive guide to help you succeed...', '550e8400-e29b-41d4-a716-446655440010', 'achievers'),
('Daily Wellness Routines', 'Small daily habits can have a profound impact on your overall well-being. Here are some simple routines to incorporate into your day...', '550e8400-e29b-41d4-a716-446655440013', 'altogether'),
('Managing Stress During Exams', 'Exam season can be stressful, but with the right strategies, you can maintain your mental health while performing well...', '550e8400-e29b-41d4-a716-446655440014', 'altogether');

-- Insert sample comments
INSERT INTO comments (content, author_id, post_id) VALUES
('Great tips! The console.log technique has saved me countless hours.', '550e8400-e29b-41d4-a716-446655440017', (SELECT id FROM posts WHERE title = 'Tips for Effective Debugging')),
('I especially liked the part about understanding the problem before jumping to solutions.', '550e8400-e29b-41d4-a716-446655440018', (SELECT id FROM posts WHERE title = 'Tips for Effective Debugging')),
('This really helped me prepare for my presentation last week. Thank you!', '550e8400-e29b-41d4-a716-446655440017', (SELECT id FROM posts WHERE title = 'Building Confidence in Presentations')),
('The breathing exercises you mentioned work wonders for nervousness.', '550e8400-e29b-41d4-a716-446655440018', (SELECT id FROM posts WHERE title = 'Building Confidence in Presentations'));

-- Insert sample announcements
INSERT INTO announcements (title, content, type, author_id, club_id, priority) VALUES
('Upcoming Hackathon Registration', 'Registration is now open for our annual hackathon! Limited spots available. Register early to secure your place.', 'event', '550e8400-e29b-41d4-a716-446655440001', 'ascend', 'high'),
('New Workshop Series on Communication', 'We''re excited to announce a new workshop series focusing on advanced communication skills. Sessions will be held every Friday.', 'event', '550e8400-e29b-41d4-a716-446655440005', 'aster', 'medium'),
('Graduate School Fair Next Month', 'Representatives from top universities will be visiting our campus. Don''t miss this opportunity to learn about graduate programs.', 'event', '550e8400-e29b-41d4-a716-446655440009', 'achievers', 'high'),
('Mental Health Awareness Week', 'Join us for a week of activities focused on mental health and wellness. Various workshops and sessions available.', 'event', '550e8400-e29b-41d4-a716-446655440013', 'altogether', 'medium'),
('Welcome to Zenith Forum!', 'Welcome to the new academic year! We have exciting events and opportunities planned for all our clubs.', 'general', '550e8400-e29b-41d4-a716-446655440019', NULL, 'high');

-- Insert sample assignments
INSERT INTO assignments (title, description, club_id, created_by, due_date, max_points, status) VALUES
('Build a Personal Portfolio Website', 'Create a responsive portfolio website showcasing your projects and skills. Use modern web technologies and best practices.', 'ascend', '550e8400-e29b-41d4-a716-446655440001', '2025-03-15 23:59:00', 100, 'published'),
('Prepare a 5-Minute Presentation', 'Choose a topic you''re passionate about and prepare a 5-minute presentation. Focus on clear delivery and audience engagement.', 'aster', '550e8400-e29b-41d4-a716-446655440005', '2025-03-01 17:00:00', 50, 'published'),
('Research Paper Abstract', 'Write a 300-word abstract for a research paper in your field of interest. Follow academic writing guidelines.', 'achievers', '550e8400-e29b-41d4-a716-446655440009', '2025-02-28 23:59:00', 75, 'published'),
('Personal Development Plan', 'Create a comprehensive personal development plan outlining your goals and strategies for growth over the next year.', 'altogether', '550e8400-e29b-41d4-a716-446655440013', '2025-03-10 23:59:00', 60, 'published');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, related_type) VALUES
('550e8400-e29b-41d4-a716-446655440017', 'New Assignment Posted', 'A new assignment has been posted in Ascend club', 'assignment', 'assignment'),
('550e8400-e29b-41d4-a716-446655440017', 'Event Reminder', 'Advanced React Workshop is tomorrow at 2:00 PM', 'event', 'event'),
('550e8400-e29b-41d4-a716-446655440018', 'New Announcement', 'Mental Health Awareness Week activities are now available', 'announcement', 'announcement'),
('550e8400-e29b-41d4-a716-446655440018', 'Comment on Your Post', 'Someone commented on your discussion post', 'comment', 'comment');
