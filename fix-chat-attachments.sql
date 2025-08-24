-- Fix for chat_attachments table structure
-- Run this to fix the index errors from the previous migration

-- Check the current structure of chat_attachments and fix if needed
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_file_id BOOLEAN;
BEGIN
    -- Check if user_id column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'chat_attachments' AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Check if file_id column exists  
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'chat_attachments' AND column_name = 'file_id'
    ) INTO has_file_id;
    
    -- Add missing columns if they don't exist
    IF NOT has_user_id THEN
        ALTER TABLE chat_attachments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to chat_attachments';
    END IF;
    
    IF NOT has_file_id THEN
        ALTER TABLE chat_attachments ADD COLUMN file_id UUID REFERENCES media_files(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added file_id column to chat_attachments';
    END IF;
END $$;

-- Now create the missing indexes
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_file_id ON chat_attachments(file_id);

-- Track this fix
INSERT INTO migrations (name, applied_at)
VALUES ('fix_chat_attachments_structure', NOW())
ON CONFLICT (name) DO NOTHING;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Chat attachments table structure fixed!';
    RAISE NOTICE 'Missing indexes have been created successfully.';
END $$;
