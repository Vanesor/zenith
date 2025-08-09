-- Comprehensive 2FA system fixes and improvements

-- 1. Add missing columns for email OTP authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_otp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_secret VARCHAR,
ADD COLUMN IF NOT EXISTS email_otp_backup_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email_otp_last_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_otp_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_otp CHAR(64), -- For storing hashed OTP
ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Add trusted devices functionality
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

-- 3. Update sessions table to include more device info
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_2fa BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS has_completed_2fa BOOLEAN DEFAULT FALSE;

-- 4. Create a security events table for auditing
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