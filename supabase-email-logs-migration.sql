-- Migration to enhance email_logs table for better email service functionality
-- Execute this in your Supabase SQL Editor

-- Add new columns to email_logs table
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS email_service VARCHAR(50) DEFAULT 'resend';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_service ON email_logs(email_service);

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_logs_updated_at ON email_logs;
CREATE TRIGGER trigger_update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- Update existing records to have email_service as 'gmail' (since they were likely sent via Gmail)
UPDATE email_logs SET email_service = 'gmail' WHERE email_service IS NULL;

-- Add comments to the table and columns for documentation
COMMENT ON TABLE email_logs IS 'Logs all email communications sent from the Zenith platform';
COMMENT ON COLUMN email_logs.recipient IS 'Email address of the recipient';
COMMENT ON COLUMN email_logs.subject IS 'Email subject line';
COMMENT ON COLUMN email_logs.content_preview IS 'Preview or summary of email content';
COMMENT ON COLUMN email_logs.status IS 'Delivery status: sent, failed, bounced, etc.';
COMMENT ON COLUMN email_logs.message_id IS 'Unique message ID from email service provider';
COMMENT ON COLUMN email_logs.category IS 'Email category: authentication, onboarding, assignment, etc.';
COMMENT ON COLUMN email_logs.related_id IS 'Reference ID to related entity (user, assignment, etc.)';
COMMENT ON COLUMN email_logs.email_service IS 'Email service used: resend, gmail, etc.';
COMMENT ON COLUMN email_logs.error_message IS 'Error message if email failed to send';

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
