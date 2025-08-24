import db from './database';
import { LocalStorageService } from './storage';
import crypto from 'crypto';

export interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  description?: string;
  uploaded_by?: string;
  upload_context?: string;
  upload_reference_id?: string;
  is_public: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UploadOptions {
  altText?: string;
  description?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  uploadContext?: string;
  referenceId?: string;
}

export class MediaService {
  /**
   * Upload a file and create a database record
   */
  static async uploadFile(
    file: File, 
    userId: string, 
    bucket: string = 'media',
    folder: string = '',
    options: UploadOptions = {}
  ): Promise<MediaFile | null> {
    try {
      // First upload the file to local storage
      const uploadResult = await LocalStorageService.uploadFile(file, bucket, folder);
      
      if (!uploadResult) {
        console.error('Failed to upload file to storage');
        return null;
      }
      
      // Then create a database record
      const fileId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const mediaRecord = {
        id: fileId,
        filename: uploadResult.path,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_url: uploadResult.url,
        thumbnail_url: uploadResult.url, // Use same URL as thumbnail for now
        alt_text: options.altText || null,
        description: options.description || null,
        uploaded_by: userId,
        upload_context: options.uploadContext || null,
        upload_reference_id: options.referenceId || null,
        is_public: options.isPublic !== undefined ? options.isPublic : true,
        metadata: options.metadata ? JSON.stringify(options.metadata) : '{}',
        created_at: now,
        updated_at: now
      };
      
      const query = `
        INSERT INTO media_files (
          id, filename, original_filename, file_size, mime_type, file_url, 
          thumbnail_url, alt_text, description, uploaded_by, upload_context, 
          upload_reference_id, is_public, metadata, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING *
      `;
      
      const values = [
        mediaRecord.id,
        mediaRecord.filename,
        mediaRecord.original_filename,
        mediaRecord.file_size,
        mediaRecord.mime_type,
        mediaRecord.file_url,
        mediaRecord.thumbnail_url,
        mediaRecord.alt_text,
        mediaRecord.description,
        mediaRecord.uploaded_by,
        mediaRecord.upload_context,
        mediaRecord.upload_reference_id,
        mediaRecord.is_public,
        mediaRecord.metadata,
        mediaRecord.created_at,
        mediaRecord.updated_at
      ];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        console.error('Failed to create media file record');
        return null;
      }
      
      return result.rows[0] as MediaFile;
    } catch (error) {
      console.error('Error in MediaService.uploadFile:', error);
      return null;
    }
  }
  
  /**
   * Get a media file by ID
   */
  static async getMediaFileById(id: string): Promise<MediaFile | null> {
    try {
      const query = `SELECT * FROM media_files WHERE id = $1`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as MediaFile;
    } catch (error) {
      console.error('Error in MediaService.getMediaFileById:', error);
      return null;
    }
  }
  
  /**
   * Get media files by reference ID
   */
  static async getMediaFilesByReference(
    referenceId: string, 
    context?: string
  ): Promise<MediaFile[]> {
    try {
      let query = `SELECT * FROM media_files WHERE upload_reference_id = $1`;
      const params = [referenceId];
      
      if (context) {
        query += ` AND upload_context = $2`;
        params.push(context);
      }
      
      const result = await db.query(query, params);
      return result.rows as MediaFile[];
    } catch (error) {
      console.error('Error in MediaService.getMediaFilesByReference:', error);
      return [];
    }
  }
  
  /**
   * Delete a media file
   */
  static async deleteMediaFile(id: string): Promise<boolean> {
    try {
      // First get the file info
      const fileInfo = await this.getMediaFileById(id);
      
      if (!fileInfo) {
        return false;
      }
      
      // Delete from storage
      const deleted = await LocalStorageService.deleteFile(fileInfo.filename);
      
      if (!deleted) {
        console.error(`Failed to delete file from storage: ${fileInfo.filename}`);
      }
      
      // Delete from database
      const query = `DELETE FROM media_files WHERE id = $1`;
      await db.query(query, [id]);
      
      return true;
    } catch (error) {
      console.error('Error in MediaService.deleteMediaFile:', error);
      return false;
    }
  }
  
  /**
   * Update media file metadata
   */
  static async updateMediaFile(
    id: string, 
    updates: {
      alt_text?: string;
      description?: string;
      is_public?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<MediaFile | null> {
    try {
      const updateFields = [];
      const values = [id];
      let paramCounter = 2;
      
      if (updates.alt_text !== undefined) {
        updateFields.push(`alt_text = $${paramCounter++}`);
        values.push(updates.alt_text);
      }
      
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramCounter++}`);
        values.push(updates.description);
      }
      
      if (updates.is_public !== undefined) {
        updateFields.push(`is_public = $${paramCounter++}`);
        values.push(updates.is_public as unknown as string);
      }
      
      if (updates.metadata !== undefined) {
        updateFields.push(`metadata = $${paramCounter++}`);
        values.push(JSON.stringify(updates.metadata));
      }
      
      updateFields.push(`updated_at = $${paramCounter++}`);
      values.push(new Date().toISOString());
      
      if (updateFields.length === 1) {
        // Only updated_at is being updated, nothing to do
        return await this.getMediaFileById(id);
      }
      
      const query = `
        UPDATE media_files
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as MediaFile;
    } catch (error) {
      console.error('Error in MediaService.updateMediaFile:', error);
      return null;
    }
  }
  
  /**
   * Get avatar URL for a user
   */
  static async getUserAvatarUrl(userId: string): Promise<string | null> {
    try {
      // Look for the most recent avatar in media_files
      const query = `
        SELECT file_url 
        FROM media_files 
        WHERE uploaded_by = $1 
        AND upload_context = 'profiles' 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length > 0) {
        return result.rows[0].file_url;
      }
      
      // Fall back to profile_image_url in users table
      const userQuery = `
        SELECT profile_image_url 
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length > 0 && userResult.rows[0].profile_image_url) {
        return userResult.rows[0].profile_image_url;
      }
      
      return null;
    } catch (error) {
      console.error('Error in MediaService.getUserAvatarUrl:', error);
      return null;
    }
  }
  
  /**
   * Update user's avatar
   */
  static async updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users 
        SET profile_image_url = $1, updated_at = $2
        WHERE id = $3
      `;
      
      await db.query(query, [avatarUrl, new Date().toISOString(), userId]);
      return true;
    } catch (error) {
      console.error('Error in MediaService.updateUserAvatar:', error);
      return false;
    }
  }

  /**
   * Get logo URL for a club
   */
  static async getClubLogoUrl(clubId: string): Promise<string | null> {
    try {
      // Look for the most recent logo in media_files
      const query = `
        SELECT file_url 
        FROM media_files 
        WHERE upload_reference_id = $1 
        AND upload_context = 'clubs' 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await db.query(query, [clubId]);
      
      if (result.rows.length > 0) {
        return result.rows[0].file_url;
      }
      
      // Fall back to logo_url in clubs table
      const clubQuery = `
        SELECT logo_url 
        FROM clubs 
        WHERE id = $1
      `;
      
      const clubResult = await db.query(clubQuery, [clubId]);
      
      if (clubResult.rows.length > 0 && clubResult.rows[0].logo_url) {
        return clubResult.rows[0].logo_url;
      }
      
      return null;
    } catch (error) {
      console.error('Error in MediaService.getClubLogoUrl:', error);
      return null;
    }
  }
  
  /**
   * Upload club logo and update club record
   */
  static async uploadClubLogo(clubId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get the admin user (fallback uploader)
      const adminQuery = `SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
      const adminResult = await db.query(adminQuery);
      const uploaderId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;
      
      if (!uploaderId) {
        return { success: false, error: 'No admin user found as uploader' };
      }
      
      // Upload file to storage
      const uploadedFile = await this.uploadFile(
        file,
        uploaderId,
        'clubs',
        'logos',
        {
          uploadContext: 'clubs',
          referenceId: clubId,
          isPublic: true,
          altText: 'Club logo'
        }
      );
      
      if (!uploadedFile) {
        return { success: false, error: 'Failed to upload logo file' };
      }
      
      // Update club record
      const updateQuery = `
        UPDATE clubs 
        SET logo_url = $1, updated_at = NOW()
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [uploadedFile.file_url, clubId]);
      
      return { success: true, url: uploadedFile.file_url };
    } catch (error) {
      console.error('Error in MediaService.uploadClubLogo:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export default MediaService;
