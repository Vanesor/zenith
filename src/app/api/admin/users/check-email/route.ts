import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyAuth } from '@/lib/auth-unified';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Ensure user is a system admin
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: "Access denied. Only admin and super admin users can check email uniqueness." 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Check if email exists for a different user
    let query = 'SELECT id FROM users WHERE email = $1';
    let params = [email];

    if (userId) {
      query += ' AND id != $2';
      params.push(userId);
    }

    const result = await db.query(query, params);
    const isUnique = result.rows.length === 0;

    return NextResponse.json({
      success: true,
      isUnique,
      email
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check email uniqueness',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}