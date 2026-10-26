import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/me') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  // 2. Check for liveexam_auth session cookie
  const authCookie = request.cookies.get('liveexam_auth')?.value;

  let isValidAuth = false;
  if (authCookie) {
    try {
      const parts = authCookie.split('.');
      if (parts.length === 3) {
        // Decode payload
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (payload && (!payload.exp || payload.exp > nowInSeconds)) {
          isValidAuth = true;
        }
      }
    } catch {
      isValidAuth = false;
    }
  }

  // 3. If not authenticated, restrict access immediately
  if (!isValidAuth) {
    // For API requests: return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      );
    }

    // For all web pages: redirect to /login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated: proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
