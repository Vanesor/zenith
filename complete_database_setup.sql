-- =============================================================================
-- ZENITH FORUM - COMPLETE DATABASE SETUP WITH ALL FEATURES
-- =============================================================================
-- This script creates the entire database with all tables including assignments,
-- notifications, enhanced chat features, and fixes all API compatibility issues
-- Run this script on Supabase to set up everything properly
-- =============================================================================

-- Step 1: Enable required extensions and functions
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

-- Step 2: Drop all existing tables in correct order
-- =============================================================================
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;
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

-- Step 3: Create core tables
-- =============================================================================

-- Users table with SINGLE club membership
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    club_id VARCHAR(50), -- SINGLE club reference
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

-- Add foreign key constraint for users.club_id
ALTER TABLE users ADD CONSTRAINT fk_users_club_id FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL;

-- Events table (enhanced)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'workshop', 'social', 'competition', 'presentation')),
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

-- Posts table (enhanced)
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
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table (fixed - no type column)
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    priority VARCHAR(50) DEFAULT 'normal',
    target_audience VARCHAR(50) DEFAULT 'all',
    expires_at TIMESTAMP WITH TIME ZONE,
    attachments TEXT[] DEFAULT '{}',
    pinned BOOLEAN DEFAULT false,
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
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    is_locked BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    likes JSONB DEFAULT '[]',
    attachments TEXT[] DEFAULT '{}',
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
    members UUID[] DEFAULT '{}',
    moderators UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
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
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create assignment-related tables
-- =============================================================================

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    club_id VARCHAR(50) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    instructions TEXT,
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, user_id)
);

-- Step 5: Create notification system
-- =============================================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'event', 'assignment', 'comment', 'like', 'system', 'chat')),
    related_id UUID,
    related_table VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create enhanced event tables
-- =============================================================================

-- Event attendees table
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    attendance_marked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Event registrations (for compatibility)
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
    badge_type VARCHAR(50) DEFAULT 'achievement',
    icon VARCHAR(255),
    color VARCHAR(50),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Insert clubs data
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

-- Step 8: Insert users with correct password hash
-- =============================================================================
-- Note: All passwords are "password123"
INSERT INTO users (id, email, password_hash, name, role, club_id, bio, avatar) VALUES
-- Management Users
('550e8400-e29b-41d4-a716-446655440001', 'president@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Arjun Patel', 'president', NULL, 'President of Zenith Forum, Computer Science student passionate about technology and leadership.', 'https://i.pravatar.cc/150?img=1'),
('550e8400-e29b-41d4-a716-446655440002', 'vicepresident@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Priya Sharma', 'vice_president', NULL, 'Vice President of Zenith, Information Technology student with focus on innovation.', 'https://i.pravatar.cc/150?img=2'),
('550e8400-e29b-41d4-a716-446655440003', 'innovation@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Rahul Kumar', 'innovation_head', 'ascend', 'Innovation Head and Ascend member, passionate about cutting-edge technology and startups.', 'https://i.pravatar.cc/150?img=3'),
('550e8400-e29b-41d4-a716-446655440004', 'treasurer@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Anjali Singh', 'treasurer', 'aster', 'Treasurer of Zenith and Aster member, Commerce student with strong financial acumen.', 'https://i.pravatar.cc/150?img=4'),
('550e8400-e29b-41d4-a716-446655440005', 'outreach@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Vikram Reddy', 'outreach', 'achievers', 'Outreach Head and Achievers member, MBA student focused on building external partnerships.', 'https://i.pravatar.cc/150?img=5'),

-- Club Coordinators
('550e8400-e29b-41d4-a716-446655440006', 'ascend.coordinator@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Dev Patel', 'coordinator', 'ascend', 'Ascend Club Coordinator, Computer Science final year, full-stack developer and competitive programmer.', 'https://i.pravatar.cc/150?img=6'),
('550e8400-e29b-41d4-a716-446655440007', 'aster.coordinator@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Sneha Gupta', 'coordinator', 'aster', 'Aster Club Coordinator, MBA student specializing in organizational behavior and communication.', 'https://i.pravatar.cc/150?img=7'),
('550e8400-e29b-41d4-a716-446655440008', 'achievers.coordinator@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Ravi Mehta', 'coordinator', 'achievers', 'Achievers Club Coordinator, preparing for civil services and guiding students in higher studies.', 'https://i.pravatar.cc/150?img=8'),
('550e8400-e29b-41d4-a716-446655440009', 'altogether.coordinator@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Kavya Nair', 'coordinator', 'altogether', 'Altogether Club Coordinator, Psychology student focused on holistic personality development.', 'https://i.pravatar.cc/150?img=9'),

-- Regular Students
('550e8400-e29b-41d4-a716-446655440010', 'student1@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Amit Joshi', 'student', 'ascend', 'Computer Science student passionate about web development and machine learning.', 'https://i.pravatar.cc/150?img=10'),
('550e8400-e29b-41d4-a716-446655440011', 'student2@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Meera Shah', 'student', 'aster', 'Commerce student interested in public speaking and leadership development.', 'https://i.pravatar.cc/150?img=11'),
('550e8400-e29b-41d4-a716-446655440012', 'student3@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Kiran Desai', 'student', 'achievers', 'Arts student preparing for competitive exams and higher studies abroad.', 'https://i.pravatar.cc/150?img=12'),
('550e8400-e29b-41d4-a716-446655440013', 'student4@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Pooja Rao', 'student', 'altogether', 'Psychology student interested in mindfulness and personal growth techniques.', 'https://i.pravatar.cc/150?img=13'),

-- Demo Account
('550e8400-e29b-41d4-a716-446655440000', 'demo@stvincentngp.edu.in', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Demo User', 'student', 'ascend', 'Demo account for testing purposes - Computer Science student.', 'https://i.pravatar.cc/150?img=20');

-- Update club coordinators
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440006' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440007' WHERE id = 'aster';  
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440008' WHERE id = 'achievers';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440009' WHERE id = 'altogether';

-- Step 9: Insert sample data
-- =============================================================================

-- Sample events
INSERT INTO events (id, title, description, date, time, location, club_id, created_by, max_attendees, status) VALUES
('450e8400-e29b-41d4-a716-446655440001', 'Web Development Workshop', 'Learn React.js and Next.js fundamentals with hands-on projects', '2025-08-15', '14:00:00', 'Computer Lab A', 'ascend', '550e8400-e29b-41d4-a716-446655440006', 30, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440002', 'Public Speaking Masterclass', 'Overcome stage fear and master the art of public speaking', '2025-08-10', '10:00:00', 'Auditorium B', 'aster', '550e8400-e29b-41d4-a716-446655440007', 50, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440003', 'GRE Preparation Session', 'Complete guide to GRE exam with practice tests and strategies', '2025-08-12', '16:00:00', 'Study Hall 1', 'achievers', '550e8400-e29b-41d4-a716-446655440008', 25, 'upcoming'),
('450e8400-e29b-41d4-a716-446655440004', 'Mindfulness Meditation', 'Learn meditation techniques for stress management and focus', '2025-08-08', '18:00:00', 'Wellness Center', 'altogether', '550e8400-e29b-41d4-a716-446655440009', 20, 'upcoming');

-- Sample assignments
INSERT INTO assignments (id, title, description, club_id, created_by, due_date, max_points, instructions) VALUES
('350e8400-e29b-41d4-a716-446655440001', 'React Component Challenge', 'Create a reusable React component library with comprehensive documentation.', 'ascend', '550e8400-e29b-41d4-a716-446655440006', NOW() + INTERVAL '7 days', 100, 'Build a component library with at least 5 reusable components including proper TypeScript definitions and Storybook documentation.'),
('350e8400-e29b-41d4-a716-446655440002', 'Presentation Skills Assessment', 'Prepare and deliver a 10-minute presentation on a topic of your choice.', 'aster', '550e8400-e29b-41d4-a716-446655440007', NOW() + INTERVAL '10 days', 100, 'Focus on clear communication, body language, and audience engagement. Submit your presentation slides along with a self-reflection essay.'),
('350e8400-e29b-41d4-a716-446655440003', 'Mock Test Analysis', 'Complete a full-length GRE mock test and analyze your performance.', 'achievers', '550e8400-e29b-41d4-a716-446655440008', NOW() + INTERVAL '5 days', 50, 'Take the mock test under timed conditions and provide a detailed analysis of your strengths and areas for improvement.');

-- Sample posts
INSERT INTO posts (id, title, content, author_id, club_id, tags, views) VALUES
('250e8400-e29b-41d4-a716-446655440001', 'Getting Started with React Hooks', 'A comprehensive guide to understanding and using React Hooks effectively in your projects. This post covers useState, useEffect, and custom hooks with practical examples.', '550e8400-e29b-41d4-a716-446655440006', 'ascend', ARRAY['react', 'javascript', 'hooks', 'frontend'], 156),
('250e8400-e29b-41d4-a716-446655440002', 'Effective Communication in Teams', 'Tips and techniques for improving communication within development teams and across departments.', '550e8400-e29b-41d4-a716-446655440007', 'aster', ARRAY['communication', 'teamwork', 'soft-skills'], 203);

-- Sample announcements
INSERT INTO announcements (id, title, content, author_id, club_id, priority) VALUES
('150e8400-e29b-41d4-a716-446655440001', 'Hackathon Registration Now Open!', 'Registration for our annual hackathon is now open. Limited seats available. Register by August 31st to secure your spot!', '550e8400-e29b-41d4-a716-446655440006', 'ascend', 'high'),
('150e8400-e29b-41d4-a716-446655440002', 'Public Speaking Contest', 'Aster club is organizing a public speaking contest. Winners get certificates and cash prizes. Registration deadline: August 20th.', '550e8400-e29b-41d4-a716-446655440007', 'aster', 'normal');

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type, related_id) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Welcome to Zenith!', 'Welcome to the Zenith College Forum. Explore clubs and connect with your peers.', 'system', NULL),
('550e8400-e29b-41d4-a716-446655440010', 'New Assignment Posted', 'A new assignment "React Component Challenge" has been posted in Ascend club.', 'assignment', '350e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440011', 'Event Reminder', 'Public Speaking Masterclass is scheduled for tomorrow at 10:00 AM.', 'event', '450e8400-e29b-41d4-a716-446655440002');

-- Sample chat rooms
INSERT INTO chat_rooms (id, name, description, club_id, created_by) VALUES
('050e8400-e29b-41d4-a716-446655440001', 'Ascend General', 'General discussion for Ascend club members', 'ascend', '550e8400-e29b-41d4-a716-446655440006'),
('050e8400-e29b-41d4-a716-446655440002', 'Aster General', 'General discussion for Aster club members', 'aster', '550e8400-e29b-41d4-a716-446655440007'),
('050e8400-e29b-41d4-a716-446655440003', 'Achievers General', 'General discussion for Achievers club members', 'achievers', '550e8400-e29b-41d4-a716-446655440008'),
('050e8400-e29b-41d4-a716-446655440004', 'Altogether General', 'General discussion for Altogether club members', 'altogether', '550e8400-e29b-41d4-a716-446655440009');

-- Step 10: Create indexes for performance
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
CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_assignments_club_id ON assignments(club_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Step 11: Create triggers for automatic timestamp updates
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
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Create statistics view
-- =============================================================================
CREATE OR REPLACE VIEW club_stats AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.description,
    c.color,
    c.icon,
    COUNT(u.id) as member_count,
    COUNT(CASE WHEN u.email LIKE '%@stvincentngp.edu.in' THEN 1 END) as college_members,
    COUNT(CASE WHEN u.email NOT LIKE '%@stvincentngp.edu.in' THEN 1 END) as external_members,
    COUNT(e.id) as event_count,
    COUNT(p.id) as post_count,
    COUNT(a.id) as announcement_count,
    COUNT(ass.id) as assignment_count
FROM clubs c
LEFT JOIN users u ON c.id = u.club_id
LEFT JOIN events e ON c.id = e.club_id
LEFT JOIN posts p ON c.id = p.club_id  
LEFT JOIN announcements a ON c.id = a.club_id
LEFT JOIN assignments ass ON c.id = ass.club_id
GROUP BY c.id, c.name, c.type, c.description, c.color, c.icon
ORDER BY member_count DESC;

-- Step 13: Success message and verification
-- =============================================================================
SELECT 'Database setup completed successfully!' as status;
SELECT 'All tables created: users, clubs, events, posts, comments, announcements, discussions, chat_rooms, assignments, notifications, and more!' as tables_status;
SELECT 'Login credentials: All users can login with password "password123"' as login_info;

-- Display statistics
SELECT * FROM club_stats;

-- Display test accounts
SELECT 
    'Test Accounts' as category,
    email,
    name,
    role,
    club_id
FROM users 
WHERE email IN (
    'demo@stvincentngp.edu.in',
    'ascend.coordinator@stvincentngp.edu.in',
    'president@stvincentngp.edu.in'
)
ORDER BY role;
