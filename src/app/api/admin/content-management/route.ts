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

export async function GET(request: NextRequest) {
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
      // Fetch landing page content
      const landingContentQuery = `
        SELECT 
          id,
          section,
          title,
          subtitle,
          description,
          image_url,
          video_url,
          button_text,
          button_url,
          order_index,
          is_active,
          created_at,
          updated_at
        FROM landing_page_content
        ORDER BY order_index ASC, created_at DESC
      `;
      const landingContentResult = await client.query(landingContentQuery);

      // Fetch carousel images
      const carouselImagesQuery = `
        SELECT 
          id,
          title,
          description,
          image_url,
          alt_text,
          link_url,
          context,
          context_id,
          order_index,
          is_active,
          created_at,
          updated_at
        FROM carousel_images
        ORDER BY context ASC, order_index ASC, created_at DESC
      `;
      const carouselImagesResult = await client.query(carouselImagesQuery);

      // Fetch site content
      const siteContentQuery = `
        SELECT 
          id,
          key,
          value,
          description,
          content_type,
          is_active,
          created_at,
          updated_at
        FROM site_content
        ORDER BY key ASC
      `;
      const siteContentResult = await client.query(siteContentQuery);

      return NextResponse.json({
        landingContent: landingContentResult.rows,
        carouselImages: carouselImagesResult.rows,
        siteContent: siteContentResult.rows
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching content management data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}