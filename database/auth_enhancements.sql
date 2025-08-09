-- Add columns for email verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_expires_at TIMESTAMP;

-- Add columns for password reset
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMP;

-- Add columns for OAuth authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50); -- 'google', 'github', etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255); -- External ID from the provider
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_data JSONB; -- Additional data from the provider
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT TRUE; -- Track if the user has set a password

-- Add columns for 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_temp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_temp_secret_created_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_recovery_codes JSONB;

-- Add columns for notification preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": {
    "assignments": true,
    "events": true,
    "discussions": true,
    "results": true
  }
}'::jsonb;
