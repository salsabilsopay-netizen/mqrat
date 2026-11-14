import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { signSessionToken, verifySessionToken } from './session-token';
import { createAdminSessionRecord, getActiveAdminSession, revokeAdminSessionRecord } from './db';
import { getDataSource } from './data-layer';
import { getClientIp, isHttpsRequest } from './security';
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from './supabase/server';

export const ADMIN_COOKIE_NAME = 'maqraat_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthenticatedAdmin {
  sessionId: string;
  adminId: string;
  username: string;
  role: string;
}

function extractToken(request?: NextRequest): string | null {
  if (request) {
    const val = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (val) return val;
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  try {
    const cookieStore = cookies();
    return cookieStore.get(ADMIN_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

export async function createAdminSession(
  admin: { id: string; username: string; role: string },
  request?: NextRequest
): Promise<string> {
  const sessionId = `asess-${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
  const expMs = Date.now() + SESSION_TTL_MS;
  const expiresAtIso = new Date(expMs).toISOString();

  if (getDataSource() === 'sqlite') {
    createAdminSessionRecord({
      id: sessionId,
      admin_id: admin.id,
      username: admin.username,
      role: admin.role,
      expires_at: expiresAtIso,
      ip_address: request ? getClientIp(request) : undefined,
    });
  }

  const signedToken = await signSessionToken({
    sid: sessionId,
    uid: admin.id,
    username: admin.username,
    role: admin.role,
    exp: expMs,
  });

  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: isHttpsRequest(request),
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return signedToken;
}

export async function revokeCurrentAdminSession(request?: NextRequest): Promise<void> {
  const token = extractToken(request);

  if (getDataSource() === 'sqlite') {
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.sid) {
        revokeAdminSessionRecord(payload.sid);
      }
    }
  } else if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore if session already absent
    }
  }

  try {
    const cookieStore = cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch {
    // ignore outside request context
  }
}

export async function getAuthenticatedAdmin(
  request?: NextRequest
): Promise<AuthenticatedAdmin | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  if (getDataSource() === 'sqlite') {
    const active = getActiveAdminSession(payload.sid);
    if (!active) return null;

    return {
      sessionId: active.id,
      adminId: active.admin_id,
      username: active.username,
      role: active.role,
    };
  }

  // Supabase mode: verify active Supabase Auth session AND active row in admin_profiles
  if (!isSupabaseConfigured()) return null;

  try {
    const supabaseAuth = createSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user || user.id !== payload.uid) {
      return null;
    }

    const serviceClient = createSupabaseServiceClient();
    const { data: profile, error: profErr } = await serviceClient
      .from('admin_profiles')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (profErr || !profile) {
      return null;
    }

    return {
      sessionId: payload.sid,
      adminId: profile.id,
      username: profile.email,
      role: profile.role,
    };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(request?: NextRequest): Promise<boolean> {
  const admin = await getAuthenticatedAdmin(request);
  return admin !== null;
}
