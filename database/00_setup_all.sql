-- =============================================================================
-- ZENITH FORUM - COMPLETE DATABASE SETUP SCRIPT
-- =============================================================================
-- This script will completely reset and set up the database.
-- WARNING: All existing data in the tables will be deleted!
--
-- Instructions:
-- 1. Connect to your PostgreSQL database (e.g., using `psql -U postgres -d zenith`).
-- 2. Run this single script (e.g., using `\i 'path/to/00_setup_all.sql'`).
-- =============================================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create the function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Drop all existing tables in reverse dependency order to avoid errors
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS event_details CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 4: Create all tables with a consistent and correct schema
-- =============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    clubs TEXT[] DEFAULT '{}',
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

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    likes UUID[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    pinned BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    target_audience VARCHAR(50) DEFAULT 'all',
    priority VARCHAR(50) DEFAULT 'medium',
    expires_at TIMESTAMP WITH TIME ZONE,
    attachments TEXT[] DEFAULT '{}',
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion topics table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    pinned BOOLEAN DEFAULT false,
    locked BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    likes UUID[] DEFAULT '{}',
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
    type VARCHAR(50) DEFAULT 'public',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    members UUID[] DEFAULT '{}',
    moderators UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text',
    attachments TEXT[] DEFAULT '{}',
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event details enhancement table
CREATE TABLE event_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
    guidelines TEXT,
    prerequisites TEXT[],
    resources TEXT[],
    agenda JSONB,
    speakers JSONB,
    sponsors JSONB,
    prizes JSONB,
    faq JSONB,
    contact_info JSONB,
    social_links JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User badges and achievements
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,
    badge_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    color VARCHAR(50),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations tracking
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

-- Step 5: Create all necessary indexes for performance
-- =============================================================================
CREATE INDEX idx_users_email ON users(email);
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

-- Step 6: Create triggers to automatically update the `updated_at` column
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
CREATE TRIGGER update_event_details_updated_at BEFORE UPDATE ON event_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Insert all dummy data
-- =============================================================================

-- Insert clubs first (without leadership)
INSERT INTO clubs (id, name, type, description, long_description, icon, color) VALUES
('ascend', 'Ascend', 'Coding Club', 'Programming challenges and tech innovation', 'Ascend is the premier coding club of Zenith, dedicated to fostering excellence in programming, software development, and technological innovation.', 'Code', 'from-blue-500 to-cyan-500'),
('aster', 'Aster', 'Soft Skills Club', 'Communication and leadership development', 'Aster focuses on developing essential soft skills including communication, leadership, teamwork, and interpersonal abilities.', 'MessageSquare', 'from-green-500 to-emerald-500'),
('achievers', 'Achievers', 'Higher Studies Club', 'Graduate preparation and academic excellence', 'Achievers is dedicated to helping students excel in their academic pursuits and prepare for higher studies.', 'GraduationCap', 'from-purple-500 to-violet-500'),
('altogether', 'Altogether', 'Holistic Growth', 'Wellness and personality development', 'Altogether focuses on holistic personality development, mental wellness, and life skills.', 'Heart', 'from-pink-500 to-rose-500');

-- Insert users (management and students)  
-- Note: All passwords are "password123" - bcrypt hash with salt rounds 12
INSERT INTO users (id, email, password_hash, name, role, clubs, bio, avatar) VALUES
-- Ascend Club Management
('550e8400-e29b-41d4-a716-446655440101', 'alex.chen.coord@zenith.edu', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Alex Chen', 'coordinator', '{"ascend"}', 'Senior Software Engineer and Ascend Coordinator. Passionate about AI and full-stack development.', '/avatars/alex-chen.jpg'),
('550e8400-e29b-41d4-a716-446655440102', 'sarah.johnson.cocoord@zenith.edu', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Sarah Johnson', 'co_coordinator', '{"ascend"}', 'Tech Lead and Co-Coordinator. Specializes in React and Node.js development.', '/avatars/sarah-johnson.jpg'),
('550e8400-e29b-41d4-a716-446655440103', 'mike.davis.sec@zenith.edu', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Mike Davis', 'secretary', '{"ascend"}', 'DevOps Engineer and Secretary. Manages club documentation and logistics.', '/avatars/mike-davis.jpg'),
('550e8400-e29b-41d4-a716-446655440104', 'emily.zhang.media@zenith.edu', '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS', 'Emily Zhang', 'media', '{"ascend"}', 'UI/UX Designer and Media Head. Creates engaging content for social platforms.', '/avatars/emily-zhang.jpg'),
-- Aster Club Management
('550e8400-e29b-41d4-a716-446655440201', 'jessica.liu.coord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Jessica Liu', 'coordinator', '{"aster"}', 'Communication expert and Aster Coordinator. 10+ years in corporate training.', '/avatars/jessica-liu.jpg'),
('550e8400-e29b-41d4-a716-446655440202', 'david.park.cocoord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'David Park', 'co_coordinator', '{"aster"}', 'Leadership coach and Co-Coordinator. Specializes in team building.', '/avatars/david-park.jpg'),
('550e8400-e29b-41d4-a716-446655440203', 'rachel.green.sec@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Rachel Green', 'secretary', '{"aster"}', 'Event coordinator and Secretary. Expert in workshop planning.', '/avatars/rachel-green.jpg'),
('550e8400-e29b-41d4-a716-446655440204', 'tom.wilson.media@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Tom Wilson', 'media', '{"aster"}', 'Content strategist and Media Head. Creates compelling presentations.', '/avatars/tom-wilson.jpg'),
-- Achievers Club Management
('550e8400-e29b-41d4-a716-446655440301', 'priya.sharma.coord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Dr. Priya Sharma', 'coordinator', '{"achievers"}', 'PhD in Computer Science, Academic advisor and Achievers Coordinator.', '/avatars/priya-sharma.jpg'),
('550e8400-e29b-41d4-a716-446655440302', 'kevin.lee.cocoord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Kevin Lee', 'co_coordinator', '{"achievers"}', 'Graduate student mentor and Co-Coordinator. Harvard MBA graduate.', '/avatars/kevin-lee.jpg'),
('550e8400-e29b-41d4-a716-446655440303', 'lisa.wang.sec@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Lisa Wang', 'secretary', '{"achievers"}', 'Research coordinator and Secretary. Manages academic programs.', '/avatars/lisa-wang.jpg'),
('550e8400-e29b-41d4-a716-446655440304', 'jake.thompson.media@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Jake Thompson', 'media', '{"achievers"}', 'Academic content creator and Media Head. PhD candidate.', '/avatars/jake-thompson.jpg'),
-- Altogether Club Management
('550e8400-e29b-41d4-a716-446655440401', 'maya.patel.coord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Maya Patel', 'coordinator', '{"altogether"}', 'Licensed therapist and Altogether Coordinator. Mental health advocate.', '/avatars/maya-patel.jpg'),
('550e8400-e29b-41d4-a716-446655440402', 'chris.martinez.cocoord@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Chris Martinez', 'co_coordinator', '{"altogether"}', 'Wellness coach and Co-Coordinator. Certified mindfulness instructor.', '/avatars/chris-martinez.jpg'),
('550e8400-e29b-41d4-a716-446655440403', 'anna.brown.sec@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Anna Brown', 'secretary', '{"altogether"}', 'Program coordinator and Secretary. Organizes wellness activities.', '/avatars/anna-brown.jpg'),
('550e8400-e29b-41d4-a716-446655440404', 'sam.rodriguez.media@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Sam Rodriguez', 'media', '{"altogether"}', 'Social media manager and Media Head. Creates wellness content.', '/avatars/sam-rodriguez.jpg'),
-- Zenith Committee (Overall leadership)
('550e8400-e29b-41d4-a716-446655440501', 'robert.president@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Robert Johnson', 'president', '{"ascend", "aster", "achievers", "altogether"}', 'Computer Science senior and Zenith Forum President. Student government leader.', '/avatars/robert-johnson.jpg'),
('550e8400-e29b-41d4-a716-446655440502', 'maria.vp@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Maria Garcia', 'vice_president', '{"ascend", "aster", "achievers", "altogether"}', 'Business Administration senior and Vice President. Event management expert.', '/avatars/maria-garcia.jpg'),
('550e8400-e29b-41d4-a716-446655440503', 'james.innovation@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'James Wilson', 'innovation_head', '{"ascend", "aster", "achievers", "altogether"}', 'Innovation Head focused on new technologies and club initiatives.', '/avatars/james-wilson.jpg'),
('550e8400-e29b-41d4-a716-446655440504', 'sophia.treasurer@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Sophia Chen', 'treasurer', '{"ascend", "aster", "achievers", "altogether"}', 'Finance major and Treasurer. Manages all club budgets and expenses.', '/avatars/sophia-chen.jpg'),
('550e8400-e29b-41d4-a716-446655440505', 'daniel.outreach@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Daniel Kim', 'outreach', '{"ascend", "aster", "achievers", "altogether"}', 'Communications major and Outreach coordinator. Builds external partnerships.', '/avatars/daniel-kim.jpg'),
-- Regular students with varied club memberships
('550e8400-e29b-41d4-a716-446655440601', 'student1@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'John Smith', 'student', '{"ascend"}', 'Computer Science sophomore interested in AI and machine learning.', '/avatars/john-smith.jpg'),
('550e8400-e29b-41d4-a716-446655440602', 'student2@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Emma Davis', 'student', '{"aster", "altogether"}', 'Psychology major focused on communication and wellness.', '/avatars/emma-davis.jpg'),
('550e8400-e29b-41d4-a716-446655440603', 'student3@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Michael Brown', 'student', '{"achievers"}', 'Pre-med student preparing for graduate school.', '/avatars/michael-brown.jpg'),
('550e8400-e29b-41d4-a716-446655440604', 'student4@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'Olivia Taylor', 'student', '{"ascend", "aster"}', 'Software Engineering major with leadership interests.', '/avatars/olivia-taylor.jpg'),
('550e8400-e29b-41d4-a716-446655440605', 'student5@zenith.edu', '$2b$10$K8K8K8K8K8K8K8K8K8K8K.abcdefghijklmnopqrstuvwxyz1234567890', 'William Johnson', 'student', '{"altogether", "achievers"}', 'Philosophy major focused on personal development.', '/avatars/william-johnson.jpg');

-- Update club leadership references now that users exist
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440101', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440102', secretary_id = '550e8400-e29b-41d4-a716-446655440103', media_id = '550e8400-e29b-41d4-a716-446655440104' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440201', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440202', secretary_id = '550e8400-e29b-41d4-a716-446655440203', media_id = '550e8400-e29b-41d4-a716-446655440204' WHERE id = 'aster';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440301', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440302', secretary_id = '550e8400-e29b-41d4-a716-446655440303', media_id = '550e8400-e29b-41d4-a716-446655440304' WHERE id = 'achievers';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440401', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440402', secretary_id = '550e8400-e29b-41d4-a716-446655440403', media_id = '550e8400-e29b-41d4-a716-446655440404' WHERE id = 'altogether';

-- Insert sample events
INSERT INTO events (title, description, date, time, location, club_id, created_by, max_attendees, status) VALUES
('Advanced React Workshop', 'Learn advanced React patterns, hooks, and performance optimization', '2025-08-10', '14:00', 'Tech Lab A', 'ascend', '550e8400-e29b-41d4-a716-446655440101', 30, 'upcoming'),
('Hackathon 2025', '48-hour coding challenge to build innovative solutions', '2025-08-15', '09:00', 'Main Auditorium', 'ascend', '550e8400-e29b-41d4-a716-446655440101', 100, 'upcoming'),
('Public Speaking Masterclass', 'Overcome stage fright and deliver impactful presentations', '2025-08-12', '10:00', 'Conference Room B', 'aster', '550e8400-e29b-41d4-a716-446655440201', 25, 'upcoming'),
('GRE Strategy Session', 'Comprehensive guide to GRE preparation and test strategies', '2025-08-15', '16:00', 'Study Hall', 'achievers', '550e8400-e29b-41d4-a716-446655440301', 40, 'upcoming'),
('Mindfulness & Meditation', 'Stress relief and mental wellness session', '2025-08-18', '18:00', 'Wellness Center', 'altogether', '550e8400-e29b-41d4-a716-446655440401', 50, 'upcoming');

-- Insert sample posts
INSERT INTO posts (title, content, author_id, club_id) VALUES
('Tips for Effective Debugging', 'Debugging is an essential skill for every programmer. Here are some proven techniques...', '550e8400-e29b-41d4-a716-446655440101', 'ascend'),
('Building Confidence in Presentations', 'Public speaking can be intimidating, but with the right techniques and practice, anyone can become a confident presenter.', '550e8400-e29b-41d4-a716-446655440201', 'aster');

-- Insert sample comments
INSERT INTO comments (content, author_id, post_id) VALUES
('Great tips! The console.log technique has saved me countless hours.', '550e8400-e29b-41d4-a716-446655440601', (SELECT id FROM posts WHERE title = 'Tips for Effective Debugging')),
('This really helped me prepare for my presentation last week. Thank you!', '550e8400-e29b-41d4-a716-446655440602', (SELECT id FROM posts WHERE title = 'Building Confidence in Presentations'));

-- Insert sample announcements
INSERT INTO announcements (title, content, type, author_id, club_id, priority) VALUES
('Upcoming Hackathon Registration', 'Registration is now open for our annual hackathon! Limited spots available.', 'event', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'high'),
('Welcome to Zenith Forum!', 'Welcome to the new academic year! We have exciting events and opportunities planned for all our clubs.', 'general', '550e8400-e29b-41d4-a716-446655440501', NULL, 'high');

-- Insert default chat rooms for each club
INSERT INTO chat_rooms (name, description, club_id, type, created_by) VALUES
('Ascend General', 'General discussion for Ascend club members', 'ascend', 'public', '550e8400-e29b-41d4-a716-446655440101'),
('Aster General', 'General discussion for Aster club members', 'aster', 'public', '550e8400-e29b-41d4-a716-446655440201'),
('Achievers General', 'General discussion for Achievers club members', 'achievers', 'public', '550e8400-e29b-41d4-a716-446655440301'),
('Altogether General', 'General discussion for Altogether club members', 'altogether', 'public', '550e8400-e29b-41d4-a716-446655440401');

-- Insert sample discussions
INSERT INTO discussions (title, description, author_id, club_id, category, tags, pinned) VALUES
('Welcome to Ascend!', 'Introduce yourself and let us know what programming languages you''re interested in learning.', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'introductions', '{"welcome", "introductions"}', true),
('Public Speaking Tips', 'Share your best tips for overcoming stage fright and delivering effective presentations.', '550e8400-e29b-41d4-a716-446655440201', 'aster', 'tips', '{"public-speaking", "presentations"}', false);

-- Insert sample user badges for management
INSERT INTO user_badges (user_id, badge_type, badge_name, description, icon, color) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'role', 'Coordinator', 'Club Coordinator', '👑', '#FFD700'),
('550e8400-e29b-41d4-a716-446655440501', 'role', 'President', 'Zenith Forum President', '⭐', '#E74C3C');

-- =============================================================================
-- Final success message
-- =============================================================================
SELECT '✅ Zenith Forum database setup complete! All tables created and populated with dummy data.' as message;
-- =============================================================================
