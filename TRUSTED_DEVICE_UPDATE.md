# Trusted Device Authentication Update

This update adds "Remember me" and "Trust this device" functionality to the authentication system to improve user experience while maintaining security.

## Key Changes

### 1. Enhanced Authentication Flow

- **Remember Me Option**: When logging in, users can now check "Remember me" to extend their session duration to 30 days instead of the default 7 days.
- **Trusted Devices**: After completing 2FA, users can choose to trust their current device to bypass 2FA for 30 days.
- **Email OTP Support**: Added support for email-based one-time passwords as an alternative 2FA method.
- **Security Events Logging**: All authentication events (login, device trust, etc.) are now logged for security auditing.

### 2. Database Changes

- Added `trusted_devices` table to store information about devices that users have marked as trusted
- Added `security_events` table for comprehensive security logging
- Updated `sessions` table with additional fields for device information
- Enhanced `users` table with email OTP fields

### 3. Technical Implementation

- **Device Recognition**: Devices are identified using cookies and device fingerprinting
- **Trust Levels**: Supports different trust levels ('login_only', 'full_access')
- **Security-First Approach**: Sensitive actions still require 2FA verification even on trusted devices

## Migration Instructions

To apply these changes:

1. Run the database migration script:

```bash
psql -U your_username -d your_database -f database/add_trusted_devices_functionality.sql
```

2. Clear existing cookies in your browser for a clean testing state

## Security Considerations

- Trusted device information expires after 30 days by default
- Users can revoke trusted devices from their security settings
- All security events are logged with IP addresses and device information
- Sensitive operations like password changes still require 2FA verification regardless of device trust status

## Testing Recommendations

1. Test login with "Remember me" unchecked vs. checked
2. Test 2FA flow with "Trust this device" option
3. Verify that trusted devices bypass 2FA on subsequent logins
4. Test revoking trusted devices
5. Ensure security logs capture all relevant events
