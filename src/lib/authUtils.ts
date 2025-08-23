import { NextRequest } from 'next/server';
import DatabaseClient from '@/lib/database';
import { jwtVerify } from 'jose';

const db = DatabaseClient;

// Server-side auth utilities
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

// Client-side auth utilities
export const handleApiResponse = async (
  response: Response, 
  logout: (redirect?: boolean) => void,
  openAuthModal: (reason: string) => void
) => {
  if (response.status === 401) {
    try {
      const data = await response.json();
      
      // Check if the error indicates an expired token
      if (data.expired || data.message?.includes('expired') || data.error?.includes('expired')) {
        // Clear local storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('zenith-token');
          localStorage.removeItem('zenith-user');
          localStorage.removeItem('zenith-refresh-token');
        }
        
        // Log out the user
        logout(false);
        
        // Show auth modal with session expired message
        openAuthModal('Your session has expired. Please sign in again to continue.');
        
        throw new Error('Session expired');
      }
    } catch (parseError) {
      // If we can't parse the response, still handle it as an auth error
      logout(false);
      openAuthModal('Authentication required. Please sign in to continue.');
      throw new Error('Authentication failed');
    }
  }
  
  return response;
};

// Enhanced fetch function that automatically handles expired tokens
export const fetchWithAuth = async (
  url: string, 
  options: RequestInit = {},
  logout: (redirect?: boolean) => void,
  openAuthModal: (reason: string) => void
): Promise<Response> => {
  // Add auth headers if token exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('zenith-token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  // Handle expired tokens automatically
  return handleApiResponse(response, logout, openAuthModal);
};
