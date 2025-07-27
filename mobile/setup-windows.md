# React Native Setup for Windows

# Prerequisites for React Native on Windows

# This guide will help you set up React Native development on Windows

## 1. Install Node.js

# Download and install Node.js from https://nodejs.org/

# Choose the LTS version

## 2. Install React Native CLI

npm install -g @react-native-community/cli

## 3. Install Android Studio

# Download Android Studio from https://developer.android.com/studio

# During installation, make sure to select:

# - Android SDK

# - Android SDK Platform

# - Android Virtual Device

## 4. Configure Android SDK

# Open Android Studio and go to Settings > Appearance & Behavior > System Settings > Android SDK

# Install the following:

# - Android 13 (API Level 33)

# - Android SDK Build-Tools

# - Android SDK Platform-Tools

## 5. Set Environment Variables

# Add the following to your System Environment Variables:

# ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk

#

# Add to PATH:

# %ANDROID_HOME%\platform-tools

# %ANDROID_HOME%\emulator

# %ANDROID_HOME%\tools

# %ANDROID_HOME%\tools\bin

## 6. Create React Native Project

# Open Command Prompt in the mobile directory and run:

# npx react-native init ForumClubMobile --template react-native-template-typescript

## 7. Run the Project

# cd ForumClubMobile

# npm run android

## Additional Notes:

# - Make sure to enable Developer Options and USB Debugging on your Android device

# - Or create an Android Virtual Device (AVD) in Android Studio

# - For best performance, use a physical device for testing
