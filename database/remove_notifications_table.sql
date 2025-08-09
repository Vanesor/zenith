-- Script to remove in-app notifications table and modify users table

-- First, drop columns from other tables that reference notifications
ALTER TABLE events DROP COLUMN IF EXISTS notification_sent;
ALTER TABLE events DROP COLUMN IF EXISTS notification_sent_at;

ALTER TABLE assignments DROP COLUMN IF EXISTS notification_sent;
ALTER TABLE assignments DROP COLUMN IF EXISTS notification_sent_at;

-- Drop the notifications table
DROP TABLE IF EXISTS notifications;

-- Update user preferences schema to remove in-app notification preferences
-- Keep only email notification preferences
UPDATE users 
SET notification_preferences = jsonb_build_object(
  'email', jsonb_extract_path(notification_preferences, 'email')
)
WHERE notification_preferences IS NOT NULL;
