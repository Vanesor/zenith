-- Add email_logs table for tracking email delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed, bounced
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category VARCHAR(100), -- authentication, onboarding, assignment, etc.
  related_id VARCHAR(255), -- token, assignment id, etc.
  error_message TEXT,
  email_service VARCHAR(50) DEFAULT 'resend', -- resend, gmail, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON email_logs(category);

-- Add trigger to update updated_at
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
