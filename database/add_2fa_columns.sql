-- Add 2FA email OTP columns to users table

-- Add columns for email OTP based two-factor authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_otp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_otp_secret VARCHAR,
ADD COLUMN IF NOT EXISTS email_otp_backup_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email_otp_last_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_otp_created_at TIMESTAMP WITH TIME ZONE;

-- Comment on the new columns
COMMENT ON COLUMN users.email_otp_enabled IS 'Flag indicating if email OTP 2FA is enabled for this user';
COMMENT ON COLUMN users.email_otp_verified IS 'Flag indicating if email OTP 2FA has been verified';
COMMENT ON COLUMN users.email_otp_secret IS 'Secret used for email OTP generation';
COMMENT ON COLUMN users.email_otp_backup_codes IS 'Backup codes for email OTP 2FA';
COMMENT ON COLUMN users.email_otp_last_used IS 'Timestamp when email OTP was last used';
COMMENT ON COLUMN users.email_otp_created_at IS 'Timestamp when email OTP was set up';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email_otp_enabled ON users(email_otp_enabled) WHERE email_otp_enabled = TRUE;
