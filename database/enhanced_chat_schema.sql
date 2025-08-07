-- Enhanced Chat System Database Schema
-- Run this to add new tables and update existing ones for advanced chat features
-- Compatible with existing UUID-based schema

-- Create chat_attachments table for file uploads
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Update existing chat_room_members table structure to match enhanced features
-- Note: The table already exists, so we'll add columns if they don't exist
DO $$ 
BEGIN
    -- Add role column to existing chat_room_members table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_room_members' AND column_name = 'role') THEN
        ALTER TABLE chat_room_members ADD COLUMN role VARCHAR(20) DEFAULT 'member';
    END IF;
    
    -- Add user_email column for invitation tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_room_members' AND column_name = 'user_email') THEN
        ALTER TABLE chat_room_members ADD COLUMN user_email VARCHAR(255);
    END IF;
END $$;

-- Add new columns to existing chat_messages table
DO $$ 
BEGIN
    -- Add reply_to column for message replies (already exists as reply_to_message_id)
    -- We'll add our own column name for consistency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'reply_to') THEN
        ALTER TABLE chat_messages ADD COLUMN reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
    END IF;
    
    -- Add sender_id column (user_id already exists, we'll add alias)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'sender_id') THEN
        ALTER TABLE chat_messages ADD COLUMN sender_id UUID REFERENCES users(id);
        -- Copy existing user_id data to sender_id
        UPDATE chat_messages SET sender_id = user_id WHERE sender_id IS NULL;
    END IF;
    
    -- Add content column (message already exists, we'll add alias)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'content') THEN
        ALTER TABLE chat_messages ADD COLUMN content TEXT;
        -- Copy existing message data to content
        UPDATE chat_messages SET content = message WHERE content IS NULL;
    END IF;
    
    -- Add encryption flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'is_encrypted') THEN
        ALTER TABLE chat_messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add updated_at for message editing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'updated_at') THEN
        ALTER TABLE chat_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add new columns to existing chat_rooms table
DO $$ 
BEGIN
    -- Add room_type column (type already exists, we'll add alias)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_rooms' AND column_name = 'room_type') THEN
        ALTER TABLE chat_rooms ADD COLUMN room_type VARCHAR(20) DEFAULT 'public';
        -- Copy existing type data to room_type
        UPDATE chat_rooms SET room_type = type WHERE room_type = 'public';
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
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_chat_messages_encrypted ON chat_messages(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);

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

-- Insert some sample enhanced rooms if they don't exist
INSERT INTO chat_rooms (id, name, description, room_type, encryption_enabled, created_by, club_id) 
SELECT 
    uuid_generate_v4(),
    'Enhanced General Chat',
    'Enhanced chat room with encryption and file sharing',
    'public',
    false,
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM clubs LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms WHERE name = 'Enhanced General Chat'
);

INSERT INTO chat_rooms (id, name, description, room_type, encryption_enabled, created_by, club_id) 
SELECT 
    uuid_generate_v4(),
    'Secure Private Room',
    'Encrypted private room for sensitive discussions',
    'private',
    true,
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM clubs LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms WHERE name = 'Secure Private Room'
);

COMMIT;
