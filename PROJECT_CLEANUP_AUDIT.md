# Zenith Project Image Upload & File Management Audit

## Current State Analysis

### ✅ What's Working Well
1. **MediaService Integration**: New centralized service for file management
2. **Basic Upload Endpoints**: Avatar and club logo uploads are implemented
3. **Database Integration**: `media_files` table properly tracks uploads
4. **Route Parameter Standardization**: Fixed inconsistent naming

### ❌ Issues Found

#### 1. **Missing Image Upload Support**
- **Submissions**: No file attachment support for assignment submissions
- **Posts**: Missing post image/attachment upload functionality
- **Chat Images**: ChatImageUpload component exists but uses old `uploadImageToStorage` method

#### 2. **Inconsistent Implementation**
- Some endpoints use `MediaService` (modern)
- Some endpoints use `LocalStorageService` directly (legacy)
- Chat image upload uses different utility function

#### 3. **Redundant Files**
- Multiple auth files: `auth-unified.ts`, `authUtils.ts`, `auth-options.ts`
- `useImageUpload.ts` hook points to non-existent `/api/upload/images` endpoint
- `DatabaseImageService.ts` - unused database storage approach
- `imageUtils.ts` has `uploadImageToStorage` function pointing to `/api/upload`

#### 4. **Broken/Missing Endpoints**
- `/api/upload/images` - referenced in useImageUpload but doesn't exist
- Assignment question images use LocalStorageService directly
- Event images use LocalStorageService directly
- Chat attachments use MediaService but component uses old method

## Cleanup & Enhancement Plan

### Phase 1: Standardize Upload Endpoints (High Priority)

1. **Create Submissions Upload Endpoint**
   - `/api/assignments/[id]/submissions/[submissionId]/upload-file`
   - Support multiple file types (images, PDFs, documents)

2. **Create Posts Upload Endpoint**
   - `/api/posts/upload-attachment`
   - Support images and file attachments

3. **Fix Chat Image Upload**
   - Update ChatImageUpload component to use MediaService
   - Create `/api/chat/upload-image` endpoint (separate from attachments)

4. **Consolidate Assignment/Event Image Uploads**
   - Update to use MediaService instead of LocalStorageService directly

### Phase 2: Clean Up Redundant Files (Medium Priority)

1. **Auth Files Consolidation**
   - Keep `auth-unified.ts` (most comprehensive)
   - Remove `authUtils.ts` (functionality moved to unified)
   - Keep `auth-options.ts` if used by NextAuth

2. **Image Utilities Cleanup**
   - Remove unused `DatabaseImageService.ts`
   - Update `imageUtils.ts` to remove `uploadImageToStorage`
   - Fix `useImageUpload.ts` to point to correct endpoints

### Phase 3: Database Schema Updates (Low Priority)

1. **Add Missing Tables**
   - `submission_attachments` - link submissions to media files
   - `post_attachments` - link posts to media files
   - Update existing chat_attachments table structure

### Implementation Priority

**Immediate (This Session)**:
1. Create missing submission upload endpoint
2. Fix chat image upload functionality
3. Remove redundant auth files

**Next Session**:
1. Create posts attachment endpoint
2. Standardize all uploads to use MediaService
3. Update useImageUpload hook

## File Cleanup List

### Files to Remove:
- `src/lib/authUtils.ts` (merge into auth-unified)
- `src/lib/DatabaseImageService.ts` (unused database storage)

### Files to Update:
- `src/lib/imageUtils.ts` (remove uploadImageToStorage)
- `src/hooks/useImageUpload.ts` (fix endpoint URLs)
- `src/components/chat/ChatImageUpload.tsx` (use MediaService)
- `src/app/api/events/upload-image/route.ts` (use MediaService)
- `src/app/api/assignments/upload-question-image/route.ts` (use MediaService)
