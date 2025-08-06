import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ZenithFileEncryption } from '@/lib/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const roomId = formData.get('roomId') as string;
    
    if (!files.length || !roomId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No files or room ID provided' 
      }, { status: 400 });
    }

    const uploadedFiles = [];
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'chat', roomId);
    
    // Create uploads directory if it doesn't exist
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.log('Directory creation error (might already exist):', error);
    }

    for (const file of files) {
      try {
        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop() || '';
        const uniqueFilename = `${timestamp}_${randomId}.${fileExtension}`;
        
        // Determine file type
        const isImage = file.type.startsWith('image/');
        const fileType = isImage ? 'image' : 'document';
        
        // Encrypt file if needed (optional feature)
        let finalBuffer = buffer;
        let encryptionKey = null;
        
        // For sensitive files, you can enable encryption
        // const encrypted = ZenithFileEncryption.encryptFile(buffer, roomId);
        // finalBuffer = encrypted.encrypted;
        // encryptionKey = encrypted.key;
        
        // Save file to disk
        const filePath = join(uploadsDir, uniqueFilename);
        await writeFile(filePath, finalBuffer);
        
        // Create file record in database
        const { data: fileRecord, error: dbError } = await supabase
          .from('chat_attachments')
          .insert({
            filename: file.name,
            original_filename: file.name,
            file_path: `/uploads/chat/${roomId}/${uniqueFilename}`,
            file_type: fileType,
            file_size: file.size,
            room_id: roomId,
            encryption_key: encryptionKey,
            mime_type: file.type
          })
          .select()
          .single();
        
        if (dbError) {
          console.error('Database error:', dbError);
          continue;
        }
        
        uploadedFiles.push({
          id: fileRecord.id,
          filename: file.name,
          type: fileType,
          size: file.size,
          url: `/uploads/chat/${roomId}/${uniqueFilename}`,
          mime_type: file.type
        });
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      attachments: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
