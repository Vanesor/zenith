-- Comprehensive Media Files and Attachments Migration
-- This combines both media-files-migration.sql and attachment-tables-migration.sql
-- Run this single file to set up the complete media management system

-- First, ensure migrations table exists
CREATE TABLE IF NOT EXISTS migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. CREATE CORE MEDIA FILES TABLE
-- This is the foundation table that tracks all uploaded files
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    upload_context VARCHAR(50),
    upload_reference_id VARCHAR(50),
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADD COLUMNS TO EXISTING TABLES
-- Add profile image support to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- Add logo support to clubs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE clubs ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Add image columns to events table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'banner_image_url'
    ) THEN
        ALTER TABLE events ADD COLUMN banner_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'gallery_images'
    ) THEN
        ALTER TABLE events ADD COLUMN gallery_images JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. CREATE ATTACHMENT TABLES
-- These tables link specific content types to media files

-- Table for assignment submission attachments
CREATE TABLE IF NOT EXISTS submission_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for blog post attachments
CREATE TABLE IF NOT EXISTS post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    attachment_type VARCHAR(50) DEFAULT 'general', -- 'image', 'document', 'general'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for chat attachments (ensure it exists with proper structure)
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
-- Core media files indexes
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_reference ON media_files(upload_reference_id, upload_context);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_context ON media_files(upload_context);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Submission attachments indexes
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission_id ON submission_attachments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_media_file_id ON submission_attachments(media_file_id);

-- Post attachments indexes
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_media_file_id ON post_attachments(media_file_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_type ON post_attachments(attachment_type);

-- Chat attachments indexes
CREATE INDEX IF NOT EXISTS idx_chat_attachments_room_id ON chat_attachments(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_file_id ON chat_attachments(file_id);

-- 5. TRACK MIGRATION COMPLETION
INSERT INTO migrations (name, applied_at)
VALUES ('comprehensive_media_system', NOW())
ON CONFLICT (name) DO NOTHING;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Media files and attachments migration completed successfully!';
    RAISE NOTICE 'Tables created: media_files, submission_attachments, post_attachments, chat_attachments';
    RAISE NOTICE 'Columns added: users.profile_image_url, clubs.logo_url, events.banner_image_url, events.gallery_images';
    RAISE NOTICE 'Indexes created for optimal performance';
END $$;
