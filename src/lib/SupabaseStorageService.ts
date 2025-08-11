import { createClient } from '@supabase/supabase-js';

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
        url: publicUrl,
        path: uploadData.path,
        mediaId: mediaRecord.id
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
        url: publicUrl,
        path: uploadData.path,
        mediaId: mediaRecord.id
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
        url: publicUrl,
        path: uploadData.path,
        mediaId: mediaRecord.id
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
