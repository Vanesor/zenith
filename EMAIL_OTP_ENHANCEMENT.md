# Email OTP Enhancement

## Overview

This enhancement updates the email OTP (One-Time Password) system in the Zenith platform to properly store hashed OTP codes in the database by changing the column type from `character` to `char(64)`.

## Issue Description

The current database schema defines the `email_otp` column in the `users` table as a simple `character` type, which can only store a single character. This is insufficient for storing secure hashed OTP codes, which require 64 characters when using SHA-256.

## Solution

1. Update the database schema to change the column type from `character` to `char(64)`.
2. Update the `TwoFactorAuthService` to ensure it properly handles the new column format.

## Implementation Details

### 1. Database Changes

The migration script `fix_email_otp_column.sql` makes the following changes:

```sql
-- Fix the email_otp column type in the users table
-- Change from single character to 64-character string for hashed OTP

-- First ensure the column exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_otp CHAR DEFAULT NULL;

-- Then update it to CHAR(64) for hash storage
ALTER TABLE users 
ALTER COLUMN email_otp TYPE CHAR(64);
```

### 2. Code Changes

The `TwoFactorAuthService.ts` file has been updated to work with the new column format. The service now:

1. Generates a 6-digit OTP code
2. Hashes it using SHA-256 (creating a 64-character hash)
3. Stores the hash in the database
4. When verifying, it hashes the user-provided code and compares it with the stored hash

## How to Apply

1. Run the database migration:

```bash
./apply-email-otp-fix.sh
```

2. The code changes have already been applied to the `TwoFactorAuthService.ts` file.

## Security Benefits

- **Increased Security**: OTP codes are now properly hashed before storage
- **Proper Data Type**: The database can now store the full hash value
- **Collision Prevention**: Using SHA-256 ensures high entropy and minimal collision risk

## Testing

After deploying these changes, test the email OTP verification flow to ensure:

1. Users can request email verification codes
2. The codes are properly sent via email
3. Users can successfully verify using the received codes
4. Invalid codes are properly rejected

## Rollback Plan

If issues arise, you can revert the column type with:

```sql
ALTER TABLE users 
ALTER COLUMN email_otp TYPE character;
```

However, this would require also reverting the code changes in `TwoFactorAuthService.ts`.
