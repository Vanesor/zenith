import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class LocalStorageService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
  private static readonly BASE_URL = '/uploads';

  // Ensure upload directory exists
  private static ensureUploadDir(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  // Generate unique filename
  private static generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${nameWithoutExt}_${timestamp}_${random}${ext}`;
  }

  // Upload file
  static async uploadFile(
    file: File,
    bucket: string = 'general',
    folder: string = ''
  ): Promise<{ url: string; path: string } | null> {
    try {
      this.ensureUploadDir();

      // Create bucket directory
      const bucketDir = path.join(this.UPLOAD_DIR, bucket);
      if (!fs.existsSync(bucketDir)) {
        fs.mkdirSync(bucketDir, { recursive: true });
      }

      // Create folder directory if specified
      let targetDir = bucketDir;
      if (folder) {
        targetDir = path.join(bucketDir, folder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      // Generate unique filename
      const fileName = this.generateFileName(file.name);
      const filePath = path.join(targetDir, fileName);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Write file
      fs.writeFileSync(filePath, buffer);

      // Return public URL
      const relativePath = path.relative(this.UPLOAD_DIR, filePath);
      const url = `${this.BASE_URL}/${relativePath.replace(/\\/g, '/')}`;

      return {
        url,
        path: relativePath
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  // Upload from buffer
  static async uploadFromBuffer(
    buffer: Buffer,
    fileName: string,
    bucket: string = 'general',
    folder: string = ''
  ): Promise<{ url: string; path: string } | null> {
    try {
      this.ensureUploadDir();

      // Create bucket directory
      const bucketDir = path.join(this.UPLOAD_DIR, bucket);
      if (!fs.existsSync(bucketDir)) {
        fs.mkdirSync(bucketDir, { recursive: true });
      }

      // Create folder directory if specified
      let targetDir = bucketDir;
      if (folder) {
        targetDir = path.join(bucketDir, folder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      // Generate unique filename
      const uniqueFileName = this.generateFileName(fileName);
      const filePath = path.join(targetDir, uniqueFileName);

      // Write file
      fs.writeFileSync(filePath, buffer);

      // Return public URL
      const relativePath = path.relative(this.UPLOAD_DIR, filePath);
      const url = `${this.BASE_URL}/${relativePath.replace(/\\/g, '/')}`;

      return {
        url,
        path: relativePath
      };

    } catch (error) {
      console.error('Error uploading buffer:', error);
      return null;
    }
  }

  // Delete file
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.UPLOAD_DIR, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file info
  static async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    modified?: Date;
  }> {
    try {
      const fullPath = path.join(this.UPLOAD_DIR, filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        };
      }
      return { exists: false };
    } catch (error) {
      console.error('Error getting file info:', error);
      return { exists: false };
    }
  }

  // List files in bucket/folder
  static async listFiles(bucket: string = 'general', folder: string = ''): Promise<string[]> {
    try {
      let targetDir = path.join(this.UPLOAD_DIR, bucket);
      if (folder) {
        targetDir = path.join(targetDir, folder);
      }

      if (!fs.existsSync(targetDir)) {
        return [];
      }

      const files = fs.readdirSync(targetDir, { withFileTypes: true });
      return files
        .filter(file => file.isFile())
        .map(file => file.name);

    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  // Create signed URL (for local storage, just return the public URL)
  static async createSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const fullPath = path.join(this.UPLOAD_DIR, filePath);
      if (fs.existsSync(fullPath)) {
        return `${this.BASE_URL}/${filePath.replace(/\\/g, '/')}`;
      }
      return null;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }
}

// Compatibility aliases for existing code
export const SupabaseStorageService = LocalStorageService;
export default LocalStorageService;
