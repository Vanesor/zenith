-- Create email_otps table for storing verification codes (simplified since users table has basic OTP fields)
CREATE TABLE IF NOT EXISTS email_otps (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'forgot_password')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email_type ON email_otps(email, type);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- Add project invitation enhancement columns to existing project_invitations table
DO $$ 
BEGIN
    -- Add project_key column for easier project access
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_invitations' AND column_name = 'project_key') THEN
        ALTER TABLE project_invitations ADD COLUMN project_key VARCHAR(32);
    END IF;
    
    -- Add access_key column for secure invitation verification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_invitations' AND column_name = 'access_key') THEN
        ALTER TABLE project_invitations ADD COLUMN access_key VARCHAR(64);
    END IF;
END $$;

-- Update existing project_invitations to have keys if they don't exist
UPDATE project_invitations 
SET project_key = encode(gen_random_bytes(16), 'hex'),
    access_key = encode(gen_random_bytes(32), 'hex')
WHERE project_key IS NULL OR access_key IS NULL;

-- Create additional indexes for project invitations
CREATE INDEX IF NOT EXISTS idx_project_invitations_keys ON project_invitations(project_key, access_key);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);

-- Clean up expired OTPs (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS void AS $$
BEGIN
    DELETE FROM email_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
