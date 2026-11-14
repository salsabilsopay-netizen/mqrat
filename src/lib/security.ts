import { NextRequest } from 'next/server';

/**
 * Extracts normalized client IP for rate limiting and audit logging.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}

/**
 * Verifies same-origin policy on state-changing requests (CSRF defense-in-depth).
 * Rejects cross-site browser requests via Sec-Fetch-Site and Origin/Host verification.
 */
export function verifySameOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // Modern browsers send Sec-Fetch-Site on fetch/form requests
  const secFetchSite = request.headers.get('sec-fetch-site')?.toLowerCase();
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const hostHeader = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    ?.trim()
    .toLowerCase();

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (hostHeader && originHost !== hostHeader) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (!origin && referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      if (hostHeader && refererHost !== hostHeader) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Determines whether the current request is over HTTPS (directly or behind a proxy).
 */
export function isHttpsRequest(request?: NextRequest): boolean {
  if (!request) {
    return process.env.FORCE_SECURE_COOKIE === 'true';
  }
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (proto === 'https') return true;
  if (request.nextUrl?.protocol === 'https:') return true;
  if (process.env.FORCE_SECURE_COOKIE === 'true') return true;
  return false;
}
