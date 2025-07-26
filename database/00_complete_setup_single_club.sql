-- ==============================================================================
-- ZENITH FORUM - COMPLETE DATABASE SETUP WITH SINGLE CLUB RESTRICTION
-- ==============================================================================
-- This script creates the entire database with the corrected single-club business rule
-- Run this script on a fresh database to set up everything properly
-- ==============================================================================

-- Step 1: Enable UUID extension and create helper functions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Drop all existing tables if they exist
-- =============================================================================
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS event_details CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;

-- Step 3: Create all tables with proper single-club schema
-- =============================================================================

-- Users table with SINGLE club membership
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    club_id VARCHAR(50), -- SINGLE club reference (will be foreign key after clubs table)
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE clubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    co_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    secretary_id UUID REFERENCES users(id) ON DELETE SET NULL,
    media_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guidelines TEXT,
    meeting_schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for users.club_id after clubs table exists
ALTER TABLE users ADD CONSTRAINT fk_users_club_id FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL;

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    max_attendees INTEGER,
    status VARCHAR(50) DEFAULT 'upcoming',
    registration_required BOOLEAN DEFAULT false,
    registration_deadline DATE,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    likes JSONB DEFAULT '[]',
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    likes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    priority VARCHAR(50) DEFAULT 'normal',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussions table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    likes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'general',
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event details table
CREATE TABLE event_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    detail_type VARCHAR(100) NOT NULL,
    detail_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User badges table
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations table
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered',
    registration_data JSONB,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Step 4: Insert clubs data
-- =============================================================================
INSERT INTO clubs (id, name, type, description, long_description, icon, color, guidelines) VALUES
('ascend', 'Ascend', 'Coding Club', 'Programming challenges, hackathons, and tech innovation', 
 'Ascend is the premier coding club of Zenith, focusing on competitive programming, software development, and technology innovation. We organize hackathons, coding competitions, tech talks, and workshops to enhance programming skills and foster innovation among students.',
 'Code', 'from-blue-500 to-indigo-600', 'Follow coding best practices, participate actively in events, help fellow members, and maintain a collaborative learning environment.'),

('aster', 'Aster', 'Soft Skills Club', 'Communication workshops and leadership training',
 'Aster specializes in developing essential soft skills including communication, leadership, public speaking, and interpersonal skills. Through workshops, seminars, and practical exercises, we help students build confidence and professional competencies.',
 'MessageSquare', 'from-green-500 to-emerald-600', 'Practice active listening, respect diverse opinions, participate in discussions, and support peer development through constructive feedback.'),

('achievers', 'Achievers', 'Higher Studies Club', 'Competitive exams and graduate school preparation',
 'Achievers is dedicated to guiding students toward higher education and competitive examinations. We provide resources, mentorship, and preparation strategies for various entrance exams, graduate programs, and career advancement opportunities.',
 'GraduationCap', 'from-purple-500 to-violet-600', 'Maintain academic excellence, share knowledge and resources, participate in study groups, and support fellow aspirants in their academic journey.'),

('altogether', 'Altogether', 'Holistic Growth', 'Overall personality development and wellness',
 'Altogether focuses on holistic personality development, combining mental wellness, life skills, mindfulness, and personal growth. We organize wellness workshops, personality development sessions, and activities that promote overall well-being.',
 'Heart', 'from-pink-500 to-rose-500', 'Practice mindfulness, support mental health awareness, participate in wellness activities, and contribute to creating a positive and inclusive environment.');

-- Step 5: Insert dynamic user data with college emails and single club memberships
-- =============================================================================
INSERT INTO users (id, email, password_hash, name, role, club_id, bio, avatar) VALUES
-- Management Users (College Emails)
('550e8400-e29b-41d4-a716-446655440001', 'president@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Arjun Patel', 'president', NULL, 'President of Zenith Forum, Computer Science student passionate about technology and leadership.', 'https://i.pravatar.cc/150?img=1'),

('550e8400-e29b-41d4-a716-446655440002', 'vicepresident@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Priya Sharma', 'vice_president', NULL, 'Vice President of Zenith, Information Technology student with focus on innovation.', 'https://i.pravatar.cc/150?img=2'),

('550e8400-e29b-41d4-a716-446655440003', 'innovation@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Rahul Kumar', 'innovation_head', 'ascend', 'Innovation Head and Ascend member, passionate about cutting-edge technology and startups.', 'https://i.pravatar.cc/150?img=3'),

('550e8400-e29b-41d4-a716-446655440004', 'treasurer@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Anjali Singh', 'treasurer', 'aster', 'Treasurer of Zenith and Aster member, Commerce student with strong financial acumen.', 'https://i.pravatar.cc/150?img=4'),

('550e8400-e29b-41d4-a716-446655440005', 'outreach@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Vikram Reddy', 'outreach', 'achievers', 'Outreach Head and Achievers member, MBA student focused on building external partnerships.', 'https://i.pravatar.cc/150?img=5'),

-- Club Coordinators (College Emails)
('550e8400-e29b-41d4-a716-446655440006', 'ascend.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Dev Patel', 'coordinator', 'ascend', 'Ascend Club Coordinator, Computer Science final year, full-stack developer and competitive programmer.', 'https://i.pravatar.cc/150?img=6'),

('550e8400-e29b-41d4-a716-446655440007', 'aster.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Sneha Gupta', 'coordinator', 'aster', 'Aster Club Coordinator, MBA student specializing in organizational behavior and communication.', 'https://i.pravatar.cc/150?img=7'),

('550e8400-e29b-41d4-a716-446655440008', 'achievers.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Ravi Mehta', 'coordinator', 'achievers', 'Achievers Club Coordinator, preparing for civil services and guiding students in higher studies.', 'https://i.pravatar.cc/150?img=8'),

('550e8400-e29b-41d4-a716-446655440009', 'altogether.coordinator@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Kavya Nair', 'coordinator', 'altogether', 'Altogether Club Coordinator, Psychology student focused on holistic personality development.', 'https://i.pravatar.cc/150?img=9'),

-- Regular College Students (College Emails)
('550e8400-e29b-41d4-a716-446655440010', 'student1@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Amit Joshi', 'student', 'ascend', 'Computer Science student passionate about web development and machine learning.', 'https://i.pravatar.cc/150?img=10'),

('550e8400-e29b-41d4-a716-446655440011', 'student2@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Meera Shah', 'student', 'aster', 'Commerce student interested in public speaking and leadership development.', 'https://i.pravatar.cc/150?img=11'),

('550e8400-e29b-41d4-a716-446655440012', 'student3@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Kiran Desai', 'student', 'achievers', 'Arts student preparing for competitive exams and higher studies abroad.', 'https://i.pravatar.cc/150?img=12'),

('550e8400-e29b-41d4-a716-446655440013', 'student4@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Pooja Rao', 'student', 'altogether', 'Psychology student interested in mindfulness and personal growth techniques.', 'https://i.pravatar.cc/150?img=13'),

-- External Users (Non-college emails but still limited to one club)
('550e8400-e29b-41d4-a716-446655440014', 'external.user1@gmail.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Alex Johnson', 'student', 'ascend', 'External developer interested in joining coding club activities and workshops.', 'https://i.pravatar.cc/150?img=14'),

('550e8400-e29b-41d4-a716-446655440015', 'external.user2@yahoo.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Sarah Williams', 'student', 'aster', 'Professional looking to improve soft skills and networking abilities.', 'https://i.pravatar.cc/150?img=15'),

-- Demo Account for Testing
('550e8400-e29b-41d4-a716-446655440000', 'demo@stvincentngp.edu.in', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Demo User', 'student', 'ascend', 'Demo account for testing purposes - Computer Science student.', 'https://i.pravatar.cc/150?img=20');

-- Update club coordinators
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440006' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440007' WHERE id = 'aster';  
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440008' WHERE id = 'achievers';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440009' WHERE id = 'altogether';

-- Step 6: Insert dynamic sample events
-- =============================================================================
INSERT INTO events (id, title, description, date, time, location, club_id, created_by, max_attendees, status) VALUES
-- Ascend events
('450e8400-e29b-41d4-a716-446655440001', 'Web Development Workshop', 'Learn React.js and Next.js fundamentals with hands-on projects', '2025-08-15', '14:00:00', 'Computer Lab A', 'ascend', '550e8400-e29b-41d4-a716-446655440006', 30, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440002', 'Hackathon 2025', '48-hour coding marathon with exciting prizes and challenges', '2025-09-20', '09:00:00', 'Innovation Center', 'ascend', '550e8400-e29b-41d4-a716-446655440006', 100, 'upcoming'),

-- Aster events  
('450e8400-e29b-41d4-a716-446655440003', 'Public Speaking Masterclass', 'Overcome stage fear and master the art of public speaking', '2025-08-10', '10:00:00', 'Auditorium B', 'aster', '550e8400-e29b-41d4-a716-446655440007', 50, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440004', 'Leadership Workshop', 'Develop leadership skills through interactive exercises and case studies', '2025-08-25', '15:30:00', 'Conference Hall', 'aster', '550e8400-e29b-41d4-a716-446655440007', 40, 'upcoming'),

-- Achievers events
('450e8400-e29b-41d4-a716-446655440005', 'GRE Preparation Session', 'Complete guide to GRE exam with practice tests and strategies', '2025-08-12', '16:00:00', 'Study Hall 1', 'achievers', '550e8400-e29b-41d4-a716-446655440008', 25, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440006', 'University Application Guide', 'Step-by-step guide to applying for international universities', '2025-09-05', '11:00:00', 'Seminar Room', 'achievers', '550e8400-e29b-41d4-a716-446655440008', 35, 'upcoming'),

-- Altogether events
('450e8400-e29b-41d4-a716-446655440007', 'Mindfulness Meditation', 'Learn meditation techniques for stress management and focus', '2025-08-08', '18:00:00', 'Wellness Center', 'altogether', '550e8400-e29b-41d4-a716-446655440009', 20, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440008', 'Personality Development Workshop', 'Build confidence and enhance your personality for professional success', '2025-08-30', '14:30:00', 'Activity Room', 'altogether', '550e8400-e29b-41d4-a716-446655440009', 30, 'upcoming');

-- Step 7: Insert dynamic posts and discussions
-- =============================================================================
INSERT INTO posts (id, title, content, author_id, club_id, tags, views) VALUES
-- Ascend posts
('350e8400-e29b-41d4-a716-446655440001', 'Getting Started with React Hooks', 'A comprehensive guide to understanding and using React Hooks effectively in your projects. This post covers useState, useEffect, and custom hooks with practical examples.', '550e8400-e29b-41d4-a716-446655440006', 'ascend', ARRAY['react', 'javascript', 'hooks', 'frontend'], 156),
('350e8400-e29b-41d4-a716-446655440002', 'Best Practices for API Design', 'Learn how to design robust and scalable APIs that your team will love to work with. Includes RESTful principles and GraphQL comparisons.', '550e8400-e29b-41d4-a716-446655440010', 'ascend', ARRAY['api', 'backend', 'rest', 'graphql'], 89),

-- Aster posts
('350e8400-e29b-41d4-a716-446655440003', 'Effective Communication in Teams', 'Tips and techniques for improving communication within development teams and across departments.', '550e8400-e29b-41d4-a716-446655440007', 'aster', ARRAY['communication', 'teamwork', 'soft-skills'], 203),
('350e8400-e29b-41d4-a716-446655440004', 'Networking Strategies for Students', 'How to build meaningful professional connections while still in college. Includes LinkedIn tips and networking event strategies.', '550e8400-e29b-41d4-a716-446655440011', 'aster', ARRAY['networking', 'career', 'professional-development'], 134),

-- Achievers posts
('350e8400-e29b-41d4-a716-446655440005', 'GATE Exam Preparation Timeline', 'A detailed 12-month preparation plan for GATE examination with subject-wise breakdown and important topics.', '550e8400-e29b-41d4-a716-446655440008', 'achievers', ARRAY['gate', 'exam-prep', 'engineering'], 278),
('350e8400-e29b-41d4-a716-446655440006', 'Scholarship Opportunities for International Studies', 'Complete list of scholarships available for Indian students pursuing higher education abroad.', '550e8400-e29b-41d4-a716-446655440012', 'achievers', ARRAY['scholarships', 'international', 'higher-studies'], 195),

-- Altogether posts
('350e8400-e29b-41d4-a716-446655440007', 'Building Mental Resilience', 'Practical strategies for developing mental strength and resilience to handle academic and professional challenges.', '550e8400-e29b-41d4-a716-446655440009', 'altogether', ARRAY['mental-health', 'resilience', 'wellness'], 167),
('350e8400-e29b-41d4-a716-446655440008', 'Time Management for Students', 'Effective time management techniques that can help students balance academics, projects, and personal life.', '550e8400-e29b-41d4-a716-446655440013', 'altogether', ARRAY['productivity', 'time-management', 'student-life'], 142);

-- Step 8: Insert announcements
-- =============================================================================
INSERT INTO announcements (id, title, content, author_id, club_id, priority) VALUES
('250e8400-e29b-41d4-a716-446655440001', 'Hackathon Registration Now Open!', 'Registration for our annual hackathon is now open. Limited seats available. Register by August 31st to secure your spot!', '550e8400-e29b-41d4-a716-446655440006', 'ascend', 'high'),
('250e8400-e29b-41d4-a716-446655440002', 'Public Speaking Contest', 'Aster club is organizing a public speaking contest. Winners get certificates and cash prizes. Registration deadline: August 20th.', '550e8400-e29b-41d4-a716-446655440007', 'aster', 'normal'),
('250e8400-e29b-41d4-a716-446655440003', 'Study Group Formation', 'Achievers club is forming study groups for various competitive exams. Join your preferred group by contacting coordinators.', '550e8400-e29b-41d4-a716-446655440008', 'achievers', 'normal'),
('250e8400-e29b-41d4-a716-446655440004', 'Wellness Week Activities', 'Altogether club presents Wellness Week with daily meditation sessions, yoga classes, and wellness workshops.', '550e8400-e29b-41d4-a716-446655440009', 'altogether', 'high');

-- Step 9: Create indexes for better performance
-- =============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_posts_club_id ON posts(club_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_announcements_club_id ON announcements(club_id);
CREATE INDEX idx_discussions_club_id ON discussions(club_id);
CREATE INDEX idx_discussions_author_id ON discussions(author_id);
CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_event_details_event_id ON event_details(event_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);

-- Step 10: Create triggers for automatic timestamp updates
-- =============================================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Add email validation constraint
-- =============================================================================
ALTER TABLE users ADD CONSTRAINT check_college_email 
CHECK (
    email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
);

-- Step 12: Create club management functions
-- =============================================================================
-- Function to join a club (with validation)
CREATE OR REPLACE FUNCTION join_club(user_id UUID, new_club_id VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    current_club VARCHAR(50);
BEGIN
    -- Check if user exists
    SELECT club_id INTO current_club FROM users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if user is already in a club
    IF current_club IS NOT NULL THEN
        RAISE EXCEPTION 'User is already a member of club: %. Leave current club before joining a new one.', current_club;
    END IF;
    
    -- Check if target club exists
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = new_club_id) THEN
        RAISE EXCEPTION 'Club not found: %', new_club_id;
    END IF;
    
    -- Join the club
    UPDATE users SET club_id = new_club_id WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to leave a club
CREATE OR REPLACE FUNCTION leave_club(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Leave the club
    UPDATE users SET club_id = NULL WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to switch clubs (leave current and join new)
CREATE OR REPLACE FUNCTION switch_club(user_id UUID, new_club_id VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if target club exists
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = new_club_id) THEN
        RAISE EXCEPTION 'Club not found: %', new_club_id;
    END IF;
    
    -- Switch to the new club
    UPDATE users SET club_id = new_club_id WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create statistics view
-- =============================================================================
CREATE OR REPLACE VIEW club_stats AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.description,
    COUNT(u.id) as member_count,
    COUNT(CASE WHEN u.email LIKE '%@stvincentngp.edu.in' THEN 1 END) as college_members,
    COUNT(CASE WHEN u.email NOT LIKE '%@stvincentngp.edu.in' THEN 1 END) as external_members,
    COUNT(e.id) as event_count,
    COUNT(p.id) as post_count,
    COUNT(a.id) as announcement_count
FROM clubs c
LEFT JOIN users u ON c.id = u.club_id
LEFT JOIN events e ON c.id = e.club_id
LEFT JOIN posts p ON c.id = p.club_id  
LEFT JOIN announcements a ON c.id = a.club_id
GROUP BY c.id, c.name, c.type, c.description
ORDER BY member_count DESC;

-- Final verification and success message
SELECT 'Database setup completed successfully!' as status;
SELECT 'Single club restriction implemented!' as business_rule;
SELECT 'All data is now dynamic and API-ready!' as data_status;

-- Display club statistics
SELECT * FROM club_stats;

-- Display test credentials
SELECT 
    'Test Credentials' as info,
    'demo@stvincentngp.edu.in / password123' as demo_student,
    'president@stvincentngp.edu.in / password123' as president,
    'ascend.coordinator@stvincentngp.edu.in / password123' as coordinator;
