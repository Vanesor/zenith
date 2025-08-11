import { createClient } from '@supabase/supabase-js';
import TokenManager from '@/lib/TokenManager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service client with admin privileges (bypasses RLS)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class SupabaseStorageService {
  /**
   * Validate file for upload
   */
  static validateFile(file: File, context: 'profile' | 'chat' | 'question' | 'event', maxSize: number) {
    const ALLOWED_TYPES = {
      profile: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      chat: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
      question: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      event: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    };

    if (!ALLOWED_TYPES[context].includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Only ${ALLOWED_TYPES[context].join(', ')} files are allowed for ${context}.`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Upload user avatar to Supabase Storage
   */
  static async uploadUserAvatar(file: File, fileName: string, userId: string) {
    try {
      // Upload to avatars bucket
      const { data: uploadData, error: uploadError } = await supabaseService.storage
        .from('avatars')
        .upload(`profile_${userId}_${Date.now()}_${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabaseService.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Record in media_files table
      const { data: mediaRecord, error: dbError } = await supabaseService
        .from('media_files')
        .insert({
          filename: uploadData.path,
          original_filename: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          upload_context: 'profile',
          upload_reference_id: userId,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        fileUrl: publicUrl,
        fileId: mediaRecord.id,
        thumbnailUrl: publicUrl // For now, same as fileUrl - could generate thumbnails later
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload chat attachment
   */
  static async uploadChatAttachment(file: File, fileName: string, userId: string, roomId: string) {
    try {
      const { data: uploadData, error: uploadError } = await supabaseService.storage
        .from('chat-attachments')
        .upload(`chat_${roomId}_${userId}_${Date.now()}_${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseService.storage
        .from('chat-attachments')
        .getPublicUrl(uploadData.path);

      const { data: mediaRecord, error: dbError } = await supabaseService
        .from('media_files')
        .insert({
          filename: uploadData.path,
          original_filename: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          upload_context: 'chat',
          upload_reference_id: roomId,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        fileUrl: publicUrl,
        fileId: mediaRecord.id,
        thumbnailUrl: publicUrl
      };
    } catch (error) {
      console.error('Chat attachment upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload question image for assignments
   */
  static async uploadQuestionImage(file: File, fileName: string, userId: string, questionId: string) {
    try {
      const { data: uploadData, error: uploadError } = await supabaseService.storage
        .from('question-images')
        .upload(`question_${questionId}_${userId}_${Date.now()}_${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseService.storage
        .from('question-images')
        .getPublicUrl(uploadData.path);

      const { data: mediaRecord, error: dbError } = await supabaseService
        .from('media_files')
        .insert({
          filename: uploadData.path,
          original_filename: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          upload_context: 'question',
          upload_reference_id: questionId,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        fileUrl: publicUrl,
        fileId: mediaRecord.id,
        thumbnailUrl: publicUrl
      };
    } catch (error) {
      console.error('Question image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload event image
   */
  static async uploadEventImage(file: File, fileName: string, userId: string, eventId: string) {
    try {
      const { data: uploadData, error: uploadError } = await supabaseService.storage
        .from('event-images')
        .upload(`event_${eventId}_${userId}_${Date.now()}_${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseService.storage
        .from('event-images')
        .getPublicUrl(uploadData.path);

      const { data: mediaRecord, error: dbError } = await supabaseService
        .from('media_files')
        .insert({
          filename: uploadData.path,
          original_filename: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          upload_context: 'event',
          upload_reference_id: eventId,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        fileUrl: publicUrl,
        fileId: mediaRecord.id,
        thumbnailUrl: publicUrl
      };
    } catch (error) {
      console.error('Event image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete file from storage and database
   */
  static async deleteFile(filePath: string, bucket: string) {
    try {
      // Delete from storage
      const { error: storageError } = await supabaseService.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabaseService
        .from('media_files')
        .delete()
        .eq('filename', filePath);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      };
    }
  }
}
