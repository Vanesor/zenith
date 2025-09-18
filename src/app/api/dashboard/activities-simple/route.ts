import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-unified';

/**
 * Simplified Dashboard Activities API
 * Returns mock data to test authentication without database queries
 */
export async function GET(request: NextRequest) {
  console.log('🔍 ACTIVITIES SIMPLE API: Request received');
  try {
    // Get token from request header
    const token = request.headers.get('authorization')?.split(' ')[1];
    console.log('🔒 ACTIVITIES SIMPLE API: Token present:', !!token);
    
    if (!token) {
      console.log('❌ ACTIVITIES SIMPLE API: No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    console.log('🔑 ACTIVITIES SIMPLE API: Verifying token...');
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      console.log('❌ ACTIVITIES SIMPLE API: Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ ACTIVITIES SIMPLE API: Token verified successfully');
    
    // Mock data - no database queries required
    const mockActivities = [
      {
        type: 'post',
        id: 1,
        title: 'Welcome to Zenith',
        time: '2 days ago',
        club: 'Zenith Central',
        author: 'Admin'
      },
      {
        type: 'event',
        id: 2,
        title: 'Upcoming Workshop',
        time: 'Sep 20, 2025',
        club: 'Innovation Club'
      }
    ];

    return NextResponse.json({ 
      recentActivities: mockActivities
    });
  } catch (error) {
    console.error('Error in simplified activities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}