// Test your reCAPTCHA keys
// Run this in browser console on your login page

console.log('=== reCAPTCHA Debug Info ===');
console.log('Site Key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
console.log('Current URL:', window.location.href);

// Check if reCAPTCHA is loaded
if (typeof window !== 'undefined' && window.grecaptcha) {
  console.log('✅ reCAPTCHA library is loaded');
  
  // Check site key format
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey && siteKey.startsWith('6L')) {
    console.log('✅ Site key format looks correct');
  } else {
    console.log('❌ Site key format is invalid or missing');
  }
} else {
  console.log('❌ reCAPTCHA library is not loaded');
}

// Test API endpoint
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test', captcha: null })
})
.then(response => response.json())
.then(data => console.log('API Response:', data))
.catch(error => console.log('API Error:', error));
