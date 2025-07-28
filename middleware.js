import { NextResponse } from 'next/server';
import { SessionManager } from './src/lib/SessionManager';

// List of paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/check',
  '/reset-password',
];

// Check if a path is public
function isPublicPath(path) {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || 
    path.startsWith('/api/public/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.') ||
    path.startsWith('/robots.txt')
  );
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Allow public paths without authentication
  if (isPublicPath(path)) {
    return NextResponse.next();
  }
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('zenith-session')?.value;
  
  // If no session token, redirect to login
  if (!sessionToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Validate session
  const session = await SessionManager.validateSession(sessionToken);
  
  if (!session) {
    // Session is invalid, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('zenith-session');
    return response;
  }
  
  // Session is valid, continue to the page
  return NextResponse.next();
}

// Matching paths configuration
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api (API routes - we handle auth in the API routes themselves)
     * 2. /_next (Next.js internal files)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internal files)
     * 5. /favicon.ico, /robots.txt, etc.
     */
    '/((?!_next|_static|_vercel|favicon.ico|robots.txt).*)',
  ],
};
