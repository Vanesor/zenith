#!/bin/bash

# Script to test the email OTP functionality

echo "Testing email OTP functionality..."
echo "This script will send an API request to trigger an email OTP and validate it"
echo 

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it to run this script."
    exit 1
fi

# Get email from user
read -p "Enter your email address: " EMAIL

# Get password from user
read -s -p "Enter your password: " PASSWORD
echo ""

echo "Step 1: Attempting to login and trigger email OTP..."

# Login to get userId
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"requestMethod\":\"email_otp\"}")

# Check if login was successful
if echo "$LOGIN_RESPONSE" | jq -e '.requiresTwoFactor' > /dev/null; then
    echo "✅ Login successful, 2FA required"
    USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.userId')
    METHOD=$(echo "$LOGIN_RESPONSE" | jq -r '.method')
    
    echo "User ID: $USER_ID"
    echo "2FA Method: $METHOD"
    
    if [ "$METHOD" != "email_otp" ]; then
        echo "❌ Email OTP is not the selected 2FA method. Please configure email OTP in your account settings."
        exit 1
    fi
    
    # Ask for the OTP
    read -p "Enter the OTP received via email: " OTP
    
    echo "Step 2: Verifying the email OTP..."
    
    # Verify OTP
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/2fa/email-login-verify \
      -H "Content-Type: application/json" \
      -d "{\"userId\":\"$USER_ID\",\"otp\":\"$OTP\"}")
    
    # Check if verification was successful
    if echo "$VERIFY_RESPONSE" | jq -e '.token' > /dev/null; then
        echo "✅ OTP verification successful!"
        echo "✅ Email OTP functionality is working correctly"
    else
        echo "❌ OTP verification failed: $(echo "$VERIFY_RESPONSE" | jq -r '.error // "Unknown error"')"
    fi
else
    echo "❌ Login failed or 2FA not required: $(echo "$LOGIN_RESPONSE" | jq -r '.error // "Unknown error"')"
fi
