-- notifications.sql
-- Create a notifications table for in-app and email notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'comment', 'mention', 'system', etc.
    title TEXT,
    message TEXT NOT NULL,
    link TEXT, -- optional: link to the related resource
    is_read BOOLEAN DEFAULT FALSE,
    delivery_method VARCHAR(20) DEFAULT 'in-app', -- 'in-app', 'email', or both
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
