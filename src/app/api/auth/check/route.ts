import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// Import the JS version of getCurrentUser which should be compatible
import { getCurrentUser as getUser } from '@/lib/auth';

// Re-export with TypeScript types
async function getCurrentUser() {
  try {
    const user = await getUser();
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user data using the JS function
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    
    if (user) {
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    } else {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Failed to check authentication status'
    }, { status: 500 });
  }
}
