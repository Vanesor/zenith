-- Script to create an email logs table for tracking all sent emails

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content_preview TEXT,
  status VARCHAR DEFAULT 'sent',
  message_id VARCHAR,
  category VARCHAR, -- assignment, event, verification, etc.
  related_id UUID, -- ID of the related entity (assignment, event, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON email_logs(category);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Update EmailService database logging
COMMENT ON TABLE email_logs IS 'Stores logs of all emails sent through the application';
