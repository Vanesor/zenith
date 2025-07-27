-- ==============================================================================
-- ZENITH FORUM - COMPLETE SUPABASE SETUP SCRIPT
-- ==============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- This will create all tables and populate them with sample data
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CREATE ALL TABLES
-- ==============================================================================

-- Users table (modified for single club membership)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    club_id VARCHAR(50), -- Single club membership
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
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

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    club_id VARCHAR(50) REFERENCES clubs(id),
    created_by UUID REFERENCES users(id),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_attendees INTEGER,
    status VARCHAR(50) DEFAULT 'upcoming',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'registered',
    UNIQUE(event_id, user_id)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id),
    category VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    club_id VARCHAR(50) REFERENCES clubs(id),
    assigned_by UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    instructions TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    grade INTEGER,
    feedback TEXT,
    UNIQUE(assignment_id, user_id)
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    club_id VARCHAR(50) REFERENCES clubs(id),
    type VARCHAR(50) DEFAULT 'public',
    created_by UUID REFERENCES users(id),
    members UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================================================

-- Add foreign key constraints to clubs table (deferred to avoid circular references)
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id);
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_co_coordinator FOREIGN KEY (co_coordinator_id) REFERENCES users(id);
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_secretary FOREIGN KEY (secretary_id) REFERENCES users(id);
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_media FOREIGN KEY (media_id) REFERENCES users(id);

-- Add foreign key constraint to users table
ALTER TABLE users ADD CONSTRAINT fk_users_club FOREIGN KEY (club_id) REFERENCES clubs(id);

-- ==============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_assignments_club_id ON assignments(club_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ==============================================================================
-- 4. INSERT SAMPLE DATA
-- ==============================================================================

-- Insert clubs first
INSERT INTO clubs (id, name, type, description, long_description, icon, color, guidelines) VALUES
('ascend', 'ASCEND', 'Technical', 'A technical club focused on innovation and technology', 'ASCEND is the premier technical club fostering innovation, programming skills, and technological advancement. We organize hackathons, workshops, and technical seminars to help students stay at the forefront of technology.', 'Rocket', 'blue', 'Focus on technical excellence and innovation'),
('genesis', 'GENESIS', 'Entrepreneurship', 'An entrepreneurship club for business-minded students', 'GENESIS nurtures entrepreneurial spirit and business acumen. We provide mentorship, organize pitch competitions, and connect students with industry leaders to transform ideas into successful ventures.', 'Lightbulb', 'green', 'Foster entrepreneurship and business innovation'),
('phoenix', 'PHOENIX', 'Cultural', 'A cultural club celebrating arts and creativity', 'PHOENIX is dedicated to promoting cultural diversity and artistic expression. We organize cultural events, art exhibitions, music concerts, and creative workshops to celebrate the rich tapestry of human creativity.', 'Palette', 'purple', 'Celebrate culture and creative expression');

-- Insert users with verified password hashes (password: "password123")
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
-- Admin users
('550e8400-e29b-41d4-a716-446655440000', 'admin@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Admin User', 'admin', 'ascend', 'System administrator with full access'),
('550e8400-e29b-41d4-a716-446655440001', 'superadmin@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Super Admin', 'admin', NULL, 'Super administrator overseeing all clubs'),

-- ASCEND Coordinators
('550e8400-e29b-41d4-a716-446655440010', 'ascend.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Coordinator', 'coordinator', 'ascend', 'Lead coordinator for ASCEND technical club'),
('550e8400-e29b-41d4-a716-446655440011', 'ascend.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Co-Coordinator', 'coordinator', 'ascend', 'Co-coordinator supporting ASCEND activities'),
('550e8400-e29b-41d4-a716-446655440012', 'ascend.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Secretary', 'coordinator', 'ascend', 'Secretary managing ASCEND documentation'),
('550e8400-e29b-41d4-a716-446655440013', 'ascend.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'ASCEND Media Head', 'coordinator', 'ascend', 'Media coordinator for ASCEND club'),

-- GENESIS Coordinators
('550e8400-e29b-41d4-a716-446655440020', 'genesis.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Coordinator', 'coordinator', 'genesis', 'Lead coordinator for GENESIS entrepreneurship club'),
('550e8400-e29b-41d4-a716-446655440021', 'genesis.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Co-Coordinator', 'coordinator', 'genesis', 'Co-coordinator supporting GENESIS activities'),
('550e8400-e29b-41d4-a716-446655440022', 'genesis.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Secretary', 'coordinator', 'genesis', 'Secretary managing GENESIS documentation'),
('550e8400-e29b-41d4-a716-446655440023', 'genesis.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'GENESIS Media Head', 'coordinator', 'genesis', 'Media coordinator for GENESIS club'),

-- PHOENIX Coordinators
('550e8400-e29b-41d4-a716-446655440030', 'phoenix.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Coordinator', 'coordinator', 'phoenix', 'Lead coordinator for PHOENIX cultural club'),
('550e8400-e29b-41d4-a716-446655440031', 'phoenix.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Co-Coordinator', 'coordinator', 'phoenix', 'Co-coordinator supporting PHOENIX activities'),
('550e8400-e29b-41d4-a716-446655440032', 'phoenix.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Secretary', 'coordinator', 'phoenix', 'Secretary managing PHOENIX documentation'),
('550e8400-e29b-41d4-a716-446655440033', 'phoenix.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'PHOENIX Media Head', 'coordinator', 'phoenix', 'Media coordinator for PHOENIX club'),

-- Faculty members
('550e8400-e29b-41d4-a716-446655440040', 'faculty.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. ASCEND Advisor', 'faculty', 'ascend', 'Faculty advisor for ASCEND technical club'),
('550e8400-e29b-41d4-a716-446655440041', 'faculty.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. GENESIS Advisor', 'faculty', 'genesis', 'Faculty advisor for GENESIS entrepreneurship club'),
('550e8400-e29b-41d4-a716-446655440042', 'faculty.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Prof. PHOENIX Advisor', 'faculty', 'phoenix', 'Faculty advisor for PHOENIX cultural club'),

-- ASCEND Students
('550e8400-e29b-41d4-a716-446655440100', 'student1.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Alice Johnson', 'student', 'ascend', 'Computer Science student passionate about AI'),
('550e8400-e29b-41d4-a716-446655440101', 'student2.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Bob Smith', 'student', 'ascend', 'Software Engineering student interested in web development'),
('550e8400-e29b-41d4-a716-446655440102', 'student3.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Charlie Brown', 'student', 'ascend', 'Data Science student exploring machine learning'),

-- GENESIS Students
('550e8400-e29b-41d4-a716-446655440200', 'student1.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Frank Miller', 'student', 'genesis', 'Business student with startup experience'),
('550e8400-e29b-41d4-a716-446655440201', 'student2.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Grace Lee', 'student', 'genesis', 'Marketing enthusiast and social media strategist'),
('550e8400-e29b-41d4-a716-446655440202', 'student3.genesis@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Henry Wilson', 'student', 'genesis', 'Finance student interested in fintech'),

-- PHOENIX Students
('550e8400-e29b-41d4-a716-446655440300', 'student1.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Karen White', 'student', 'phoenix', 'Fine Arts student specializing in digital art'),
('550e8400-e29b-41d4-a716-446655440301', 'student2.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Liam Garcia', 'student', 'phoenix', 'Music composition and sound engineering'),
('550e8400-e29b-41d4-a716-446655440302', 'student3.phoenix@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Maya Patel', 'student', 'phoenix', 'Cultural studies and event management');

-- Update club coordinators
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440010', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440011', secretary_id = '550e8400-e29b-41d4-a716-446655440012', media_id = '550e8400-e29b-41d4-a716-446655440013' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440020', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440021', secretary_id = '550e8400-e29b-41d4-a716-446655440022', media_id = '550e8400-e29b-41d4-a716-446655440023' WHERE id = 'genesis';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440030', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440031', secretary_id = '550e8400-e29b-41d4-a716-446655440032', media_id = '550e8400-e29b-41d4-a716-446655440033' WHERE id = 'phoenix';

-- Insert chat rooms
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by) VALUES
-- Public rooms
('550e8400-c000-41d4-a716-446655440001', 'General Discussion', 'Open discussion for all members across clubs', NULL, 'public', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-c000-41d4-a716-446655440002', 'Announcements', 'Official announcements from administration', NULL, 'public', '550e8400-e29b-41d4-a716-446655440001'),

-- ASCEND club rooms
('550e8400-c001-41d4-a716-446655440001', 'ASCEND General', 'Main discussion room for ASCEND technical club', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-c001-41d4-a716-446655440002', 'ASCEND Projects', 'Discussion about ongoing technical projects', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010'),

-- GENESIS club rooms
('550e8400-c002-41d4-a716-446655440001', 'GENESIS General', 'Main discussion room for GENESIS entrepreneurship club', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440020'),
('550e8400-c002-41d4-a716-446655440002', 'GENESIS Startups', 'Discussion about startup ideas and business ventures', 'genesis', 'club', '550e8400-e29b-41d4-a716-446655440020'),

-- PHOENIX club rooms
('550e8400-c003-41d4-a716-446655440001', 'PHOENIX General', 'Main discussion room for PHOENIX cultural club', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440030'),
('550e8400-c003-41d4-a716-446655440002', 'PHOENIX Arts', 'Share and discuss artistic creations and ideas', 'phoenix', 'club', '550e8400-e29b-41d4-a716-446655440030');

-- Insert sample chat messages
INSERT INTO chat_messages (room_id, user_id, message) VALUES
('550e8400-c000-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Welcome to the Zenith Forum! 🎉'),
('550e8400-c001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'Welcome to ASCEND! Let''s build amazing tech projects together.'),
('550e8400-c002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 'GENESIS is where entrepreneurial dreams come to life!'),
('550e8400-c003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'PHOENIX - where creativity meets culture! 🎨');

-- Insert assignments
INSERT INTO assignments (id, title, description, club_id, assigned_by, due_date, max_points, instructions, status) VALUES
-- ASCEND assignments
('550e8400-a001-41d4-a716-446655440001', 'Web Development Project', 'Create a responsive website using React and Node.js', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 100, 'Build a full-stack web application with user authentication, responsive design, and database integration.', 'active'),
('550e8400-a001-41d4-a716-446655440002', 'Machine Learning Model', 'Develop a predictive model using Python', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 120, 'Create a machine learning model to solve a real-world problem using scikit-learn or TensorFlow.', 'active'),

-- GENESIS assignments
('550e8400-a002-41d4-a716-446655440001', 'Business Plan Development', 'Create a comprehensive business plan for a startup idea', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Develop a detailed business plan including market analysis, financial projections, and marketing strategy.', 'active'),
('550e8400-a002-41d4-a716-446655440002', 'Market Research Project', 'Conduct market research for a product/service', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 90, 'Perform comprehensive market research including competitor analysis and target audience identification.', 'active'),

-- PHOENIX assignments
('550e8400-a003-41d4-a716-446655440001', 'Digital Art Portfolio', 'Create a diverse digital art portfolio', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '4 weeks', 120, 'Develop a comprehensive digital art portfolio showcasing various techniques and styles.', 'active'),
('550e8400-a003-41d4-a716-446655440002', 'Music Composition Project', 'Compose and produce an original music piece', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Create an original musical composition using digital audio workstation software.', 'active');

-- Insert events
INSERT INTO events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status) VALUES
-- ASCEND events
('550e8400-e001-41d4-a716-446655440001', 'Tech Innovation Summit 2025', 'Annual technology summit featuring industry leaders', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '15 days', '09:00:00', 'Main Auditorium', 200, 'upcoming'),
('550e8400-e001-41d4-a716-446655440002', 'Hackathon Weekend', '48-hour coding marathon to build innovative solutions', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '22 days', '18:00:00', 'Computer Lab Block A', 50, 'upcoming'),

-- GENESIS events
('550e8400-e002-41d4-a716-446655440001', 'Startup Pitch Competition', 'Compete with your startup ideas and win funding', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '18 days', '10:00:00', 'Business Center', 100, 'upcoming'),
('550e8400-e002-41d4-a716-446655440002', 'Entrepreneur Meet & Greet', 'Network with successful entrepreneurs and mentors', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '12 days', '17:00:00', 'Conference Room B', 60, 'upcoming'),

-- PHOENIX events
('550e8400-e003-41d4-a716-446655440001', 'Cultural Arts Festival', 'Showcase of diverse cultural performances', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '20 days', '16:00:00', 'Open Amphitheater', 300, 'upcoming'),
('550e8400-e003-41d4-a716-446655440002', 'Photography Exhibition Opening', 'Opening night for student photography exhibition', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '10 days', '19:00:00', 'Art Gallery', 120, 'upcoming');

-- Insert sample posts
INSERT INTO posts (id, title, content, author_id, club_id, category) VALUES
('550e8400-p001-41d4-a716-446655440001', 'Getting Started with React Hooks', 'React Hooks have revolutionized how we write React components. Here are some best practices...', '550e8400-e29b-41d4-a716-446655440100', 'ascend', 'tutorial'),
('550e8400-p002-41d4-a716-446655440001', 'Startup Funding Landscape 2025', 'The startup funding landscape has evolved significantly. Here''s what you need to know...', '550e8400-e29b-41d4-a716-446655440200', 'genesis', 'discussion'),
('550e8400-p003-41d4-a716-446655440001', 'Photography Tips for Beginners', 'Starting your photography journey? Here are essential tips...', '550e8400-e29b-41d4-a716-446655440300', 'phoenix', 'tutorial');

-- Insert notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'Welcome to Zenith Forum!', 'Welcome to the platform! Explore clubs, assignments, and connect with fellow students.', 'system'),
('550e8400-e29b-41d4-a716-446655440200', 'Welcome to Zenith Forum!', 'Welcome to the platform! Explore clubs, assignments, and connect with fellow students.', 'system'),
('550e8400-e29b-41d4-a716-446655440300', 'Welcome to Zenith Forum!', 'Welcome to the platform! Explore clubs, assignments, and connect with fellow students.', 'system');

-- ==============================================================================
-- SETUP COMPLETE!
-- ==============================================================================
-- The database is now ready with:
-- ✅ All required tables created
-- ✅ Sample users with verified passwords (password: "password123")
-- ✅ 3 clubs with coordinators assigned
-- ✅ Chat rooms and messages
-- ✅ Assignments for each club
-- ✅ Upcoming events
-- ✅ Discussion posts
-- ✅ Notifications
-- ✅ Performance indexes
--
-- TEST ACCOUNTS:
-- Email: admin@zenith.com              | Password: password123 (Admin)
-- Email: ascend.coordinator@zenith.com | Password: password123 (ASCEND Coordinator)
-- Email: student1.ascend@zenith.com    | Password: password123 (ASCEND Student)
-- Email: student1.genesis@zenith.com   | Password: password123 (GENESIS Student)
-- Email: student1.phoenix@zenith.com   | Password: password123 (PHOENIX Student)
-- ==============================================================================
