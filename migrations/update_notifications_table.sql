-- Update notifications table to support email delivery and coordinator tracking
-- Run this migration to add new columns for enhanced notification functionality

-- Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS sent_by VARCHAR(255), -- ID of the coordinator who sent the notification
ADD COLUMN IF NOT EXISTS club_id VARCHAR(255), -- Club associated with the notification
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE, -- Track if email was successfully sent
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP, -- When email was sent
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'in-app' NOT NULL; -- Delivery method

-- Update existing records to have delivery_method
UPDATE notifications 
SET delivery_method = 'in-app' 
WHERE delivery_method IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_sent_by ON notifications(sent_by);
CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_method ON notifications(delivery_method);
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent ON notifications(email_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read);

-- Add foreign key constraints (uncomment if you want strict referential integrity)
-- ALTER TABLE notifications 
-- ADD CONSTRAINT fk_notifications_sent_by 
-- FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL;

-- ALTER TABLE notifications 
-- ADD CONSTRAINT fk_notifications_club_id 
-- FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL;

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    sent_by,
    club_id,
    type,
    delivery_method,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN read = true THEN 1 END) as total_read,
    COUNT(CASE WHEN email_sent = true THEN 1 END) as emails_sent,
    MIN(created_at) as first_sent,
    MAX(created_at) as last_sent
FROM notifications 
WHERE sent_by IS NOT NULL
GROUP BY sent_by, club_id, type, delivery_method;

-- Create function to automatically set email_sent_at when email_sent is updated
CREATE OR REPLACE FUNCTION update_email_sent_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_sent = TRUE AND (OLD.email_sent IS NULL OR OLD.email_sent = FALSE) THEN
        NEW.email_sent_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the above function
DROP TRIGGER IF EXISTS trigger_update_email_sent_at ON notifications;
CREATE TRIGGER trigger_update_email_sent_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_email_sent_at();

-- Create a function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 90 days that are read
    DELETE FROM notifications 
    WHERE read = TRUE 
    AND created_at < NOW() - INTERVAL '90 days';
    
    -- Delete notifications older than 180 days regardless of read status
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;
