-- Fix the email_otp column type in the users table
-- Change from single character to 64-character string for hashed OTP

-- First ensure the column exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_otp CHAR DEFAULT NULL;

-- Then update it to CHAR(64) for hash storage
ALTER TABLE users 
ALTER COLUMN email_otp TYPE CHAR(64);
