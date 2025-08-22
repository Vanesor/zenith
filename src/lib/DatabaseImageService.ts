import db from './database';
import sharp from 'sharp';
import crypto from 'crypto';

export interface ImageMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  altText?: string;
  description?: string;
  isPublic: boolean;
  context: string;
  referenceId?: string;
  accessToken?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ImageUploadOptions {
  context: string;
  referenceId?: string;
  isPublic?: boolean;
  altText?: string;
  description?: string;
  expiresIn?: number; // hours
  generateThumbnail?: boolean;
  generateMedium?: boolean;
  thumbnailSize?: { width: number; height: number };
  mediumSize?: { width: number; height: number };
  quality?: {
    original?: number;
    thumbnail?: number;
    medium?: number;
  };
}

export interface ImageSizes {
  original: Buffer;
  thumbnail?: Buffer;
  medium?: Buffer;
}

export class DatabaseImageService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DEFAULT_THUMBNAIL_SIZE = { width: 150, height: 150 };
  private static readonly DEFAULT_MEDIUM_SIZE = { width: 800, height: 600 };
  
  /**
   * Upload image to database with automatic resizing
   */
  static async uploadImage(
    file: File | Buffer,
    filename: string,
    userId: string,
    options: ImageUploadOptions
  ): Promise<{ success: boolean; imageId?: string; error?: string }> {
    try {
      // Convert File to Buffer if needed
      const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
      
      // Validate file size
      if (buffer.length > this.MAX_FILE_SIZE) {
        return { success: false, error: 'File size exceeds 50MB limit' };
      }
      
      // Get image metadata using sharp
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        return { success: false, error: 'Invalid image file' };
      }
      
      // Generate different sizes
      const sizes = await this.generateImageSizes(buffer, options);
      
      // Generate access token if needed
      const accessToken = options.isPublic ? null : this.generateAccessToken();
      const expiresAt = options.expiresIn ? 
        new Date(Date.now() + options.expiresIn * 60 * 60 * 1000) : null;
      
      // Insert into database
      const result = await db.query(`
        INSERT INTO images (
          original_filename, file_size, mime_type, width, height,
          alt_text, description, image_data, thumbnail_data, medium_data,
          original_quality, thumbnail_quality, medium_quality,
          is_public, uploaded_by, context, reference_id,
          access_token, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        filename,
        buffer.length,
        metadata.format ? `image/${metadata.format}` : 'image/jpeg',
        metadata.width,
        metadata.height,
        options.altText,
        options.description,
        sizes.original,
        sizes.thumbnail,
        sizes.medium,
        options.quality?.original || 100,
        options.quality?.thumbnail || 70,
        options.quality?.medium || 85,
        options.isPublic || false,
        userId,
        options.context,
        options.referenceId,
        accessToken,
        expiresAt
      ]);
      
      return { success: true, imageId: result.rows[0].id };
    } catch (error) {
      console.error('Database image upload error:', error);
      return { success: false, error: 'Failed to upload image to database' };
    }
  }
  
  /**
   * Retrieve image data from database
   */
  static async getImage(
    imageId: string,
    size: 'original' | 'thumbnail' | 'medium' = 'original',
    accessToken?: string
  ): Promise<{ success: boolean; data?: Buffer; metadata?: ImageMetadata; error?: string }> {
    try {
      const sizeColumn = size === 'original' ? 'image_data' : 
                        size === 'thumbnail' ? 'thumbnail_data' : 'medium_data';
      
      const result = await db.query(`
        SELECT 
          id, original_filename, file_size, mime_type, width, height,
          alt_text, description, is_public, context, reference_id,
          access_token, expires_at, created_at, ${sizeColumn} as image_data
        FROM images 
        WHERE id = $1
      `, [imageId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Image not found' };
      }
      
      const image = result.rows[0];
      
      // Check access permissions
      if (!image.is_public) {
        if (!accessToken || accessToken !== image.access_token) {
          return { success: false, error: 'Access denied' };
        }
        
        // Check expiration
        if (image.expires_at && new Date(image.expires_at) < new Date()) {
          return { success: false, error: 'Access token expired' };
        }
      }
      
      // Update access statistics
      await db.query(`
        UPDATE images 
        SET last_accessed = NOW(), access_count = access_count + 1
        WHERE id = $1
      `, [imageId]);
      
      const metadata: ImageMetadata = {
        id: image.id,
        originalFilename: image.original_filename,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        width: image.width,
        height: image.height,
        altText: image.alt_text,
        description: image.description,
        isPublic: image.is_public,
        context: image.context,
        referenceId: image.reference_id,
        accessToken: image.access_token,
        expiresAt: image.expires_at,
        createdAt: image.created_at
      };
      
      return { 
        success: true, 
        data: image.image_data, 
        metadata 
      };
    } catch (error) {
      console.error('Database image retrieval error:', error);
      return { success: false, error: 'Failed to retrieve image' };
    }
  }
  
  /**
   * Delete image from database
   */
  static async deleteImage(imageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await db.query(`
        DELETE FROM images 
        WHERE id = $1 AND uploaded_by = $2
        RETURNING id
      `, [imageId, userId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Image not found or access denied' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Database image deletion error:', error);
      return { success: false, error: 'Failed to delete image' };
    }
  }
  
  /**
   * Generate different image sizes
   */
  private static async generateImageSizes(
    originalBuffer: Buffer,
    options: ImageUploadOptions
  ): Promise<ImageSizes> {
    const sizes: ImageSizes = { original: originalBuffer };
    
    try {
      // Generate thumbnail
      if (options.generateThumbnail !== false) {
        const thumbnailSize = options.thumbnailSize || this.DEFAULT_THUMBNAIL_SIZE;
        sizes.thumbnail = await sharp(originalBuffer)
          .resize(thumbnailSize.width, thumbnailSize.height, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: options.quality?.thumbnail || 70 })
          .toBuffer();
      }
      
      // Generate medium size
      if (options.generateMedium !== false) {
        const mediumSize = options.mediumSize || this.DEFAULT_MEDIUM_SIZE;
        sizes.medium = await sharp(originalBuffer)
          .resize(mediumSize.width, mediumSize.height, { 
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: options.quality?.medium || 85 })
          .toBuffer();
      }
    } catch (error) {
      console.error('Error generating image sizes:', error);
      // Continue with original only if resizing fails
    }
    
    return sizes;
  }
  
  /**
   * Generate secure access token
   */
  private static generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Get image statistics
   */
  static async getImageStats(context?: string) {
    try {
      const query = context 
        ? 'SELECT * FROM image_statistics WHERE context = $1'
        : 'SELECT * FROM image_statistics';
      
      const params = context ? [context] : [];
      const result = await db.query(query, params);
      
      return { success: true, stats: result.rows };
    } catch (error) {
      console.error('Error getting image stats:', error);
      return { success: false, error: 'Failed to get image statistics' };
    }
  }
  
  /**
   * Cleanup expired images
   */
  static async cleanupExpiredImages(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const result = await db.query('SELECT cleanup_expired_images()');
      const deletedCount = result.rows[0].cleanup_expired_images;
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up expired images:', error);
      return { success: false, error: 'Failed to cleanup expired images' };
    }
  }
  
  /**
   * List images by context or user
   */
  static async listImages(filters: {
    userId?: string;
    context?: string;
    referenceId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = `
        SELECT 
          id, original_filename, file_size, mime_type, width, height,
          alt_text, description, is_public, context, reference_id,
          created_at, access_count
        FROM images 
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;
      
      if (filters.userId) {
        query += ` AND uploaded_by = $${++paramCount}`;
        params.push(filters.userId);
      }
      
      if (filters.context) {
        query += ` AND context = $${++paramCount}`;
        params.push(filters.context);
      }
      
      if (filters.referenceId) {
        query += ` AND reference_id = $${++paramCount}`;
        params.push(filters.referenceId);
      }
      
      if (filters.isPublic !== undefined) {
        query += ` AND is_public = $${++paramCount}`;
        params.push(filters.isPublic);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`;
        params.push(filters.limit);
      }
      
      if (filters.offset) {
        query += ` OFFSET $${++paramCount}`;
        params.push(filters.offset);
      }
      
      const result = await db.query(query, params);
      
      return { success: true, images: result.rows };
    } catch (error) {
      console.error('Error listing images:', error);
      return { success: false, error: 'Failed to list images' };
    }
  }
}
