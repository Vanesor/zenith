import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';
import { MediaService } from '@/lib/MediaService';

// Content permission check
async function checkContentPermission(
  userId: string, 
  pageType: 'landing' | 'club_home', 
  pageReferenceId: string | null,
  requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'write'
): Promise<boolean> {
  try {
    // Check if user has permission
    const permissionResult = await db.query(`
      SELECT permission_type 
      FROM content_permissions 
      WHERE user_id = $1 
        AND page_type = $2 
        AND (page_reference_id = $3 OR page_reference_id IS NULL)
    `, [userId, pageType, pageReferenceId]);

    if (permissionResult.rows.length === 0) {
      return false;
    }

    const userPermission = permissionResult.rows[0].permission_type;
    
    // Admin permission grants all access
    if (userPermission === 'admin') return true;
    
    // Check specific permissions
    const permissionHierarchy = ['read', 'write', 'delete', 'admin'];
    const userLevel = permissionHierarchy.indexOf(userPermission);
    const requiredLevel = permissionHierarchy.indexOf(requiredPermission);
    
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// GET - Fetch carousel slides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType') as 'landing' | 'club_home';
    const pageReferenceId = searchParams.get('pageReferenceId');

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const slides = await db.query(`
      SELECT 
        id, title, subtitle, description, image_url, button_text, button_link,
        display_order, is_active, created_at, updated_at
      FROM carousel_slides 
      WHERE page_type = $1 
        AND (page_reference_id = $2 OR ($2 IS NULL AND page_reference_id IS NULL))
        AND is_active = true
      ORDER BY display_order ASC, created_at DESC
    `, [pageType, pageReferenceId]);

    return NextResponse.json({
      success: true,
      slides: slides.rows
    });

  } catch (error) {
    console.error('Error fetching carousel slides:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch carousel slides' 
    }, { status: 500 });
  }
}

// POST - Create new carousel slide
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { pageType, pageReferenceId, title, subtitle, description, imageFile, buttonText, buttonLink, displayOrder } = data;

    // Check permissions
    const hasPermission = await checkContentPermission(
      authResult.user.id, 
      pageType, 
      pageReferenceId, 
      'write'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let imageUrl = data.imageUrl;

    // Handle image upload if provided
    if (imageFile) {
      const mediaFile = await MediaService.uploadFile(
        imageFile,
        authResult.user.id,
        'content',
        'carousel',
        {
          uploadContext: 'carousel',
          metadata: { pageType, pageReferenceId }
        }
      );
      imageUrl = mediaFile?.file_url;
    }

    // Create carousel slide
    const result = await db.query(`
      INSERT INTO carousel_slides (
        page_type, page_reference_id, title, subtitle, description, 
        image_url, button_text, button_link, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, subtitle, description, image_url, button_text, button_link, display_order, created_at
    `, [
      pageType, pageReferenceId, title, subtitle, description,
      imageUrl, buttonText, buttonLink, displayOrder || 0, authResult.user.id
    ]);

    return NextResponse.json({
      success: true,
      slide: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating carousel slide:', error);
    return NextResponse.json({ 
      error: 'Failed to create carousel slide' 
    }, { status: 500 });
  }
}

// PUT - Update carousel slide
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { id, pageType, pageReferenceId, title, subtitle, description, imageFile, buttonText, buttonLink, displayOrder, isActive } = data;

    // Check permissions
    const hasPermission = await checkContentPermission(
      authResult.user.id, 
      pageType, 
      pageReferenceId, 
      'write'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let imageUrl = data.imageUrl;

    // Handle image upload if provided
    if (imageFile) {
      const mediaFile = await MediaService.uploadFile(
        imageFile,
        authResult.user.id,
        'content',
        'carousel',
        {
          uploadContext: 'carousel',
          metadata: { pageType, pageReferenceId }
        }
      );
      imageUrl = mediaFile?.file_url;
    }

    // Update carousel slide
    const result = await db.query(`
      UPDATE carousel_slides SET
        title = $2, subtitle = $3, description = $4, image_url = $5,
        button_text = $6, button_link = $7, display_order = $8, is_active = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, title, subtitle, description, image_url, button_text, button_link, display_order, is_active, updated_at
    `, [id, title, subtitle, description, imageUrl, buttonText, buttonLink, displayOrder, isActive]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      slide: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating carousel slide:', error);
    return NextResponse.json({ 
      error: 'Failed to update carousel slide' 
    }, { status: 500 });
  }
}

// DELETE - Delete carousel slide
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pageType = searchParams.get('pageType') as 'landing' | 'club_home';
    const pageReferenceId = searchParams.get('pageReferenceId');

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await checkContentPermission(
      authResult.user.id, 
      pageType, 
      pageReferenceId, 
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete carousel slide
    const result = await db.query(`
      DELETE FROM carousel_slides WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slide deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting carousel slide:', error);
    return NextResponse.json({ 
      error: 'Failed to delete carousel slide' 
    }, { status: 500 });
  }
}
