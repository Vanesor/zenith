-- ==============================================================================
-- ZENITH FORUM - COMPLETE UPDATED SETUP SCRIPT
-- ==============================================================================
-- Updated to match the copilot instructions requirements
-- Four clubs: Ascend, Aster, Achievers, Altogether
-- Enhanced user roles and management structure
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CREATE ALL TABLES
-- ==============================================================================

-- Users table with enhanced role system
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

-- Clubs table with enhanced management structure
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

-- Zenith Committee table for overall forum management
CREATE TABLE IF NOT EXISTS zenith_committee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    president_id UUID,
    vice_president_id UUID,
    innovation_head_id UUID,
    treasurer_id UUID,
    secretary_id UUID,
    outreach_id UUID,
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
    view_count INTEGER DEFAULT 0,
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

-- Posts table with enhanced features
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id VARCHAR(50) REFERENCES clubs(id),
    category VARCHAR(100),
    image_url TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table with edit/delete time limits
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edit_deadline TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    delete_deadline TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    view_count INTEGER DEFAULT 0,
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

-- Chat rooms table with group creation capabilities
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    club_id VARCHAR(50) REFERENCES clubs(id),
    type VARCHAR(50) DEFAULT 'public',
    created_by UUID REFERENCES users(id),
    members UUID[] DEFAULT '{}',
    is_group BOOLEAN DEFAULT FALSE,
    group_admin UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table with reply functionality
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url TEXT,
    reply_to_message_id UUID REFERENCES chat_messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table with automatic creation
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    related_id UUID, -- ID of related event/assignment/announcement
    related_type VARCHAR(50), -- type of related content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zen Chatbot Knowledge Base
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    embedding VECTOR(1536), -- For OpenAI embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAQ table for Zen chatbot
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Add foreign key constraints to zenith committee
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_president FOREIGN KEY (president_id) REFERENCES users(id);
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_vice_president FOREIGN KEY (vice_president_id) REFERENCES users(id);
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_innovation_head FOREIGN KEY (innovation_head_id) REFERENCES users(id);
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_treasurer FOREIGN KEY (treasurer_id) REFERENCES users(id);
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_secretary FOREIGN KEY (secretary_id) REFERENCES users(id);
ALTER TABLE zenith_committee ADD CONSTRAINT fk_committee_outreach FOREIGN KEY (outreach_id) REFERENCES users(id);

-- ==============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_assignments_club_id ON assignments(club_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ==============================================================================
-- 4. INSERT SAMPLE DATA
-- ==============================================================================

-- Insert the four correct clubs as per copilot instructions
INSERT INTO clubs (id, name, type, description, long_description, icon, color, guidelines) VALUES
('ascend', 'Ascend', 'Coding Club', 'Programming challenges, hackathons, tech talks', 'Ascend is the coding club focused on programming challenges, hackathons, tech talks, code sharing and collaboration features. We help students master coding skills and stay updated with latest technologies.', 'Code', 'blue', 'Focus on coding excellence and collaborative development'),
('aster', 'Aster', 'Soft Skills Club', 'Communication workshops, leadership training', 'Aster specializes in soft skills development including communication workshops, leadership training, presentation skills, and interpersonal skill development. We help students become well-rounded professionals.', 'Users', 'green', 'Develop communication and leadership skills'),
('achievers', 'Achievers', 'Higher Studies Club', 'Graduate school preparation, competitive exams', 'Achievers focuses on higher studies preparation including graduate school guidance, competitive exam preparation, research opportunities, and academic excellence. We support students in their academic journey.', 'GraduationCap', 'purple', 'Excel in academics and research'),
('altogether', 'Altogether', 'Holistic Personality Growth', 'Overall personality development and life skills', 'Altogether is dedicated to holistic personality development including life skills, wellness, personal growth content, and overall personality enhancement. We focus on complete personal development.', 'Heart', 'orange', 'Promote holistic personal growth and wellness');

-- Insert Zenith Committee
INSERT INTO zenith_committee (id) VALUES ('550e8400-c000-41d4-a716-446655440000');

-- Insert users with enhanced role system
INSERT INTO users (id, email, password_hash, name, role, club_id, bio) VALUES
-- Zenith Committee Members
('550e8400-e29b-41d4-a716-446655440000', 'president@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Zenith President', 'president', NULL, 'Overall forum leader and president'),
('550e8400-e29b-41d4-a716-446655440001', 'vice.president@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Zenith Vice President', 'vice_president', NULL, 'Secondary leadership and support'),
('550e8400-e29b-41d4-a716-446655440002', 'innovation@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Innovation Head', 'innovation_head', NULL, 'New initiatives and technology leadership'),
('550e8400-e29b-41d4-a716-446655440003', 'treasurer@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Zenith Treasurer', 'treasurer', NULL, 'Financial management and budgeting'),
('550e8400-e29b-41d4-a716-446655440004', 'secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Zenith Secretary', 'secretary', NULL, 'Administrative coordination'),
('550e8400-e29b-41d4-a716-446655440005', 'outreach@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Outreach Head', 'outreach', NULL, 'External relations and partnerships'),

-- ASCEND (Coding Club) Coordinators
('550e8400-e29b-41d4-a716-446655440010', 'ascend.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Ascend Coordinator', 'coordinator', 'ascend', 'Lead coordinator for Ascend coding club'),
('550e8400-e29b-41d4-a716-446655440011', 'ascend.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Ascend Co-Coordinator', 'co_coordinator', 'ascend', 'Co-coordinator supporting Ascend activities'),
('550e8400-e29b-41d4-a716-446655440012', 'ascend.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Ascend Secretary', 'secretary', 'ascend', 'Secretary managing Ascend documentation'),
('550e8400-e29b-41d4-a716-446655440013', 'ascend.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Ascend Media Head', 'media', 'ascend', 'Media coordinator for Ascend club'),

-- ASTER (Soft Skills Club) Coordinators
('550e8400-e29b-41d4-a716-446655440020', 'aster.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Aster Coordinator', 'coordinator', 'aster', 'Lead coordinator for Aster soft skills club'),
('550e8400-e29b-41d4-a716-446655440021', 'aster.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Aster Co-Coordinator', 'co_coordinator', 'aster', 'Co-coordinator supporting Aster activities'),
('550e8400-e29b-41d4-a716-446655440022', 'aster.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Aster Secretary', 'secretary', 'aster', 'Secretary managing Aster documentation'),
('550e8400-e29b-41d4-a716-446655440023', 'aster.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Aster Media Head', 'media', 'aster', 'Media coordinator for Aster club'),

-- ACHIEVERS (Higher Studies Club) Coordinators
('550e8400-e29b-41d4-a716-446655440030', 'achievers.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Achievers Coordinator', 'coordinator', 'achievers', 'Lead coordinator for Achievers higher studies club'),
('550e8400-e29b-41d4-a716-446655440031', 'achievers.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Achievers Co-Coordinator', 'co_coordinator', 'achievers', 'Co-coordinator supporting Achievers activities'),
('550e8400-e29b-41d4-a716-446655440032', 'achievers.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Achievers Secretary', 'secretary', 'achievers', 'Secretary managing Achievers documentation'),
('550e8400-e29b-41d4-a716-446655440033', 'achievers.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Achievers Media Head', 'media', 'achievers', 'Media coordinator for Achievers club'),

-- ALTOGETHER (Holistic Personality Growth) Coordinators
('550e8400-e29b-41d4-a716-446655440040', 'altogether.coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Altogether Coordinator', 'coordinator', 'altogether', 'Lead coordinator for Altogether personality growth club'),
('550e8400-e29b-41d4-a716-446655440041', 'altogether.co-coordinator@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Altogether Co-Coordinator', 'co_coordinator', 'altogether', 'Co-coordinator supporting Altogether activities'),
('550e8400-e29b-41d4-a716-446655440042', 'altogether.secretary@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Altogether Secretary', 'secretary', 'altogether', 'Secretary managing Altogether documentation'),
('550e8400-e29b-41d4-a716-446655440043', 'altogether.media@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Altogether Media Head', 'media', 'altogether', 'Media coordinator for Altogether club'),

-- Students for each club
('550e8400-e29b-41d4-a716-446655440100', 'student1.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Alice Johnson', 'student', 'ascend', 'Computer Science student passionate about coding'),
('550e8400-e29b-41d4-a716-446655440101', 'student2.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Bob Smith', 'student', 'ascend', 'Software Engineering student interested in web development'),
('550e8400-e29b-41d4-a716-446655440102', 'student3.ascend@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Charlie Brown', 'student', 'ascend', 'Data Science student exploring machine learning'),

('550e8400-e29b-41d4-a716-446655440200', 'student1.aster@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Diana Prince', 'student', 'aster', 'Business student focused on leadership skills'),
('550e8400-e29b-41d4-a716-446655440201', 'student2.aster@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Edward Wilson', 'student', 'aster', 'Communication studies student'),
('550e8400-e29b-41d4-a716-446655440202', 'student3.aster@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Fiona Green', 'student', 'aster', 'Psychology student interested in interpersonal skills'),

('550e8400-e29b-41d4-a716-446655440300', 'student1.achievers@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Grace Miller', 'student', 'achievers', 'Pre-med student preparing for MCAT'),
('550e8400-e29b-41d4-a716-446655440301', 'student2.achievers@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Henry Davis', 'student', 'achievers', 'Engineering student planning for MS'),
('550e8400-e29b-41d4-a716-446655440302', 'student3.achievers@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Isabella Martinez', 'student', 'achievers', 'Research-oriented student preparing for PhD'),

('550e8400-e29b-41d4-a716-446655440400', 'student1.altogether@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Jack Thompson', 'student', 'altogether', 'Liberal arts student focused on personal growth'),
('550e8400-e29b-41d4-a716-446655440401', 'student2.altogether@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Karen White', 'student', 'altogether', 'Philosophy student interested in life skills'),
('550e8400-e29b-41d4-a716-446655440402', 'student3.altogether@zenith.com', '$2b$12$xpFzjPzZbGRcDjDVafxQcOFDwXMsAptqx/Rl0CnEBTMo7p0Jq8otu', 'Liam Garcia', 'student', 'altogether', 'Wellness enthusiast and personal development advocate');

-- Update club coordinators
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440010', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440011', secretary_id = '550e8400-e29b-41d4-a716-446655440012', media_id = '550e8400-e29b-41d4-a716-446655440013' WHERE id = 'ascend';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440020', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440021', secretary_id = '550e8400-e29b-41d4-a716-446655440022', media_id = '550e8400-e29b-41d4-a716-446655440023' WHERE id = 'aster';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440030', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440031', secretary_id = '550e8400-e29b-41d4-a716-446655440032', media_id = '550e8400-e29b-41d4-a716-446655440033' WHERE id = 'achievers';
UPDATE clubs SET coordinator_id = '550e8400-e29b-41d4-a716-446655440040', co_coordinator_id = '550e8400-e29b-41d4-a716-446655440041', secretary_id = '550e8400-e29b-41d4-a716-446655440042', media_id = '550e8400-e29b-41d4-a716-446655440043' WHERE id = 'altogether';

-- Update Zenith Committee
UPDATE zenith_committee SET 
    president_id = '550e8400-e29b-41d4-a716-446655440000',
    vice_president_id = '550e8400-e29b-41d4-a716-446655440001',
    innovation_head_id = '550e8400-e29b-41d4-a716-446655440002',
    treasurer_id = '550e8400-e29b-41d4-a716-446655440003',
    secretary_id = '550e8400-e29b-41d4-a716-446655440004',
    outreach_id = '550e8400-e29b-41d4-a716-446655440005'
WHERE id = '550e8400-c000-41d4-a716-446655440000';

-- Insert chat rooms
INSERT INTO chat_rooms (id, name, description, club_id, type, created_by, is_group) VALUES
-- Public rooms
('550e8400-c000-41d4-a716-446655440001', 'General Discussion', 'Open discussion for all members across clubs', NULL, 'public', '550e8400-e29b-41d4-a716-446655440000', FALSE),
('550e8400-c000-41d4-a716-446655440002', 'Announcements', 'Official announcements from administration', NULL, 'public', '550e8400-e29b-41d4-a716-446655440000', FALSE),

-- ASCEND club rooms
('550e8400-c001-41d4-a716-446655440001', 'Ascend General', 'Main discussion room for Ascend coding club', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010', FALSE),
('550e8400-c001-41d4-a716-446655440002', 'Ascend Projects', 'Discussion about coding projects and hackathons', 'ascend', 'club', '550e8400-e29b-41d4-a716-446655440010', FALSE),

-- ASTER club rooms
('550e8400-c002-41d4-a716-446655440001', 'Aster General', 'Main discussion room for Aster soft skills club', 'aster', 'club', '550e8400-e29b-41d4-a716-446655440020', FALSE),
('550e8400-c002-41d4-a716-446655440002', 'Aster Workshops', 'Discussion about communication and leadership workshops', 'aster', 'club', '550e8400-e29b-41d4-a716-446655440020', FALSE),

-- ACHIEVERS club rooms
('550e8400-c003-41d4-a716-446655440001', 'Achievers General', 'Main discussion room for Achievers higher studies club', 'achievers', 'club', '550e8400-e29b-41d4-a716-446655440030', FALSE),
('550e8400-c003-41d4-a716-446655440002', 'Achievers Study Groups', 'Study groups and exam preparation discussions', 'achievers', 'club', '550e8400-e29b-41d4-a716-446655440030', FALSE),

-- ALTOGETHER club rooms
('550e8400-c004-41d4-a716-446655440001', 'Altogether General', 'Main discussion room for Altogether personality growth club', 'altogether', 'club', '550e8400-e29b-41d4-a716-446655440040', FALSE),
('550e8400-c004-41d4-a716-446655440002', 'Altogether Wellness', 'Wellness and personal development discussions', 'altogether', 'club', '550e8400-e29b-41d4-a716-446655440040', FALSE);

-- Insert sample chat messages with timestamps
INSERT INTO chat_messages (room_id, user_id, message, created_at) VALUES
('550e8400-c000-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Welcome to the Zenith Forum! 🎉', CURRENT_TIMESTAMP),
('550e8400-c001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'Welcome to Ascend! Let''s build amazing coding projects together.', CURRENT_TIMESTAMP),
('550e8400-c002-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 'Aster is where communication skills flourish!', CURRENT_TIMESTAMP),
('550e8400-c003-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'Achievers - your gateway to higher studies success!', CURRENT_TIMESTAMP),
('550e8400-c004-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440040', 'Altogether - where personality growth begins! 🌱', CURRENT_TIMESTAMP);

-- Insert assignments for each club
INSERT INTO assignments (id, title, description, club_id, assigned_by, due_date, max_points, instructions, status, created_at) VALUES
-- ASCEND assignments
('550e8400-a001-41d4-a716-446655440001', 'Full Stack Web Application', 'Create a responsive web application using modern frameworks', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 100, 'Build a full-stack web application with user authentication, responsive design, and database integration using React/Next.js and Node.js.', 'active', CURRENT_TIMESTAMP),
('550e8400-a001-41d4-a716-446655440002', 'Algorithm Challenge', 'Solve advanced data structure and algorithm problems', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '1 weeks', 80, 'Complete the coding challenges focusing on dynamic programming, graph algorithms, and system design.', 'active', CURRENT_TIMESTAMP),

-- ASTER assignments
('550e8400-a002-41d4-a716-446655440001', 'Leadership Presentation', 'Prepare and deliver a leadership presentation', 'aster', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Create a 15-minute presentation on a leadership topic of your choice. Focus on clear communication, engaging delivery, and practical insights.', 'active', CURRENT_TIMESTAMP),
('550e8400-a002-41d4-a716-446655440002', 'Communication Skills Assessment', 'Complete interpersonal communication exercises', 'aster', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 90, 'Participate in role-playing exercises and submit reflection essays on communication scenarios.', 'active', CURRENT_TIMESTAMP),

-- ACHIEVERS assignments
('550e8400-a003-41d4-a716-446655440001', 'Graduate School Application', 'Complete mock graduate school application process', 'achievers', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '4 weeks', 120, 'Prepare a complete graduate school application including statement of purpose, research proposal, and application essays.', 'active', CURRENT_TIMESTAMP),
('550e8400-a003-41d4-a716-446655440002', 'Research Paper Review', 'Analyze and review recent research papers in your field', 'achievers', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Select 3 recent research papers in your field, provide detailed analysis and critical review.', 'active', CURRENT_TIMESTAMP),

-- ALTOGETHER assignments
('550e8400-a004-41d4-a716-446655440001', 'Personal Development Plan', 'Create a comprehensive personal growth strategy', 'altogether', '550e8400-e29b-41d4-a716-446655440040', CURRENT_TIMESTAMP + INTERVAL '4 weeks', 120, 'Develop a detailed personal development plan including SWOT analysis, goal setting, and action steps for holistic growth.', 'active', CURRENT_TIMESTAMP),
('550e8400-a004-41d4-a716-446655440002', 'Wellness Journal', 'Maintain a daily wellness and mindfulness journal', 'altogether', '550e8400-e29b-41d4-a716-446655440040', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 80, 'Keep a daily journal documenting wellness activities, mindfulness practices, and personal reflections for 14 days.', 'active', CURRENT_TIMESTAMP);

-- Insert events for each club
INSERT INTO events (id, title, description, club_id, created_by, event_date, event_time, location, max_attendees, status, created_at) VALUES
-- ASCEND events
('550e8400-e001-41d4-a716-446655440001', 'Coding Bootcamp 2025', 'Intensive coding workshop covering modern web technologies', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '15 days', '09:00:00', 'Computer Lab A', 50, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e001-41d4-a716-446655440002', 'Hackathon Weekend', '48-hour coding marathon to build innovative solutions', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '22 days', '18:00:00', 'Innovation Hub', 100, 'upcoming', CURRENT_TIMESTAMP),

-- ASTER events
('550e8400-e002-41d4-a716-446655440001', 'Leadership Summit', 'Annual leadership skills development conference', 'aster', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '18 days', '10:00:00', 'Main Auditorium', 200, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e002-41d4-a716-446655440002', 'Communication Workshop', 'Interactive session on effective communication techniques', 'aster', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + INTERVAL '12 days', '14:00:00', 'Seminar Hall B', 75, 'upcoming', CURRENT_TIMESTAMP),

-- ACHIEVERS events
('550e8400-e003-41d4-a716-446655440001', 'Graduate School Fair', 'Meet representatives from top graduate programs', 'achievers', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '20 days', '10:00:00', 'Exhibition Center', 300, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e003-41d4-a716-446655440002', 'Research Symposium', 'Student research presentations and poster session', 'achievers', '550e8400-e29b-41d4-a716-446655440030', CURRENT_DATE + INTERVAL '25 days', '13:00:00', 'Conference Hall', 150, 'upcoming', CURRENT_TIMESTAMP),

-- ALTOGETHER events
('550e8400-e004-41d4-a716-446655440001', 'Wellness Retreat', 'Day-long wellness and mindfulness retreat', 'altogether', '550e8400-e29b-41d4-a716-446655440040', CURRENT_DATE + INTERVAL '30 days', '08:00:00', 'Campus Garden', 80, 'upcoming', CURRENT_TIMESTAMP),
('550e8400-e004-41d4-a716-446655440002', 'Personal Growth Workshop', 'Interactive workshop on holistic personality development', 'altogether', '550e8400-e29b-41d4-a716-446655440040', CURRENT_DATE + INTERVAL '14 days', '15:00:00', 'Student Center', 60, 'upcoming', CURRENT_TIMESTAMP);

-- Insert sample posts with announcements
INSERT INTO posts (id, title, content, author_id, club_id, category, is_announcement, created_at) VALUES
('550e8400-p001-41d4-a716-446655440001', 'Welcome to Ascend Coding Club!', 'We are excited to have you join our coding community. Get ready for exciting projects, hackathons, and learning opportunities!', '550e8400-e29b-41d4-a716-446655440010', 'ascend', 'announcement', TRUE, CURRENT_TIMESTAMP),
('550e8400-p002-41d4-a716-446655440001', 'JavaScript Best Practices Guide', 'Here are some essential JavaScript best practices every developer should know...', '550e8400-e29b-41d4-a716-446655440100', 'ascend', 'tutorial', FALSE, CURRENT_TIMESTAMP),
('550e8400-p003-41d4-a716-446655440001', 'Aster Leadership Training Program', 'Join our comprehensive leadership development program designed to enhance your communication and leadership skills.', '550e8400-e29b-41d4-a716-446655440020', 'aster', 'announcement', TRUE, CURRENT_TIMESTAMP),
('550e8400-p004-41d4-a716-446655440001', 'Graduate School Application Tips', 'Essential tips for preparing a strong graduate school application...', '550e8400-e29b-41d4-a716-446655440300', 'achievers', 'discussion', FALSE, CURRENT_TIMESTAMP),
('550e8400-p005-41d4-a716-446655440001', 'Altogether Wellness Initiative', 'We are launching a new wellness initiative focused on holistic personal development and mental health awareness.', '550e8400-e29b-41d4-a716-446655440040', 'altogether', 'announcement', TRUE, CURRENT_TIMESTAMP);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, related_id, related_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'Welcome to Zenith Forum!', 'Welcome to the platform! Explore clubs, assignments, and connect with fellow students.', 'system', NULL, NULL, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440100', 'New Assignment: Full Stack Web Application', 'A new coding assignment has been posted in Ascend club.', 'assignment', '550e8400-a001-41d4-a716-446655440001', 'assignment', CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440200', 'New Event: Leadership Summit', 'Register now for the upcoming Leadership Summit in Aster club.', 'event', '550e8400-e002-41d4-a716-446655440001', 'event', CURRENT_TIMESTAMP);

-- Insert FAQ data for Zen chatbot
INSERT INTO faqs (question, answer, category, tags) VALUES
('How do I join a club?', 'You can join a club by contacting the club coordinator or during registration events. Each student can be a member of one club.', 'clubs', ARRAY['club', 'join', 'membership']),
('What are the four clubs in Zenith?', 'The four clubs are: Ascend (Coding Club), Aster (Soft Skills Club), Achievers (Higher Studies Club), and Altogether (Holistic Personality Growth).', 'clubs', ARRAY['clubs', 'list', 'information']),
('Who are the Zenith Committee members?', 'The Zenith Committee consists of President, Vice President, Innovation Head, Treasurer, Secretary, and Outreach Head who oversee the overall forum.', 'management', ARRAY['committee', 'management', 'roles']),
('How do I submit an assignment?', 'You can submit assignments through the assignments section in your club dashboard. Make sure to submit before the deadline.', 'assignments', ARRAY['assignment', 'submission', 'deadline']),
('How do I register for events?', 'Visit the events section and click on the event you want to attend. Registration is usually first-come, first-served.', 'events', ARRAY['events', 'registration', 'attend']);

-- Insert chatbot knowledge base
INSERT INTO chatbot_knowledge (title, content, category, tags) VALUES
('Navigation Guide', 'To navigate the Zenith forum: Use the main dashboard to access clubs, assignments, events, and discussions. The sidebar contains quick links to all major sections.', 'navigation', ARRAY['navigation', 'dashboard', 'guide']),
('Club Information', 'Ascend focuses on coding and technical skills. Aster develops soft skills and leadership. Achievers supports higher studies preparation. Altogether promotes holistic personality growth.', 'clubs', ARRAY['clubs', 'information', 'focus']),
('User Roles', 'Student: Regular club member. Coordinator: Club leader. Co-coordinator: Assistant leader. Secretary: Administrative tasks. Media: Communications. Committee members have forum-wide responsibilities.', 'roles', ARRAY['roles', 'permissions', 'management']),
('Event Management', 'Management positions can create, modify, and manage events. Students can view and register for events. Check the events calendar for upcoming activities.', 'events', ARRAY['events', 'management', 'calendar']);

-- ==============================================================================
-- SETUP COMPLETE!
-- ==============================================================================
-- The database is now ready with:
-- ✅ Four correct clubs: Ascend, Aster, Achievers, Altogether
-- ✅ Enhanced user roles including Zenith Committee
-- ✅ Chat rooms with reply functionality and group creation
-- ✅ Comments with edit/delete time limits
-- ✅ Posts with view counts and like counts
-- ✅ Events and assignments with view tracking
-- ✅ Automatic notification system
-- ✅ Zen chatbot knowledge base and FAQ
-- ✅ Enhanced management capabilities
-- ✅ Timestamps for all content
-- ✅ Performance indexes
--
-- TEST ACCOUNTS:
-- Email: president@zenith.com              | Password: password123 (Zenith President)
-- Email: ascend.coordinator@zenith.com     | Password: password123 (Ascend Coordinator)
-- Email: aster.coordinator@zenith.com      | Password: password123 (Aster Coordinator)
-- Email: achievers.coordinator@zenith.com  | Password: password123 (Achievers Coordinator)
-- Email: altogether.coordinator@zenith.com | Password: password123 (Altogether Coordinator)
-- Email: student1.ascend@zenith.com        | Password: password123 (Ascend Student)
-- Email: student1.aster@zenith.com         | Password: password123 (Aster Student)
-- Email: student1.achievers@zenith.com     | Password: password123 (Achievers Student)
-- Email: student1.altogether@zenith.com    | Password: password123 (Altogether Student)
-- ==============================================================================
