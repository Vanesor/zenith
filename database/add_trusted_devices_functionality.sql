-- Add functionality for trusted devices and session management
-- This builds on the existing 2FA setup

-- 1. Add trusted devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_identifier VARCHAR NOT NULL,
  device_name VARCHAR NOT NULL,
  device_type VARCHAR, -- mobile, desktop, tablet, etc
  browser VARCHAR,
  os VARCHAR,
  ip_address VARCHAR,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  trust_level VARCHAR DEFAULT 'login_only', -- login_only, full_access, etc
  UNIQUE(user_id, device_identifier)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires ON trusted_devices(expires_at);

-- 2. Update sessions table to include device trust info
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT FALSE;

-- 3. Create a security events table for auditing
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL, -- login, logout, 2fa_setup, password_change, etc
  ip_address VARCHAR,
  device_info JSONB DEFAULT '{}'::jsonb,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- 4. Add any missing email OTP columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_otp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp VARCHAR,
ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_otp_last_used TIMESTAMP WITH TIME ZONE;

-- Add appropriate comments
COMMENT ON TABLE trusted_devices IS 'Stores information about devices that users have marked as trusted for bypassing 2FA';
COMMENT ON TABLE security_events IS 'Logs security-related events for audit purposes';
COMMENT ON COLUMN users.email_otp_enabled IS 'Whether email-based OTP is enabled as a 2FA method';
COMMENT ON COLUMN sessions.is_trusted IS 'Whether this session is from a trusted device';
