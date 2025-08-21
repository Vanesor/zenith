-- Enhanced Image Storage Schema for PostgreSQL
-- Store images directly in database with optimization

-- Create enhanced images table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Original file info
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    
    -- Image metadata
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    description TEXT,
    
    -- Binary data storage
    image_data BYTEA NOT NULL, -- Original image
    thumbnail_data BYTEA,      -- Small thumbnail (150x150)
    medium_data BYTEA,         -- Medium size (800x600)
    
    -- Compression settings
    original_quality INTEGER DEFAULT 100,
    thumbnail_quality INTEGER DEFAULT 70,
    medium_quality INTEGER DEFAULT 85,
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    
    -- Context and organization
    context VARCHAR(50), -- 'chat', 'profile', 'event', 'assignment'
    reference_id UUID,   -- ID of related entity
    folder_path VARCHAR(255),
    
    -- Security
    access_token VARCHAR(255), -- For secure access
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 50 * 1024 * 1024), -- Max 50MB
    CONSTRAINT check_image_dimensions CHECK (width > 0 AND height > 0),
    CONSTRAINT check_quality CHECK (
        original_quality BETWEEN 1 AND 100 AND
        thumbnail_quality BETWEEN 1 AND 100 AND
        medium_quality BETWEEN 1 AND 100
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_images_context ON images(context);
CREATE INDEX IF NOT EXISTS idx_images_reference_id ON images(reference_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_access_token ON images(access_token);
CREATE INDEX IF NOT EXISTS idx_images_expires_at ON images(expires_at);
CREATE INDEX IF NOT EXISTS idx_images_public ON images(is_public) WHERE is_public = true;

-- Function to update last_accessed and access_count
CREATE OR REPLACE FUNCTION update_image_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    NEW.access_count = OLD.access_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update access statistics
CREATE TRIGGER trigger_update_image_access
    BEFORE UPDATE OF image_data, thumbnail_data, medium_data
    ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_image_access();

-- Function to cleanup expired images
CREATE OR REPLACE FUNCTION cleanup_expired_images()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM images 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure access token
CREATE OR REPLACE FUNCTION generate_image_access_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- View for public images (for performance)
CREATE OR REPLACE VIEW public_images AS
SELECT 
    id,
    original_filename,
    file_size,
    mime_type,
    width,
    height,
    alt_text,
    description,
    context,
    reference_id,
    created_at,
    access_count
FROM images 
WHERE is_public = true;

-- View for image statistics
CREATE OR REPLACE VIEW image_statistics AS
SELECT 
    context,
    COUNT(*) as total_images,
    SUM(file_size) as total_size_bytes,
    AVG(file_size) as avg_size_bytes,
    MAX(file_size) as max_size_bytes,
    MIN(file_size) as min_size_bytes,
    SUM(access_count) as total_accesses
FROM images 
GROUP BY context;
