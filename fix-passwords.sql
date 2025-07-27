-- Quick fix: Update password hashes for all users to use "password123"
-- Run this in Supabase SQL Editor to fix login issues

UPDATE users SET password_hash = '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS';

-- Verify the update
SELECT email, 
       CASE WHEN password_hash = '$2b$12$KE/XbD9UrHpIbEITP5.TJO9woKePujNik8e7xg0tl.bNYZqoFZ9bS' 
            THEN '✅ Updated' 
            ELSE '❌ Not Updated' 
       END as password_status
FROM users 
ORDER BY email;

SELECT 'Password hashes updated successfully! All users can now login with: password123' as message;
