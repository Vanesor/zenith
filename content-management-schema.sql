-- Content Management System Schema

-- Table for managing landing page content
CREATE TABLE IF NOT EXISTS landing_page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(50) NOT NULL, -- 'hero', 'about', 'features', 'testimonials', etc.
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    button_text VARCHAR(100),
    button_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table for managing carousel images (for clubs and general use)
CREATE TABLE IF NOT EXISTS carousel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    link_url TEXT,
    context VARCHAR(50) NOT NULL, -- 'landing', 'club', 'event', etc.
    context_id UUID, -- Can reference club_id, event_id, etc.
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Table for managing general site content
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL, -- 'site_name', 'footer_text', 'contact_email', etc.
    value TEXT NOT NULL,
    description TEXT,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'html', 'json', 'url'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_landing_page_content_section ON landing_page_content(section, is_active);
CREATE INDEX IF NOT EXISTS idx_carousel_images_context ON carousel_images(context, context_id, is_active);
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key, is_active);

-- Insert some default content
INSERT INTO site_content (key, value, description, content_type) VALUES
('site_name', 'Zenith', 'Website name displayed in header and title', 'text'),
('site_tagline', 'Empowering Innovation Through Technology', 'Main tagline for the website', 'text'),
('contact_email', 'contact@zenith.edu', 'Primary contact email', 'text'),
('social_facebook', 'https://facebook.com/zenith', 'Facebook page URL', 'url'),
('social_twitter', 'https://twitter.com/zenith', 'Twitter page URL', 'url'),
('social_instagram', 'https://instagram.com/zenith', 'Instagram page URL', 'url')
ON CONFLICT (key) DO NOTHING;

-- Insert default landing page content
INSERT INTO landing_page_content (section, title, subtitle, description, order_index) VALUES
('hero', 'Welcome to Zenith', 'Innovation Starts Here', 'Join us in building the future of technology and innovation. Connect, learn, and grow with like-minded individuals.', 1),
('about', 'About Zenith', 'Who We Are', 'We are a community of passionate innovators, developers, and thinkers working together to create meaningful technological solutions.', 2),
('features', 'What We Offer', 'Our Services', 'From technical workshops to networking events, we provide a comprehensive platform for learning and growth.', 3)
ON CONFLICT DO NOTHING;