#!/bin/bash

# Update npm dependencies
echo "Updating dependencies..."
npm install

# Check if next-themes is installed
if ! npm list next-themes >/dev/null 2>&1; then
  echo "Installing next-themes package..."
  npm install next-themes
fi

# Check if the logos exist and are valid image files
if [ ! -s "/media/vane/Acer/temp/zenith/public/college-logo-1.png" ] || ! file "/media/vane/Acer/temp/zenith/public/college-logo-1.png" | grep -q "PNG image data"; then
  echo "Creating placeholder college logos..."
  # Copy from current directory or create empty placeholders
  if [ -f "college-logo-1.png" ]; then
    cp college-logo-1.png "/media/vane/Acer/temp/zenith/public/"
  fi
  if [ -f "college-logo-2.png" ]; then
    cp college-logo-2.png "/media/vane/Acer/temp/zenith/public/"
  fi
fi

# Create zenith logo if it doesn't exist
if [ ! -f "/media/vane/Acer/temp/zenith/public/zenith-logo.svg" ]; then
  echo "Creating placeholder Zenith logo..."
  echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#4f46e5"/><path d="M30,35 L70,35 L50,65 Z" fill="#ffffff"/></svg>' > "/media/vane/Acer/temp/zenith/public/zenith-logo.svg"
fi

# Start the development server
echo "Starting Zenith development server with new navigation..."
npm run dev
