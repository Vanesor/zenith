-- Admin Content Management Schema
-- This schema enables dynamic management of carousels, team cards, and events

-- Page Content Management Table
CREATE TABLE page_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_type VARCHAR NOT NULL CHECK (page_type IN ('landing', 'club_home')),
    page_reference_id VARCHAR, -- null for landing page, club_id for club pages
    content_type VARCHAR NOT NULL CHECK (content_type IN ('carousel', 'team_card', 'featured_event', 'hero_section', 'about_section')),
    title VARCHAR,
    subtitle VARCHAR,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    metadata JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carousel Slides Table
CREATE TABLE carousel_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_type VARCHAR NOT NULL CHECK (page_type IN ('landing', 'club_home')),
    page_reference_id VARCHAR, -- null for landing page, club_id for club pages
    title VARCHAR NOT NULL,
    subtitle VARCHAR,
    description TEXT,
    image_url TEXT NOT NULL,
    button_text VARCHAR,
    button_link VARCHAR,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team Cards Table
CREATE TABLE team_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_type VARCHAR NOT NULL CHECK (page_type IN ('landing', 'club_home')),
    page_reference_id VARCHAR, -- null for landing page, club_id for club pages
    member_name VARCHAR NOT NULL,
    member_role VARCHAR NOT NULL,
    member_email VARCHAR,
    member_phone VARCHAR,
    avatar_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Featured Events Table (for homepage/club page highlights)
CREATE TABLE featured_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    page_type VARCHAR NOT NULL CHECK (page_type IN ('landing', 'club_home')),
    page_reference_id VARCHAR, -- null for landing page, club_id for club pages
    custom_title VARCHAR, -- override event title if needed
    custom_description TEXT, -- override event description if needed
    custom_image_url TEXT, -- override event image if needed
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    featured_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Permissions Table
CREATE TABLE content_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    page_type VARCHAR NOT NULL CHECK (page_type IN ('landing', 'club_home')),
    page_reference_id VARCHAR, -- null for landing page, club_id for club pages
    permission_type VARCHAR NOT NULL CHECK (permission_type IN ('read', 'write', 'delete', 'admin')),
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_page_content_page ON page_content(page_type, page_reference_id);
CREATE INDEX idx_carousel_slides_page ON carousel_slides(page_type, page_reference_id);
CREATE INDEX idx_team_cards_page ON team_cards(page_type, page_reference_id);
CREATE INDEX idx_featured_events_page ON featured_events(page_type, page_reference_id);
CREATE INDEX idx_content_permissions_user ON content_permissions(user_id, page_type, page_reference_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON page_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON carousel_slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_cards_updated_at BEFORE UPDATE ON team_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_featured_events_updated_at BEFORE UPDATE ON featured_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions for Zenith Committee (can manage landing page)
INSERT INTO content_permissions (user_id, page_type, page_reference_id, permission_type, granted_by)
SELECT 
    u.id,
    'landing',
    null,
    'admin',
    u.id
FROM users u 
WHERE u.role IN ('admin', 'president', 'vice_president', 'innovation_head', 'secretary', 'treasurer', 'outreach_coordinator', 'media_coordinator', 'zenith_committee');

-- Insert default permissions for Club Coordinators (can manage their club pages)
INSERT INTO content_permissions (user_id, page_type, page_reference_id, permission_type, granted_by)
SELECT 
    u.id,
    'club_home',
    u.club_id,
    'admin',
    u.id
FROM users u 
WHERE u.role IN ('coordinator', 'co_coordinator', 'club_coordinator') AND u.club_id IS NOT NULL;
