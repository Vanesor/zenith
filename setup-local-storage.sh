#!/bin/bash

# This script checks and creates required directories for image storage

# Storage paths for different media types
UPLOADS_DIR="./public/uploads"
PROFILES_DIR="$UPLOADS_DIR/profiles"
CLUBS_DIR="$UPLOADS_DIR/clubs"
CLUBS_LOGOS_DIR="$CLUBS_DIR/logos"
EVENTS_DIR="$UPLOADS_DIR/events"
POSTS_DIR="$UPLOADS_DIR/posts"
SUBMISSIONS_DIR="$UPLOADS_DIR/submissions"

# Create necessary directories
echo "Creating local storage directories for media files..."

if [ ! -d "$UPLOADS_DIR" ]; then
  mkdir -p "$UPLOADS_DIR"
  echo "Created main uploads directory: $UPLOADS_DIR"
fi

if [ ! -d "$PROFILES_DIR" ]; then
  mkdir -p "$PROFILES_DIR"
  echo "Created profiles directory: $PROFILES_DIR"
fi

if [ ! -d "$CLUBS_DIR" ]; then
  mkdir -p "$CLUBS_DIR"
  echo "Created clubs directory: $CLUBS_DIR"
fi

if [ ! -d "$CLUBS_LOGOS_DIR" ]; then
  mkdir -p "$CLUBS_LOGOS_DIR"
  echo "Created clubs logos directory: $CLUBS_LOGOS_DIR"
fi

if [ ! -d "$EVENTS_DIR" ]; then
  mkdir -p "$EVENTS_DIR"
  echo "Created events directory: $EVENTS_DIR"
fi

if [ ! -d "$POSTS_DIR" ]; then
  mkdir -p "$POSTS_DIR"
  echo "Created posts directory: $POSTS_DIR"
fi

if [ ! -d "$SUBMISSIONS_DIR" ]; then
  mkdir -p "$SUBMISSIONS_DIR"
  echo "Created submissions directory: $SUBMISSIONS_DIR"
fi

# Create default images
if [ ! -f "$PROFILES_DIR/default-avatar.png" ]; then
  echo "Default avatar not found. Remember to create a default avatar at $PROFILES_DIR/default-avatar.png"
fi

if [ ! -f "$CLUBS_LOGOS_DIR/default-logo.png" ]; then
  echo "Default club logo not found. Remember to create a default club logo at $CLUBS_LOGOS_DIR/default-logo.png"
fi

# Set proper permissions
chmod -R 755 "$UPLOADS_DIR"

echo "Storage directories setup complete!"
echo "You may need to create default images for fallbacks."
