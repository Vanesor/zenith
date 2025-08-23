/**
 * CAPTCHA verification utility
 * This module handles the verification of Google reCAPTCHA tokens
 */
export async function verifyCaptcha(token: string | null): Promise<boolean> {
  // If no token is provided, verification fails
  if (!token) return false;

  try {
    // Get the secret key from environment variables
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // Ensure we have a secret key configured
    if (!secretKey) {
      console.error('reCAPTCHA secret key is not configured');
      return false;
    }

    // Make a request to the Google reCAPTCHA API
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();
    
    // Log verification result for debugging (consider removing in production)
    console.log('CAPTCHA verification result:', data);
    
    // Return true if verification was successful
    return data.success === true;
  } catch (error) {
    console.error('Error verifying CAPTCHA token:', error);
    return false;
  }
}
