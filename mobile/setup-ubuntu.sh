#!/bin/bash

# React Native setup script for Ubuntu
# Run this script to set up React Native development environment

echo "Setting up React Native development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Install React Native CLI globally
echo "Installing React Native CLI..."
npm install -g @react-native-community/cli

# Install Android development dependencies
echo "Installing Android development dependencies..."
sudo apt-get update
sudo apt-get install -y openjdk-11-jdk

# Set JAVA_HOME
echo "Setting JAVA_HOME..."
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc

# Download Android SDK Command Line Tools
echo "Setting up Android SDK..."
mkdir -p ~/Android/Sdk/cmdline-tools
cd ~/Android/Sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest

# Set Android environment variables
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc

# Reload bash profile
source ~/.bashrc

# Accept Android licenses
echo "Accepting Android licenses..."
yes | sdkmanager --licenses

# Install required Android packages
echo "Installing Android packages..."
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Create React Native project in mobile directory
echo "Creating React Native project..."
cd ../../../mobile
npx react-native init ForumClubMobile --template react-native-template-typescript

echo "React Native setup complete!"
echo "Next steps:"
echo "1. Start an Android emulator or connect a physical device"
echo "2. cd mobile/ForumClubMobile"
echo "3. npm run android"
