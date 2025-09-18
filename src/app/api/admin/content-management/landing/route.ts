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

// Create new landing page content
export async function POST(request: NextRequest) {
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

    if (!section || !title) {
      return NextResponse.json({ error: 'Section and title are required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const insertQuery = `
        INSERT INTO landing_page_content (
          section, title, subtitle, description, image_url, video_url,
          button_text, button_url, order_index, is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        decoded.userId
      ];

      const result = await client.query(insertQuery, values);

      return NextResponse.json({
        message: 'Landing content created successfully',
        content: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating landing content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}