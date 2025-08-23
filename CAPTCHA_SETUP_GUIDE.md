# 🔒 Google reCAPTCHA Setup Guide for Zenith

This guide will walk you through setting up Google reCAPTCHA v2 for the Zenith authentication system.

## 📋 Prerequisites

- Google account
- Access to your project's environment variables
- Basic understanding of environment configuration

## 🚀 Quick Setup Steps

### 1. Create reCAPTCHA Keys

1. **Visit Google reCAPTCHA Console**
   - Go to: https://www.google.com/recaptcha/admin/create
   - Login with your Google account

2. **Create a New Site**
   - **Label**: Enter a name like "Zenith App" or your project name
   - **reCAPTCHA type**: Select **reCAPTCHA v2**
   - **Sub type**: Choose **"I'm not a robot" Checkbox**

3. **Add Domains**
   - **Domains**: Add your domains:
     ```
     localhost          (for development)
     127.0.0.1         (for development)
     yourdomain.com    (for production)
     ```

4. **Accept Terms**
   - Check "Accept the reCAPTCHA Terms of Service"
   - Click **Submit**

5. **Get Your Keys**
   - Copy the **Site Key** (starts with `6L...`)
   - Copy the **Secret Key** (starts with `6L...`)

### 2. Configure Environment Variables

1. **Open/Create `.env.local`** in your project root:
   ```bash
   # Create the file if it doesn't exist
   touch .env.local
   ```

2. **Add reCAPTCHA Configuration**:
   ```env
   # Google reCAPTCHA v2 Configuration
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   RECAPTCHA_SECRET_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **Replace the placeholder keys with your actual keys from step 1.**

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### 3. Verify Implementation

The following components already have reCAPTCHA integrated:

- ✅ **Login Page** (`/login`)
- ✅ **Register Page** (`/register`)  
- ✅ **Global Auth Modal** (triggered from any page)

### 4. Test Your Implementation

1. **Development Testing**:
   - Visit `http://localhost:3000/login`
   - Try logging in - you should see the reCAPTCHA checkbox
   - Complete the CAPTCHA and submit

2. **Verify Backend**:
   - Check your browser's Network tab
   - Successful requests should return without CAPTCHA errors

## 🔧 Advanced Configuration

### Environment Files by Stage

**Development** (`.env.local`):
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6L_development_site_key_here
RECAPTCHA_SECRET_KEY=6L_development_secret_key_here
```

**Production** (`.env.production` or your hosting platform):
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6L_production_site_key_here  
RECAPTCHA_SECRET_KEY=6L_production_secret_key_here
```

### Security Best Practices

1. **Never Commit Keys**:
   ```bash
   # Make sure .env.local is in .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use Different Keys for Different Environments**:
   - Create separate reCAPTCHA sites for development and production
   - Use appropriate domain restrictions

3. **Validate on Server**:
   - The backend already validates CAPTCHA tokens
   - Never trust frontend-only validation

## 🐛 Troubleshooting

### Common Issues

**1. "Invalid site key" Error**
- ✅ Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is correct
- ✅ Verify domain is added to reCAPTCHA console
- ✅ Restart development server after changing `.env.local`

**2. "CAPTCHA verification failed" Error**
- ✅ Check that `RECAPTCHA_SECRET_KEY` is correct in backend
- ✅ Ensure the secret key matches the site key

**3. CAPTCHA Not Showing**
- ✅ Check browser console for JavaScript errors
- ✅ Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
- ✅ Check if browser is blocking third-party scripts

**4. "localhost is not in the list of supported domains"**
- ✅ Add `localhost` and `127.0.0.1` to domains in reCAPTCHA console

### Debug Commands

**Check Environment Variables**:
```bash
# In your terminal (don't commit this!)
echo $NEXT_PUBLIC_RECAPTCHA_SITE_KEY
```

**Test in Browser Console**:
```javascript
// Check if keys are loaded
console.log(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
```

## 📁 File Structure

Your reCAPTCHA implementation includes these files:

```
├── src/
│   ├── app/
│   │   ├── api/auth/
│   │   │   ├── login/route.ts      ✅ CAPTCHA verification
│   │   │   └── register/route.ts   ✅ CAPTCHA verification
│   │   ├── login/page.tsx          ✅ CAPTCHA integration
│   │   └── register/page.tsx       ✅ CAPTCHA integration
│   ├── components/
│   │   └── GlobalAuthModal.tsx     ✅ CAPTCHA integration
│   └── lib/
│       └── captcha.ts              ✅ Verification utility
├── .env.local                      🔑 Your keys here
└── CAPTCHA_SETUP_GUIDE.md         📖 This guide
```

## 🔄 Migration to Production

When deploying to production:

1. **Create Production reCAPTCHA Site**
2. **Update Environment Variables** on your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables  
   - Heroku: Config Vars in dashboard

3. **Test Production Deployment**

## 💡 Tips

- **Test with Different Browsers**: Some browsers block third-party cookies
- **Mobile Testing**: Verify reCAPTCHA works on mobile devices
- **Accessibility**: reCAPTCHA v2 is more accessible than v3
- **Rate Limiting**: Consider implementing additional rate limiting for auth endpoints

---

## ✅ Quick Verification Checklist

- [ ] reCAPTCHA site created on Google Console
- [ ] Site key added to `.env.local` as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] Secret key added to `.env.local` as `RECAPTCHA_SECRET_KEY`
- [ ] Development server restarted
- [ ] Login page shows reCAPTCHA checkbox
- [ ] Register page shows reCAPTCHA checkbox
- [ ] CAPTCHA validation works end-to-end
- [ ] `.env.local` added to `.gitignore`

**🎉 If all items are checked, your reCAPTCHA is properly configured!**
