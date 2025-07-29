-- Sample Data for Zenith Application
-- Run this script in your Supabase SQL editor

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, username, role, club_id, bio) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Admin User', 'admin', 'admin', 'tech-club', 'System Administrator'),
('550e8400-e29b-41d4-a716-446655440002', 'coordinator@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'John Doe', 'johndoe', 'coordinator', 'tech-club', 'Tech Club Coordinator'),
('550e8400-e29b-41d4-a716-446655440003', 'student1@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Alice Smith', 'alice', 'student', 'tech-club', 'Computer Science Student'),
('550e8400-e29b-41d4-a716-446655440004', 'student2@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Bob Johnson', 'bob', 'student', 'tech-club', 'Software Engineering Student'),
('550e8400-e29b-41d4-a716-446655440005', 'president@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Emma Wilson', 'emma', 'president', 'design-club', 'Design Club President'),
('550e8400-e29b-41d4-a716-446655440006', 'student3@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Mike Davis', 'mike', 'student', 'design-club', 'UI/UX Design Student'),
('550e8400-e29b-41d4-a716-446655440007', 'secretary@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Sarah Lee', 'sarah', 'secretary', 'music-club', 'Music Club Secretary'),
('550e8400-e29b-41d4-a716-446655440008', 'student4@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'David Brown', 'david', 'student', 'music-club', 'Music Production Student'),
('550e8400-e29b-41d4-a716-446655440009', 'student5@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Lisa Chen', 'lisa', 'student', 'tech-club', 'Data Science Student'),
('550e8400-e29b-41d4-a716-446655440010', 'student6@zenith.com', '$2b$10$rQZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ8VQ.jFZGZ', 'Tom Anderson', 'tom', 'student', 'design-club', 'Graphic Design Student')
ON CONFLICT (id) DO NOTHING;

-- Insert sample clubs (these might already exist)
INSERT INTO clubs (id, name, type, description, icon, color, coordinator_id) VALUES
('tech-club', 'Technology Club', 'academic', 'Exploring the latest in technology and software development', '💻', '#3B82F6', '550e8400-e29b-41d4-a716-446655440002'),
('design-club', 'Design Club', 'creative', 'Creative design and digital arts community', '🎨', '#EC4899', '550e8400-e29b-41d4-a716-446655440005'),
('music-club', 'Music Club', 'cultural', 'Music appreciation and performance group', '🎵', '#10B981', '550e8400-e29b-41d4-a716-446655440007')
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status) VALUES
('550e8400-3001-41d4-a716-446655440001', 'Web Development Workshop', 'Learn modern web development with React and Next.js', 'tech-club', '550e8400-e29b-41d4-a716-446655440002', '2025-08-15', '14:00', 'Tech Lab Room 101', 30, 'upcoming'),
('550e8400-3002-41d4-a716-446655440002', 'Design Thinking Session', 'Interactive session on design principles and user experience', 'design-club', '550e8400-e29b-41d4-a716-446655440005', '2025-08-20', '16:00', 'Design Studio', 25, 'upcoming'),
('550e8400-3003-41d4-a716-446655440003', 'Music Production Masterclass', 'Learn music production techniques and software', 'music-club', '550e8400-e29b-41d4-a716-446655440007', '2025-08-25', '18:00', 'Music Room 203', 20, 'upcoming'),
('550e8400-3004-41d4-a716-446655440004', 'AI and Machine Learning Talk', 'Introduction to artificial intelligence and its applications', 'tech-club', '550e8400-e29b-41d4-a716-446655440002', '2025-09-01', '15:30', 'Main Auditorium', 100, 'upcoming'),
('550e8400-3005-41d4-a716-446655440005', 'UI/UX Portfolio Review', 'Get feedback on your design portfolio from industry experts', 'design-club', '550e8400-e29b-41d4-a716-446655440005', '2025-09-05', '13:00', 'Design Studio', 15, 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- Insert sample event attendees
INSERT INTO event_attendees (event_id, user_id) VALUES
('550e8400-3001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-3001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-3001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-3002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-3002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-3003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008'),
('550e8400-3004-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-3004-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-3004-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (id, title, content, author_id, club_id, category, likes_count, comments_count, view_count) VALUES
('550e8400-4001-41d4-a716-446655440001', 'Welcome to the Tech Club!', 'Welcome everyone to our technology club! We are excited to have you join us on this journey of learning and innovation. Our club focuses on various aspects of technology including web development, mobile apps, AI, and more. Feel free to introduce yourself in the comments!', '550e8400-e29b-41d4-a716-446655440002', 'tech-club', 'announcement', 5, 3, 25),
('550e8400-4002-41d4-a716-446655440002', 'Looking for Project Partners', 'Hi everyone! I am working on a web application using React and Node.js and I am looking for team members who are interested in collaborating. The project is about creating a task management system for students. If you are interested in full-stack development, please reach out!', '550e8400-e29b-41d4-a716-446655440003', 'tech-club', 'project', 3, 2, 18),
('550e8400-4003-41d4-a716-446655440003', 'Design Resources and Tools', 'I have compiled a list of amazing design resources that every designer should know about. This includes free icon libraries, color palette generators, typography resources, and design inspiration websites. Check out the links in the comments section!', '550e8400-e29b-41d4-a716-446655440005', 'design-club', 'resource', 8, 5, 42),
('550e8400-4004-41d4-a716-446655440004', 'Upcoming Music Events', 'Hey music lovers! We have some exciting events coming up this semester. Our music production workshop is scheduled for next month, and we are also planning a live performance evening where club members can showcase their talents. Stay tuned for more details!', '550e8400-e29b-41d4-a716-446655440007', 'music-club', 'announcement', 6, 4, 31),
('550e8400-4005-41d4-a716-446655440005', 'JavaScript Best Practices', 'As we dive deeper into JavaScript development, I thought it would be helpful to share some best practices that can make our code cleaner and more maintainable. These include proper error handling, async/await patterns, and modern ES6+ features.', '550e8400-e29b-41d4-a716-446655440004', 'tech-club', 'discussion', 4, 6, 29)
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO comments (id, post_id, author_id, content) VALUES
('550e8400-5001-41d4-a716-446655440001', '550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Thank you for the warm welcome! I am Alice and I am really excited to learn web development with everyone here.'),
('550e8400-5002-41d4-a716-446655440002', '550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Hi everyone! I am Bob, a software engineering student. Looking forward to working on some cool projects together!'),
('550e8400-5003-41d4-a716-446655440003', '550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440009', 'Hello! I am Lisa and I specialize in data science. Excited to contribute to the club activities!'),
('550e8400-5004-41d4-a716-446655440004', '550e8400-4002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'This sounds like a great project! I have experience with Node.js and would love to collaborate. Let me know how I can help!'),
('550e8400-5005-41d4-a716-446655440005', '550e8400-4002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', 'I am interested! I have worked with React before and I am looking to gain more experience. Count me in!'),
('550e8400-5006-41d4-a716-446655440006', '550e8400-4003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 'Amazing resources! The icon library you shared is exactly what I needed for my current project. Thank you!'),
('550e8400-5007-41d4-a716-446655440007', '550e8400-4003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'These color palette generators are fantastic! As someone just starting in design, this is incredibly helpful.'),
('550e8400-5008-41d4-a716-446655440008', '550e8400-4004-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'So excited for the music production workshop! I have been wanting to learn more about digital music creation.'),
('550e8400-5009-41d4-a716-446655440009', '550e8400-4005-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Great tips! The async/await patterns you mentioned have really helped me write cleaner asynchronous code.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample likes
INSERT INTO likes (post_id, user_id) VALUES
('550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-4001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-4002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-4002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-4002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-4003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-4003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-4003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'New Comment', 'Alice commented on your post "Welcome to the Tech Club!"', 'comment', false),
('550e8400-e29b-41d4-a716-446655440003', 'Event Reminder', 'Web Development Workshop is starting in 2 days', 'event', false),
('550e8400-e29b-41d4-a716-446655440005', 'New Like', 'Someone liked your post about design resources', 'like', true),
('550e8400-e29b-41d4-a716-446655440004', 'Project Interest', 'Someone is interested in your project collaboration', 'comment', false),
('550e8400-e29b-41d4-a716-446655440007', 'Club Update', 'Music Club meeting scheduled for next week', 'announcement', false)
ON CONFLICT DO NOTHING;

-- Insert sample assignments (if assignment functionality exists)
INSERT INTO assignments (id, title, description, club_id, created_by, due_date, max_points, status) VALUES
('550e8400-6001-41d4-a716-446655440001', 'Build a Personal Portfolio', 'Create a personal portfolio website showcasing your skills and projects. Use HTML, CSS, and JavaScript. The website should be responsive and include at least 3 sections: About, Projects, and Contact.', 'tech-club', '550e8400-e29b-41d4-a716-446655440002', '2025-09-15 23:59:00', 100, 'active'),
('550e8400-6002-41d4-a716-446655440002', 'Design a Mobile App UI', 'Design a complete user interface for a mobile application of your choice. Include wireframes, mockups, and a design system. Present your design process and decisions.', 'design-club', '550e8400-e29b-41d4-a716-446655440005', '2025-09-20 23:59:00', 100, 'active'),
('550e8400-6003-41d4-a716-446655440003', 'Compose an Original Song', 'Create an original composition using digital audio workstation software. The song should be at least 2 minutes long and demonstrate understanding of musical structure and production techniques.', 'music-club', '550e8400-e29b-41d4-a716-446655440007', '2025-09-25 23:59:00', 100, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample chat rooms
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by) VALUES
('550e8400-7001-41d4-a716-446655440001', 'Tech Club General', 'General discussion for Tech Club members', 'tech-club', 'public', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-7002-41d4-a716-446655440002', 'Design Club Creative', 'Share your creative works and get feedback', 'design-club', 'public', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-7003-41d4-a716-446655440003', 'Music Club Jam', 'Discuss music and share your compositions', 'music-club', 'public', '550e8400-e29b-41d4-a716-446655440007')
ON CONFLICT (id) DO NOTHING;

-- Insert sample chat messages
INSERT INTO chat_messages (id, room_id, user_id, message) VALUES
('550e8400-8001-41d4-a716-446655440001', '550e8400-7001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Welcome to the Tech Club chat room everyone!'),
('550e8400-8002-41d4-a716-446655440002', '550e8400-7001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Thank you! Excited to be here and learn from everyone.'),
('550e8400-8003-41d4-a716-446655440003', '550e8400-7001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Looking forward to collaborating on some interesting projects!'),
('550e8400-8004-41d4-a716-446655440004', '550e8400-7002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Hey designers! Feel free to share your latest works here for feedback.'),
('550e8400-8005-41d4-a716-446655440005', '550e8400-7003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'Music lovers unite! Share your favorite tracks and compositions here.')
ON CONFLICT (id) DO NOTHING;

-- Update club member counts and other statistics
UPDATE clubs SET 
  long_description = CASE 
    WHEN id = 'tech-club' THEN 'The Technology Club is a vibrant community of students passionate about software development, artificial intelligence, web technologies, and emerging tech trends. We organize workshops, hackathons, and collaborative projects to help members grow their technical skills.'
    WHEN id = 'design-club' THEN 'The Design Club brings together creative minds interested in visual design, user experience, digital arts, and creative technology. We focus on developing design thinking skills and creating beautiful, functional designs.'
    WHEN id = 'music-club' THEN 'The Music Club is a creative space for music enthusiasts to explore composition, production, performance, and music theory. We welcome all genres and skill levels, from beginners to advanced musicians.'
  END;

-- Add some announcements
INSERT INTO announcements (id, title, content, author_id, club_id, priority) VALUES
('550e8400-9001-41d4-a716-446655440001', 'Semester Welcome Event', 'Join us for our semester welcome event this Friday at 6 PM in the main auditorium. We will have introductions, club overviews, and networking opportunities. Refreshments will be provided!', '550e8400-e29b-41d4-a716-446655440001', NULL, 'high'),
('550e8400-9002-41d4-a716-446655440002', 'Tech Club Hackathon', 'Save the date! Our annual hackathon is scheduled for October 15-16. More details and registration will be available soon. Start thinking about your team and project ideas!', '550e8400-e29b-41d4-a716-446655440002', 'tech-club', 'normal'),
('550e8400-9003-41d4-a716-446655440003', 'Design Workshop Series', 'We are launching a monthly design workshop series covering topics like UI/UX design, typography, color theory, and design systems. First workshop starts next month!', '550e8400-e29b-41d4-a716-446655440005', 'design-club', 'normal')
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Sample data has been successfully inserted into the database!' as message;
