# Local Image Storage Implementation

This document outlines the migration from Supabase storage to local file storage for handling images in the Zenith application.

## Overview

The application now uses a local file storage system for all media files, including:
- User profile avatars
- Club logos
- Event images
- Post attachments
- Submission files

## Key Components

### 1. MediaService

The `MediaService` class in `/src/lib/MediaService.ts` provides methods for:
- Uploading files
- Retrieving file URLs
- Managing file metadata
- Handling user avatars and club logos

### 2. Storage Structure

Files are stored in the following directory structure:
```
/public/uploads/
  ├── profiles/      # User avatars
  ├── clubs/
  │   └── logos/     # Club logos
  ├── events/        # Event images
  ├── posts/         # Post attachments
  └── submissions/   # Submission files
```

### 3. Database Integration

The `media_files` table tracks all uploaded files with metadata.

### 4. API Endpoints

Updated API endpoints for image operations:
- `/api/profile/upload-avatar` - Upload user avatar
- `/api/clubs/[clubId]/upload-logo` - Upload club logo

### 5. Component Updates

UI components have been updated to use the new storage system:
- `UserAvatar.tsx` - Display user avatars with fallback
- `ClubLogo.tsx` - Display club logos with fallback

## Setup Instructions

1. Run the setup script to create necessary directories:
   ```bash
   ./setup-local-storage.sh
   ```

2. Run the database migration script if needed:
   ```bash
   psql -d your_database_name -f media-files-migration.sql
   ```

3. Create default fallback images:
   - `/public/uploads/profiles/default-avatar.png`
   - `/public/uploads/clubs/logos/default-logo.png`

## Route Parameter Standardization

As part of this update, we've standardized dynamic route parameters for consistency:
- User routes use `[userId]` instead of `[id]`
- Club routes use `[clubId]` instead of `[id]`

This standardization prevents Next.js route conflicts with the error:
> "You cannot use different slug names for the same dynamic path"
