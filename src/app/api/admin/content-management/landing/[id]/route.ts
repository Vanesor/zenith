import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface JwtPayload {
  userId: string;
  role: string;
}

const hasContentManagementAccess = (role: string): boolean => {
  const allowedRoles = [
    'admin',
    'super_admin',
    'coordinator',
    'co_coordinator',
    'president',
    'vice_president',
    'innovation_head',
    'secretary',
    'treasurer',
    'outreach_coordinator',
    'media_coordinator',
    'zenith_committee'
  ];
  return allowedRoles.includes(role);
};

// Update landing page content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!hasContentManagementAccess(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      section,
      title,
      subtitle,
      description,
      image_url,
      video_url,
      button_text,
      button_url,
      order_index,
      is_active
    } = body;

    const client = await pool.connect();

    try {
      const updateQuery = `
        UPDATE landing_page_content 
        SET 
          section = $1,
          title = $2,
          subtitle = $3,
          description = $4,
          image_url = $5,
          video_url = $6,
          button_text = $7,
          button_url = $8,
          order_index = $9,
          is_active = $10,
          updated_by = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `;

      const values = [
        section,
        title,
        subtitle || '',
        description || '',
        image_url || '',
        video_url || '',
        button_text || '',
        button_url || '',
        order_index || 0,
        is_active !== undefined ? is_active : true,
        decoded.userId,
        params.id
      ];

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Landing content updated successfully',
        content: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating landing content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete landing page content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!hasContentManagementAccess(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const client = await pool.connect();

    try {
      const deleteQuery = 'DELETE FROM landing_page_content WHERE id = $1 RETURNING id';
      const result = await client.query(deleteQuery, [params.id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Landing content deleted successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting landing content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Toggle landing page content status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!hasContentManagementAccess(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { is_active } = body;

    const client = await pool.connect();

    try {
      const updateQuery = `
        UPDATE landing_page_content 
        SET is_active = $1, updated_by = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await client.query(updateQuery, [is_active, decoded.userId, params.id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Content status updated successfully',
        content: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating content status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}