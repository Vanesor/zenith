import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { MediaService } from '@/lib/MediaService';
import db from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { clubId } = params;
    const userId = authResult.user.id;

    // Check if user has permission to update club logo
    const permissionsQuery = `
      SELECT 
        CASE 
          WHEN c.coordinator_id = $1 THEN true
          WHEN c.co_coordinator_id = $1 THEN true
          WHEN $2 = ANY(c.committee_member_ids) THEN true
          WHEN u.role = 'admin' THEN true
          ELSE false
        END as has_permission
      FROM clubs c
      CROSS JOIN users u
      WHERE c.id = $3 AND u.id = $1
      LIMIT 1
    `;

    const permissionsResult = await db.query(permissionsQuery, [userId, userId, clubId]);
    
    if (permissionsResult.rows.length === 0 || !permissionsResult.rows[0].has_permission) {
      return NextResponse.json(
        { error: "You don't have permission to update this club's logo" },
        { status: 403 }
      );
    }

    // Process the form data for the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image file (JPEG, PNG, GIF, WEBP)" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Upload club logo using MediaService
    const uploadResult = await MediaService.uploadClubLogo(clubId, file);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload logo" },
        { status: 500 }
      );
    }

    // Update club record with new logo URL
    const updateQuery = `
      UPDATE clubs
      SET logo_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, logo_url
    `;

    const updateResult = await db.query(updateQuery, [uploadResult.url, clubId]);

    return NextResponse.json({
      success: true,
      message: "Club logo updated successfully",
      club: updateResult.rows[0]
    });

  } catch (error) {
    console.error("Error uploading club logo:", error);
    return NextResponse.json(
      { error: "Failed to upload club logo" },
      { status: 500 }
    );
  }
}
