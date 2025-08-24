import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for submission files

// File validation function
function validateSubmissionFile(file: File): { valid: boolean; error?: string } {
  // Allow images, PDFs, and common document formats
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: images, PDF, Word documents, text files, and ZIP archives'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Authentication failed' 
      }, { status: 401 });
    }

    const { id: assignmentId, submissionId } = params;
    const userId = authResult.user.id;

    // Verify that the submission belongs to the current user
    const submissionQuery = `
      SELECT user_id, status 
      FROM assignment_submissions 
      WHERE id = $1 AND assignment_id = $2
    `;
    const submissionResult = await db.query(submissionQuery, [submissionId, assignmentId]);

    if (submissionResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Submission not found' 
      }, { status: 404 });
    }

    const submission = submissionResult.rows[0];
    
    if (submission.user_id !== userId) {
      return NextResponse.json({ 
        error: 'You can only upload files to your own submissions' 
      }, { status: 403 });
    }

    // Check if submission is still editable
    if (submission.status === 'graded' || submission.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot upload files to a graded or completed submission' 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file
    const validation = validateSubmissionFile(file);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Upload file using MediaService
    const mediaFile = await MediaService.uploadFile(
      file,
      userId,
      'submissions',
      `assignments/${assignmentId}/${submissionId}`,
      {
        uploadContext: 'assignment_submissions',
        referenceId: submissionId,
        isPublic: false, // Submissions are private
        metadata: {
          assignmentId,
          submissionId,
          uploadedBy: userId
        }
      }
    );

    if (!mediaFile) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Create submission attachment record
    const attachmentQuery = `
      INSERT INTO submission_attachments (
        submission_id, media_file_id, file_name, file_type, file_size, uploaded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const attachmentResult = await db.query(attachmentQuery, [
      submissionId,
      mediaFile.id,
      mediaFile.original_filename,
      mediaFile.mime_type,
      mediaFile.file_size,
      new Date().toISOString()
    ]);

    // Update submission status to indicate files have been uploaded
    await db.query(
      `UPDATE assignment_submissions 
       SET updated_at = $1, status = CASE WHEN status = 'draft' THEN 'submitted' ELSE status END
       WHERE id = $2`,
      [new Date().toISOString(), submissionId]
    );

    console.log(`✅ Submission file uploaded for assignment ${assignmentId}, submission ${submissionId}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl: mediaFile.file_url,
      fileId: mediaFile.id,
      attachmentId: attachmentResult.rows[0]?.id,
      fileName: mediaFile.original_filename,
      fileType: mediaFile.mime_type,
      fileSize: mediaFile.file_size
    });

  } catch (error) {
    console.error("Error uploading submission file:", error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload submission file'
    }, { status: 500 });
  }
}
