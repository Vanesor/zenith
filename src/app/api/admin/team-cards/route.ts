import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-unified';
import { db } from '@/lib/database';
import { MediaService } from '@/lib/MediaService';

// Content permission check (same as carousel)
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

// GET - Fetch team cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType') as 'landing' | 'club_home';
    const pageReferenceId = searchParams.get('pageReferenceId');

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const teamCards = await db.query(`
      SELECT 
        id, member_name, member_role, member_email, member_phone, avatar_url,
        bio, social_links, display_order, is_active, created_at, updated_at
      FROM team_cards 
      WHERE page_type = $1 
        AND (page_reference_id = $2 OR ($2 IS NULL AND page_reference_id IS NULL))
        AND is_active = true
      ORDER BY display_order ASC, created_at DESC
    `, [pageType, pageReferenceId]);

    return NextResponse.json({
      success: true,
      teamCards: teamCards.rows
    });

  } catch (error) {
    console.error('Error fetching team cards:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team cards' 
    }, { status: 500 });
  }
}

// POST - Create new team card
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      pageType, pageReferenceId, memberName, memberRole, memberEmail, 
      memberPhone, avatarFile, bio, socialLinks, displayOrder 
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

    let avatarUrl = data.avatarUrl;

    // Handle avatar upload if provided
    if (avatarFile) {
      const mediaFile = await MediaService.uploadFile(
        avatarFile,
        authResult.user.id,
        'content',
        'team_avatars',
        {
          uploadContext: 'team_cards',
          metadata: { pageType, pageReferenceId, memberRole }
        }
      );
      avatarUrl = mediaFile?.file_url;
    }

    // Create team card
    const result = await db.query(`
      INSERT INTO team_cards (
        page_type, page_reference_id, member_name, member_role, member_email, 
        member_phone, avatar_url, bio, social_links, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, member_name, member_role, member_email, member_phone, 
                avatar_url, bio, social_links, display_order, created_at
    `, [
      pageType, pageReferenceId, memberName, memberRole, memberEmail,
      memberPhone, avatarUrl, bio, JSON.stringify(socialLinks || {}), 
      displayOrder || 0, authResult.user.id
    ]);

    return NextResponse.json({
      success: true,
      teamCard: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating team card:', error);
    return NextResponse.json({ 
      error: 'Failed to create team card' 
    }, { status: 500 });
  }
}

// PUT - Update team card
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      id, pageType, pageReferenceId, memberName, memberRole, memberEmail, 
      memberPhone, avatarFile, bio, socialLinks, displayOrder, isActive 
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

    let avatarUrl = data.avatarUrl;

    // Handle avatar upload if provided
    if (avatarFile) {
      const mediaFile = await MediaService.uploadFile(
        avatarFile,
        authResult.user.id,
        'content',
        'team_avatars',
        {
          uploadContext: 'team_cards',
          metadata: { pageType, pageReferenceId, memberRole }
        }
      );
      avatarUrl = mediaFile?.file_url;
    }

    // Update team card
    const result = await db.query(`
      UPDATE team_cards SET
        member_name = $2, member_role = $3, member_email = $4, member_phone = $5,
        avatar_url = $6, bio = $7, social_links = $8, display_order = $9, 
        is_active = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, member_name, member_role, member_email, member_phone, 
                avatar_url, bio, social_links, display_order, is_active, updated_at
    `, [
      id, memberName, memberRole, memberEmail, memberPhone, avatarUrl, 
      bio, JSON.stringify(socialLinks || {}), displayOrder, isActive
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team card not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teamCard: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating team card:', error);
    return NextResponse.json({ 
      error: 'Failed to update team card' 
    }, { status: 500 });
  }
}

// DELETE - Delete team card
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
      return NextResponse.json({ error: 'Team card ID is required' }, { status: 400 });
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

    // Delete team card
    const result = await db.query(`
      DELETE FROM team_cards WHERE id = $1 RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team card not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Team card deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team card:', error);
    return NextResponse.json({ 
      error: 'Failed to delete team card' 
    }, { status: 500 });
  }
}
