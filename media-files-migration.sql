-- Migration script for media files storage
-- Run this if the media_files table doesn't exist yet

CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY,
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_reference ON media_files(upload_reference_id, upload_context);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_context ON media_files(upload_context);

-- Add migration tracking
INSERT INTO migrations (name, applied_at)
VALUES ('add_media_files_table', NOW())
ON CONFLICT (name) DO NOTHING;

-- Update users table if profile_image_url column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- Update clubs table if logo_url column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE clubs ADD COLUMN logo_url TEXT;
    END IF;
END $$;
