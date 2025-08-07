-- Enhanced Chat System Database Schema
-- Run this to add new tables and update existing ones for advanced chat features
-- This schema is compatible with existing UUID-based structure

-- Create chat_attachments table for file uploads
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    room_id UUID NOT NULL,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image' or 'document'
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    encryption_key TEXT, -- For encrypted files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_invitations table for private room invitations
CREATE TABLE IF NOT EXISTS chat_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id),
    inviter_id UUID NOT NULL REFERENCES users(id),
    invitee_email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(100) UNIQUE NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, expired
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Add new columns to existing chat_messages table
DO $$ 
BEGIN
    -- Add reply_to column for message replies (using existing reply_to_message_id if available)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'reply_to') THEN
        -- Check if reply_to_message_id already exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'reply_to_message_id') THEN
            -- Rename existing column
            ALTER TABLE chat_messages RENAME COLUMN reply_to_message_id TO reply_to;
        ELSE
            -- Add new column
            ALTER TABLE chat_messages ADD COLUMN reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Add encryption flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'is_encrypted') THEN
        ALTER TABLE chat_messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add updated_at if not exists (might be there already)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'updated_at') THEN
        ALTER TABLE chat_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add sender_id column (alias for user_id for consistency with API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'sender_id') THEN
        -- Add sender_id that references user_id
        ALTER TABLE chat_messages ADD COLUMN sender_id UUID;
        -- Copy data from user_id to sender_id
        UPDATE chat_messages SET sender_id = user_id WHERE user_id IS NOT NULL;
        -- Add foreign key constraint
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey 
            FOREIGN KEY (sender_id) REFERENCES users(id);
    END IF;
    
    -- Add content column (alias for message for consistency with API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'content') THEN
        ALTER TABLE chat_messages ADD COLUMN content TEXT;
        -- Copy data from message to content
        UPDATE chat_messages SET content = message WHERE message IS NOT NULL;
    END IF;
END $$;

-- Add new columns to existing chat_rooms table
DO $$ 
BEGIN
    -- Add room type (public/private)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'room_type') THEN
        -- Check if 'type' column exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'type') THEN
            ALTER TABLE chat_rooms RENAME COLUMN type TO room_type;
        ELSE
            ALTER TABLE chat_rooms ADD COLUMN room_type VARCHAR(20) DEFAULT 'public';
        END IF;
    END IF;
    
    -- Add encryption enabled flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'encryption_enabled') THEN
        ALTER TABLE chat_rooms ADD COLUMN encryption_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_room_id ON chat_attachments(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_invitations_token ON chat_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_chat_invitations_email ON chat_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_chat_messages_encrypted ON chat_messages(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_content ON chat_messages USING gin(to_tsvector('english', content));

-- Create a function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE chat_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update message updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_message_timestamp
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_timestamp();

-- Create a function to sync content and message fields
CREATE OR REPLACE FUNCTION sync_message_content()
RETURNS TRIGGER AS $$
BEGIN
    -- When content is updated, also update message field for backward compatibility
    IF NEW.content IS DISTINCT FROM OLD.content THEN
        NEW.message = NEW.content;
    END IF;
    -- When message is updated, also update content field
    IF NEW.message IS DISTINCT FROM OLD.message THEN
        NEW.content = NEW.message;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_message_content ON chat_messages;
CREATE TRIGGER trigger_sync_message_content
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION sync_message_content();

COMMIT;
