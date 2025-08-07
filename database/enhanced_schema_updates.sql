-- Schema updates to add comprehensive image support
-- Run this after the main schema setup

-- Add image support to assignment questions (for diagrams, charts, etc.)
ALTER TABLE assignment_questions 
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS question_image_alt TEXT,
ADD COLUMN IF NOT EXISTS question_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS answer_images JSONB DEFAULT '[]'::jsonb;

-- Add proctoring settings to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS require_camera BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_microphone BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_face_verification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_fullscreen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_submit_on_violation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proctoring_settings JSONB DEFAULT '{}'::jsonb;

-- Update users table for better profile image support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS verification_photo_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;

-- Add cover image and gallery to chat rooms
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS room_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS room_settings JSONB DEFAULT '{}'::jsonb;

-- Enhance chat messages for better media support
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS message_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS thread_id UUID,
ADD CONSTRAINT fk_chat_messages_thread FOREIGN KEY (thread_id) REFERENCES chat_messages(id);

-- Add image gallery support to posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add image support to events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add club logo and banner support
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS club_images JSONB DEFAULT '[]'::jsonb;

-- Create a dedicated table for file uploads and media management
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    description TEXT,
    uploaded_by UUID,
    upload_context VARCHAR, -- 'profile', 'question', 'chat', 'post', 'event', etc.
    upload_reference_id UUID, -- Reference to the related record
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_context ON media_files(upload_context);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_reference_id ON media_files(upload_reference_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Create table for proctoring session data
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    camera_enabled BOOLEAN DEFAULT FALSE,
    microphone_enabled BOOLEAN DEFAULT FALSE,
    face_verified BOOLEAN DEFAULT FALSE,
    violations JSONB DEFAULT '[]'::jsonb,
    screenshots JSONB DEFAULT '[]'::jsonb,
    system_info JSONB DEFAULT '{}'::jsonb,
    session_data JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT fk_proctoring_sessions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    CONSTRAINT fk_proctoring_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for proctoring sessions
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_assignment_id ON proctoring_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_user_id ON proctoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_session_start ON proctoring_sessions(session_start);

-- Create table for assignment question images/diagrams
CREATE TABLE IF NOT EXISTS question_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL,
    media_file_id UUID NOT NULL,
    media_type VARCHAR NOT NULL, -- 'image', 'diagram', 'chart', 'video'
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_media_question FOREIGN KEY (question_id) REFERENCES assignment_questions(id),
    CONSTRAINT fk_question_media_file FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

-- Create indexes for question media
CREATE INDEX IF NOT EXISTS idx_question_media_question_id ON question_media(question_id);
CREATE INDEX IF NOT EXISTS idx_question_media_display_order ON question_media(display_order);

-- Add support for PDF-based assignment generation
CREATE TABLE IF NOT EXISTS assignment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    template_file_url TEXT NOT NULL,
    template_type VARCHAR NOT NULL, -- 'pdf', 'docx', 'json'
    category VARCHAR, -- 'aptitude', 'technical', 'general'
    subject VARCHAR,
    difficulty_level VARCHAR, -- 'easy', 'medium', 'hard'
    estimated_questions INTEGER,
    created_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignment_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for assignment templates
CREATE INDEX IF NOT EXISTS idx_assignment_templates_category ON assignment_templates(category);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_subject ON assignment_templates(subject);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_difficulty ON assignment_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_created_by ON assignment_templates(created_by);

-- Table to track AI-generated assignments from PDFs
CREATE TABLE IF NOT EXISTS ai_assignment_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID,
    generated_assignment_id UUID,
    source_file_url TEXT NOT NULL,
    generation_prompt TEXT,
    ai_model_used VARCHAR,
    generation_status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    questions_extracted INTEGER DEFAULT 0,
    questions_created INTEGER DEFAULT 0,
    processing_log JSONB DEFAULT '[]'::jsonb,
    error_details TEXT,
    generated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_ai_generations_template FOREIGN KEY (template_id) REFERENCES assignment_templates(id),
    CONSTRAINT fk_ai_generations_assignment FOREIGN KEY (generated_assignment_id) REFERENCES assignments(id),
    CONSTRAINT fk_ai_generations_user FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Create indexes for AI assignment generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_template_id ON ai_assignment_generations(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_assignment_id ON ai_assignment_generations(generated_assignment_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_assignment_generations(generation_status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_assignment_generations(created_at);

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_templates_updated_at BEFORE UPDATE ON assignment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE media_files IS 'Centralized table for managing all file uploads including images, documents, etc.';
COMMENT ON TABLE proctoring_sessions IS 'Tracks proctoring session data including violations and verification status';
COMMENT ON TABLE question_media IS 'Links assignment questions to their associated media files (images, diagrams, etc.)';
COMMENT ON TABLE assignment_templates IS 'Templates for generating assignments from PDFs or other sources';
COMMENT ON TABLE ai_assignment_generations IS 'Tracks AI-powered assignment generation from PDF documents';

COMMENT ON COLUMN assignments.require_camera IS 'Whether camera access is required for this assignment';
COMMENT ON COLUMN assignments.require_microphone IS 'Whether microphone access is required for this assignment';
COMMENT ON COLUMN assignments.require_face_verification IS 'Whether face verification is required before starting';
COMMENT ON COLUMN assignments.require_fullscreen IS 'Whether fullscreen mode is enforced during the assignment';
COMMENT ON COLUMN assignments.proctoring_settings IS 'JSON object containing detailed proctoring configuration';

COMMENT ON COLUMN users.profile_image_url IS 'URL to the user profile image';
COMMENT ON COLUMN users.verification_photo_url IS 'URL to identity verification photo for proctored exams';
