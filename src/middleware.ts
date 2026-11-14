import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session-token';

const ADMIN_COOKIE_NAME = 'maqraat_admin_session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Allow unauthenticated access to the login page
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Enforce Edge cryptographic HMAC signature & expiry check on all /admin/* routes
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);

  if (!payload) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
