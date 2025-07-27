-- ==============================================================================
-- ZENITH FORUM - COMPLETE DATABASE SETUP WITH ALL REQUIRED TABLES
-- ==============================================================================
-- This script creates the entire database with all required tables for the application
-- Run this script on Supabase to set up everything properly
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

-- Step 2: Drop all existing tables if they exist (be careful in production)
-- =============================================================================
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
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

-- Step 3: Create all tables with proper schema
-- =============================================================================

-- Clubs table
CREATE TABLE clubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    coordinator_id UUID,
    co_coordinator_id UUID,
    secretary_id UUID,
    media_id UUID,
    guidelines TEXT,
    meeting_schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table with SINGLE club membership
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE SET NULL,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints for club coordinators
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_coordinator_id FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_co_coordinator_id FOREIGN KEY (co_coordinator_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_secretary_id FOREIGN KEY (secretary_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_media_id FOREIGN KEY (media_id) REFERENCES users(id) ON DELETE SET NULL;

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

-- Event attendees table (many-to-many relationship)
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'registered', -- registered, attended, cancelled
    UNIQUE(event_id, user_id)
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
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

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    submission_type VARCHAR(50) DEFAULT 'text', -- text, file, url
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    grade INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(assignment_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    is_pinned BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'public', -- public, private, club
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
    file_url TEXT,
    reply_to UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User badges table
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(255) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(255),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_name)
);

-- Step 4: Create indexes for better performance
-- =============================================================================
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_posts_club_id ON posts(club_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_assignments_club_id ON assignments(club_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_discussions_club_id ON discussions(club_id);
CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);

-- Step 5: Create triggers for updated_at columns
-- =============================================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Insert sample data
-- =============================================================================

-- Insert sample clubs
INSERT INTO clubs (id, name, type, description, long_description, icon, color) VALUES
('ascend', 'ASCEND', 'technical', 'Advanced Software and Computing Enhancement Network', 'A technical club focused on software development, programming competitions, and technology innovation.', 'code', '#3B82F6'),
('genesis', 'GENESIS', 'entrepreneurship', 'Generating Entrepreneurial Networks and Sustainable Innovation Solutions', 'An entrepreneurship club that fosters innovation, startup culture, and business development.', 'rocket', '#10B981'),
('phoenix', 'PHOENIX', 'cultural', 'Promoting Heritage, Organizations, Events, and Networks in eXcellence', 'A cultural club celebrating diversity, organizing cultural events, and promoting artistic expression.', 'fire', '#F59E0B');

-- Insert sample users with correct password hashes
INSERT INTO users (id, email, password_hash, name, role, club_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@zenith.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Admin User', 'admin', 'ascend'),
('550e8400-e29b-41d4-a716-446655440001', 'student@zenith.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Student User', 'student', 'ascend'),
('550e8400-e29b-41d4-a716-446655440002', 'coordinator@zenith.com', '$2b$10$8K1p/nq8H2VgN8ZlXgvB3e7BVKJYk6XvRTgPd4wGhA5oEjCqF7YWa', 'Coordinator User', 'coordinator', 'genesis');

-- Insert sample events
INSERT INTO events (id, title, description, date, time, location, club_id, created_by, max_attendees) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Tech Talk: AI in Modern Development', 'Join us for an insightful discussion about AI tools in software development', '2025-08-15', '14:00:00', 'Auditorium A', 'ascend', '550e8400-e29b-41d4-a716-446655440000', 100),
('660e8400-e29b-41d4-a716-446655440001', 'Startup Pitch Competition', 'Present your innovative startup ideas to industry experts', '2025-08-20', '10:00:00', 'Conference Hall', 'genesis', '550e8400-e29b-41d4-a716-446655440002', 50);

-- Insert sample posts
INSERT INTO posts (id, title, content, author_id, club_id) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'Welcome to ASCEND!', 'Welcome to our technical club. We are excited to have you join us on this journey of learning and innovation.', '550e8400-e29b-41d4-a716-446655440000', 'ascend'),
('770e8400-e29b-41d4-a716-446655440001', 'Upcoming Workshop Series', 'We are organizing a series of workshops on various technical topics. Stay tuned for more details!', '550e8400-e29b-41d4-a716-446655440001', 'ascend');

-- Insert sample announcements
INSERT INTO announcements (id, title, content, author_id, club_id, priority) VALUES
('880e8400-e29b-41d4-a716-446655440000', 'Club Meeting Tomorrow', 'Please attend the club meeting tomorrow at 3 PM in Room 101.', '550e8400-e29b-41d4-a716-446655440000', 'ascend', 'high'),
('880e8400-e29b-41d4-a716-446655440001', 'New Project Guidelines', 'New guidelines for project submissions have been updated. Please check the resources section.', '550e8400-e29b-41d4-a716-446655440000', 'ascend', 'normal');

-- Insert sample assignments
INSERT INTO assignments (id, title, description, instructions, club_id, created_by, due_date, max_points) VALUES
('990e8400-e29b-41d4-a716-446655440000', 'Web Development Project', 'Create a responsive web application using modern frameworks', 'Build a full-stack web application with user authentication and database integration. Submit the GitHub repository link.', 'ascend', '550e8400-e29b-41d4-a716-446655440000', '2025-09-01 23:59:59', 100),
('990e8400-e29b-41d4-a716-446655440001', 'Business Plan Presentation', 'Develop a comprehensive business plan for your startup idea', 'Create a 10-slide presentation covering market analysis, business model, and financial projections.', 'genesis', '550e8400-e29b-41d4-a716-446655440002', '2025-08-25 23:59:59', 100);

-- Insert sample notifications
INSERT INTO notifications (id, user_id, title, message, type) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Welcome to Zenith!', 'Welcome to the Zenith forum. Explore your club activities and connect with fellow members.', 'system'),
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'New Assignment Posted', 'A new assignment "Web Development Project" has been posted in ASCEND.', 'assignment');

-- Insert sample discussions
INSERT INTO discussions (id, title, description, author_id, club_id, is_pinned) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', 'Best Programming Languages in 2025', 'What are your thoughts on the most relevant programming languages for this year?', '550e8400-e29b-41d4-a716-446655440001', 'ascend', true),
('bb0e8400-e29b-41d4-a716-446655440001', 'Startup Funding Strategies', 'Discussion about different funding options for early-stage startups', '550e8400-e29b-41d4-a716-446655440002', 'genesis', false);

-- Insert sample chat rooms
INSERT INTO chat_rooms (id, name, description, type, club_id, created_by) VALUES
('cc0e8400-e29b-41d4-a716-446655440000', 'ASCEND General', 'General discussion for ASCEND members', 'public', 'ascend', '550e8400-e29b-41d4-a716-446655440000'),
('cc0e8400-e29b-41d4-a716-446655440001', 'GENESIS Brainstorm', 'Brainstorming space for GENESIS members', 'public', 'genesis', '550e8400-e29b-41d4-a716-446655440002');

-- Step 7: Update club coordinators
-- =============================================================================
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440000' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id = 'genesis';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440002' WHERE id = 'phoenix';

-- ==============================================================================
-- SETUP COMPLETE
-- ==============================================================================
-- All tables created successfully with sample data
-- Default password for all sample users: "password123"
-- You can now use the application with the sample data
-- ==============================================================================
