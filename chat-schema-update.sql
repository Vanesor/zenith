-- Update chat_rooms table to add profile picture and remove private type
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_by UUID;

-- Update chat_messages table for better edit functionality  
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_by UUID,
ADD COLUMN IF NOT EXISTS can_edit_until TIMESTAMP WITH TIME ZONE;

-- Add constraints to prevent private rooms
ALTER TABLE chat_rooms 
ADD CONSTRAINT chat_room_type_check 
CHECK (type IN ('public', 'club'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_edited_at ON chat_messages(edited_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_can_edit_until ON chat_messages(can_edit_until);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_profile_picture ON chat_rooms(profile_picture_url);

-- Add foreign key for edited_by
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_edited_by 
FOREIGN KEY (edited_by) REFERENCES users(id);

ALTER TABLE chat_rooms 
ADD CONSTRAINT fk_chat_rooms_edited_by 
FOREIGN KEY (edited_by) REFERENCES users(id);
