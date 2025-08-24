# Zenith Platform - Email Configuration Guide

## Nodemailer Email Setup

The email system has been converted from Resend to nodemailer. To configure email functionality:

1. **Create a `.env.local` file** in your project root with the following variables:

```env
# Email Configuration for Gmail SMTP
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

2. **For Gmail Setup:**
   - Go to your Gmail account settings
   - Enable 2-Factor Authentication
   - Generate an "App Password" for your application
   - Use this app password (not your regular password) in EMAIL_PASSWORD

3. **For Other SMTP Providers:**
   - Update EMAIL_HOST to your provider's SMTP server
   - Update EMAIL_PORT (usually 587 or 465)
   - Set EMAIL_SECURE to "true" if using port 465
   - Update EMAIL_USER and EMAIL_PASSWORD accordingly

4. **Common SMTP Providers:**
   - **Gmail**: smtp.gmail.com:587
   - **Outlook**: smtp-mail.outlook.com:587
   - **Yahoo**: smtp.mail.yahoo.com:587
   - **Custom**: Contact your hosting provider

## Features Available:

✅ **Email Verification**: Automatic OTP sent on registration
✅ **Login Verification**: Blocks unverified users, sends new OTP
✅ **Password Reset**: Forgot password with OTP verification
✅ **Project Invitations**: Email invites with project keys
✅ **Assignment Notifications**: Email alerts for new assignments

## Testing:

After configuring your environment variables, restart your development server:

```bash
npm run dev
```

The email system will automatically use nodemailer for all email operations.
