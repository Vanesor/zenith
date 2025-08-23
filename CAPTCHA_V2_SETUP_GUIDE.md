# 🔒 CAPTCHA Setup Guide - Fix "Invalid Key Type" Error

## ❌ Current Problem
You're getting "ERROR for site owner: Invalid key type" because:
- Your current keys might be reCAPTCHA v3 keys being used in a v2 implementation
- Or the keys are not properly configured for v2 checkbox CAPTCHA

## ✅ Solution: Set Up reCAPTCHA v2 (Numbers & Pictures CAPTCHA)

### Step 1: Create NEW reCAPTCHA v2 Keys

1. **Go to Google reCAPTCHA Console**:
   ```
   https://www.google.com/recaptcha/admin/create
   ```

2. **Fill out the form**:
   - **Label**: `Zenith App v2`
   - **reCAPTCHA type**: Select **reCAPTCHA v2** ⚠️ IMPORTANT!
   - **Sub-type**: Choose **"I'm not a robot" Checkbox** ⚠️ IMPORTANT!
   
3. **Add Domains**:
   ```
   localhost
   127.0.0.1
   your-domain.com (if you have one)
   ```

4. **Submit** and get your keys:
   - **Site Key** (starts with `6L...`) - This goes in NEXT_PUBLIC_RECAPTCHA_SITE_KEY
   - **Secret Key** (starts with `6L...`) - This goes in RECAPTCHA_SECRET_KEY

### Step 2: Update Your .env.local File

Replace your current keys in `/media/vane/Movies/Projects/zenith/.env.local`:

```bash
# Google reCAPTCHA v2 Configuration - REPLACE WITH YOUR NEW KEYS
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="YOUR_NEW_SITE_KEY_HERE"
RECAPTCHA_SECRET_KEY="YOUR_NEW_SECRET_KEY_HERE"
```

### Step 3: Restart Your Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Your CAPTCHA

1. Go to `http://localhost:3000/login`
2. You should see:
   - ✅ A checkbox that says "I'm not a robot"
   - ✅ No error messages
   - ✅ When you click it, it might show image challenges (cars, traffic lights, etc.)

## 🔍 Debug Your Current Setup

Run this in your browser console on the login page to debug:

```javascript
console.log('Site Key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
console.log('reCAPTCHA loaded:', typeof window.grecaptcha !== 'undefined');
```

## 📱 What reCAPTCHA v2 Gives You

reCAPTCHA v2 "I'm not a robot" provides:
- ✅ **Checkbox**: Simple "I'm not a robot" checkbox
- ✅ **Image Challenges**: When needed, shows pictures of cars, traffic lights, crosswalks, etc.
- ✅ **Audio Challenges**: Audio option for accessibility
- ✅ **Number Challenges**: Sometimes includes numeric challenges

## 🚨 Common Mistakes to Avoid

❌ **Wrong Type**: Don't select reCAPTCHA v3 - it's invisible and score-based
❌ **Wrong Subtype**: Don't select "Invisible reCAPTCHA v2 badge"  
❌ **Missing Domains**: Make sure to add `localhost` for development
❌ **Key Mismatch**: Site key and secret key must be from the same reCAPTCHA site

## ✅ Verification Checklist

- [ ] Created new reCAPTCHA v2 site with "I'm not a robot" checkbox
- [ ] Added `localhost` and `127.0.0.1` to domains
- [ ] Copied both keys (site key and secret key)
- [ ] Updated `.env.local` with new keys
- [ ] Restarted development server
- [ ] Tested login page - checkbox appears without errors
- [ ] Can complete CAPTCHA challenge (checkbox + potential image challenge)

## 🆘 Still Having Issues?

If you're still seeing errors, try these steps:

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Check Browser Console**: Look for JavaScript errors
3. **Verify Keys**: Make sure both keys are from the same reCAPTCHA site
4. **Domain Check**: Ensure your domain is in the reCAPTCHA site settings

## 📞 Quick Fix Commands

```bash
# 1. Check your current environment
cat .env.local | grep RECAPTCHA

# 2. Restart development server
npm run dev

# 3. Test in browser console (on login page)
console.log('CAPTCHA Debug:', {
  siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  loaded: typeof window.grecaptcha !== 'undefined'
});
```

---

**🎯 Expected Result**: After following these steps, you should see a working "I'm not a robot" checkbox that may show image/number challenges when clicked!
