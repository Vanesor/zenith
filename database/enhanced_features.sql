-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable update trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Additional tables for discussions, chat rooms, and enhanced features

-- Discussion topics table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id),
    club_id VARCHAR(50) REFERENCES clubs(id),
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    pinned BOOLEAN DEFAULT false,
    locked BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discussion replies table (separate from comments for better organization)
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
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
    club_id VARCHAR(50) REFERENCES clubs(id),
    type VARCHAR(50) DEFAULT 'public', -- public, private, announcement
    created_by UUID REFERENCES users(id),
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
    author_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
    attachments TEXT[] DEFAULT '{}',
    reply_to UUID REFERENCES chat_messages(id),
    edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event details enhancement table
CREATE TABLE event_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
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
    status VARCHAR(50) DEFAULT 'registered', -- registered, attended, cancelled
    registration_data JSONB,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_discussions_club_id ON discussions(club_id);
CREATE INDEX idx_discussions_author_id ON discussions(author_id);
CREATE INDEX idx_discussions_last_activity ON discussions(last_activity);
CREATE INDEX idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_author_id ON discussion_replies(author_id);
CREATE INDEX idx_discussion_replies_parent_id ON discussion_replies(parent_id);
CREATE INDEX idx_chat_rooms_club_id ON chat_rooms(club_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_author_id ON chat_messages(author_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_event_details_event_id ON event_details(event_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_details_updated_at BEFORE UPDATE ON event_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
INSERT INTO discussions (title, description, author_id, club_id, category, tags) VALUES
('Welcome to Ascend!', 'Introduce yourself and let us know what programming languages you''re interested in learning.', '550e8400-e29b-41d4-a716-446655440101', 'ascend', 'introductions', '{"welcome", "introductions"}'),
('React vs Vue: Which framework to choose?', 'Let''s discuss the pros and cons of different JavaScript frameworks for beginners.', '550e8400-e29b-41d4-a716-446655440102', 'ascend', 'technical', '{"react", "vue", "javascript"}'),
('Public Speaking Tips', 'Share your best tips for overcoming stage fright and delivering effective presentations.', '550e8400-e29b-41d4-a716-446655440201', 'aster', 'tips', '{"public-speaking", "presentations"}'),
('Graduate School Application Timeline', 'When should you start preparing for graduate school applications?', '550e8400-e29b-41d4-a716-446655440301', 'achievers', 'guidance', '{"graduate-school", "applications"}'),
('Daily Mindfulness Practices', 'What mindfulness techniques work best for you during stressful periods?', '550e8400-e29b-41d4-a716-446655440401', 'altogether', 'wellness', '{"mindfulness", "stress-relief"}');

-- Insert sample user badges
INSERT INTO user_badges (user_id, badge_type, badge_name, description, icon, color) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'role', 'Coordinator', 'Club Coordinator', 'crown', 'yellow'),
('550e8400-e29b-41d4-a716-446655440102', 'role', 'Co-Coordinator', 'Club Co-Coordinator', 'shield', 'blue'),
('550e8400-e29b-41d4-a716-446655440103', 'role', 'Secretary', 'Club Secretary', 'file-text', 'green'),
('550e8400-e29b-41d4-a716-446655440104', 'role', 'Media Head', 'Club Media Head', 'edit', 'purple'),
('550e8400-e29b-41d4-a716-446655440501', 'role', 'President', 'Zenith Forum President', 'star', 'red'),
('550e8400-e29b-41d4-a716-446655440502', 'role', 'Vice President', 'Zenith Forum Vice President', 'star', 'orange');
