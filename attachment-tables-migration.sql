-- Additional tables for enhanced file management system
-- Run this after the main media-files-migration.sql

-- Table for submission attachments
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

-- Table for post attachments
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

-- Update chat_attachments table to ensure it exists and has proper structure
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission_id ON submission_attachments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_media_file_id ON submission_attachments(media_file_id);

CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_media_file_id ON post_attachments(media_file_id);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_room_id ON chat_attachments(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_file_id ON chat_attachments(file_id);

-- Add updated_at columns to events table if they don't exist
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
END $$;

-- Track this migration
INSERT INTO migrations (name, applied_at)
VALUES ('add_attachment_tables', NOW())
ON CONFLICT (name) DO NOTHING;
