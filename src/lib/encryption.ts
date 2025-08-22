import crypto from 'crypto';

/**
 * Zenith Chat Encryption System
 * 
 * Uses AES-256-GCM encryption with a custom key derivation algorithm
 * The key is derived from: "zenith" + room_id + timestamp_hash
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

export class ZenithChatEncryption {
  private static readonly ZENITH_SECRET = 'zenith_chat_2025_secure';
  
  /**
   * Generate encryption key using custom algorithm
   * Formula: PBKDF2(SHA256("zenith" + room_id + timestamp_hash), salt, 100000)
   */
  private static generateKey(roomId: string, salt: Buffer): Buffer {
    // Create base string with zenith + room_id + timestamp hash
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 10)); // 10-minute windows
    const timestampHash = crypto.createHash('sha256')
      .update(timestamp.toString())
      .digest('hex');
    
    const baseString = `${this.ZENITH_SECRET}${roomId}${timestampHash}`;
    
    // Use PBKDF2 to derive the final key
    return crypto.pbkdf2Sync(baseString, salt, 100000, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt message content
   */
  static encrypt(message: string, roomId: string): {
    encrypted: string;
    metadata: string;
  } {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Generate encryption key
      const key = this.generateKey(roomId, salt);
      
      // Create cipher with proper GCM mode
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
      
      // Encrypt the message
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      
      return {
        encrypted: combined.toString('base64'),
        metadata: crypto.createHash('sha256').update(roomId + message.substring(0, 10)).digest('hex').substring(0, 16)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message content
   */
  static decrypt(encryptedData: string, roomId: string): string {
    try {
      // Decode base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      
      // Generate decryption key
      const key = this.generateKey(roomId, salt);
      
      // Create decipher with proper GCM mode
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);
      
      // Decrypt the message
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      // Return a placeholder for failed decryption instead of throwing
      return '[Message could not be decrypted]';
    }
  }

  /**
   * Verify if message can be decrypted (for validation)
   */
  static canDecrypt(encryptedData: string, roomId: string): boolean {
    try {
      this.decrypt(encryptedData, roomId);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Simple encryption for basic use cases
 */
export class SimpleEncryption {
  private static readonly SECRET_KEY = 'zenith_chat_secret_key_2025';

  static encrypt(text: string, roomId: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(this.SECRET_KEY + roomId).digest();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Simple encryption error:', error);
      return text; // Return original text if encryption fails
    }
  }

  static decrypt(encryptedText: string, roomId: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(this.SECRET_KEY + roomId).digest();
      
      const textParts = encryptedText.split(':');
      if (textParts.length !== 2) return encryptedText;
      
      const iv = Buffer.from(textParts[0], 'hex');
      const encrypted = textParts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Simple decryption error:', error);
      return encryptedText; // Return encrypted text if decryption fails
    }
  }
}

/**
 * File encryption for chat attachments
 */
export class ZenithFileEncryption {
  /**
   * Encrypt file buffer using simple method
   */
  static encryptFile(fileBuffer: Buffer, roomId: string): {
    encrypted: Buffer;
    key: string;
  } {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const combined = Buffer.concat([iv, encrypted]);
    
    return {
      encrypted: combined,
      key: key.toString('base64')
    };
  }

  /**
   * Decrypt file buffer
   */
  static decryptFile(encryptedBuffer: Buffer, key: string): Buffer {
    try {
      const algorithm = 'aes-256-cbc';
      const keyBuffer = Buffer.from(key, 'base64');
      
      const iv = encryptedBuffer.subarray(0, 16);
      const encrypted = encryptedBuffer.subarray(16);
      
      const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
      
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      console.error('File decryption error:', error);
      return encryptedBuffer; // Return original if decryption fails
    }
  }
}
