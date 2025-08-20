import { NextRequest } from 'next/server';
import DatabaseClient from '@/lib/database';
import { jwtVerify } from 'jose';

const db = DatabaseClient;

export async function getAuthUser(request: NextRequest) {
  try {
    // Get the token from the request headers
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;

    // Verify the token
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload || !payload.sub) return null;

    // Get the user from the database
    const userResult = await db.query(
      `SELECT id, email, name, role, club_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [payload.sub as string]
    );
    
    return userResult.rows.length > 0 ? userResult.rows[0] : null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}
