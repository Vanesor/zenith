import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';

// Content permission check
async function checkContentPermission(
  userId: string, 
  pageType: 'landing' | 'club_home', 
  pageReferenceId: string | null,
  requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'write'
): Promise<boolean> {
  try {
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
    if (userPermission === 'admin') return true;
    
    const permissionHierarchy = ['read', 'write', 'delete', 'admin'];
    const userLevel = permissionHierarchy.indexOf(userPermission);
    const requiredLevel = permissionHierarchy.indexOf(requiredPermission);
    
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// GET - Fetch featured events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType') as 'landing' | 'club_home';
    const pageReferenceId = searchParams.get('pageReferenceId');

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const featuredEvents = await db.query(`
      SELECT 
        fe.id, fe.event_id, fe.custom_title, fe.custom_description, fe.custom_image_url,
        fe.display_order, fe.is_active, fe.featured_until, fe.created_at, fe.updated_at,
        e.title as event_title, e.description as event_description, e.event_date, 
        e.event_time, e.location, e.image_url as event_image_url, e.club_id,
        c.name as club_name, c.color as club_color
      FROM featured_events fe
      LEFT JOIN events e ON fe.event_id = e.id
      LEFT JOIN clubs c ON e.club_id = c.id
      WHERE fe.page_type = $1 
        AND (fe.page_reference_id = $2 OR ($2 IS NULL AND fe.page_reference_id IS NULL))
        AND fe.is_active = true
        AND (fe.featured_until IS NULL OR fe.featured_until > CURRENT_TIMESTAMP)
      ORDER BY fe.display_order ASC, fe.created_at DESC
    `, [pageType, pageReferenceId]);

    // Transform the data to include resolved titles, descriptions, and images
    const transformedEvents = featuredEvents.rows.map(event => ({
      id: event.id,
      eventId: event.event_id,
      title: event.custom_title || event.event_title,
      description: event.custom_description || event.event_description,
      imageUrl: event.custom_image_url || event.event_image_url,
      eventDate: event.event_date,
      eventTime: event.event_time,
      location: event.location,
      clubName: event.club_name,
      clubColor: event.club_color,
      displayOrder: event.display_order,
      isActive: event.is_active,
      featuredUntil: event.featured_until,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      // Include custom overrides separately for editing
      customTitle: event.custom_title,
      customDescription: event.custom_description,
      customImageUrl: event.custom_image_url
    }));

    return NextResponse.json({
      success: true,
      featuredEvents: transformedEvents
    });

  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch featured events' 
    }, { status: 500 });
  }
}

// POST - Create new featured event
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      pageType, pageReferenceId, eventId, customTitle, customDescription, 
      customImageUrl, displayOrder, featuredUntil 
    } = data;

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

    // Verify the event exists
    const eventExists = await db.query(`
      SELECT id FROM events WHERE id = $1 AND deleted_at IS NULL
    `, [eventId]);

    if (eventExists.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Create featured event
    const result = await db.query(`
      INSERT INTO featured_events (
        page_type, page_reference_id, event_id, custom_title, custom_description, 
        custom_image_url, display_order, featured_until, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, event_id, custom_title, custom_description, custom_image_url, 
                display_order, featured_until, created_at
    `, [
      pageType, pageReferenceId, eventId, customTitle, customDescription,
      customImageUrl, displayOrder || 0, featuredUntil, authResult.user.id
    ]);

    return NextResponse.json({
      success: true,
      featuredEvent: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating featured event:', error);
    return NextResponse.json({ 
      error: 'Failed to create featured event' 
    }, { status: 500 });
  }
}

// PUT - Update featured event
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      id, pageType, pageReferenceId, customTitle, customDescription, 
      customImageUrl, displayOrder, featuredUntil, isActive 
    } = data;

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

    // Update featured event
    const result = await db.query(`
      UPDATE featured_events SET
        custom_title = $2, custom_description = $3, custom_image_url = $4,
        display_order = $5, featured_until = $6, is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, event_id, custom_title, custom_description, custom_image_url, 
                display_order, featured_until, is_active, updated_at
    `, [id, customTitle, customDescription, customImageUrl, displayOrder, featuredUntil, isActive]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Featured event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      featuredEvent: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating featured event:', error);
    return NextResponse.json({ 
      error: 'Failed to update featured event' 
    }, { status: 500 });
  }
}

// DELETE - Remove featured event
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
      return NextResponse.json({ error: 'Featured event ID is required' }, { status: 400 });
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

    // Delete featured event
    const result = await db.query(`
      DELETE FROM featured_events WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Featured event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Featured event removed successfully'
    });

  } catch (error) {
    console.error('Error deleting featured event:', error);
    return NextResponse.json({ 
      error: 'Failed to delete featured event' 
    }, { status: 500 });
  }
}
