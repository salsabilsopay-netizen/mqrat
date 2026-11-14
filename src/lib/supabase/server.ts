import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  return (
    url.startsWith('https://') &&
    !url.includes('your-project') &&
    anonKey.length > 20 &&
    !anonKey.includes('your-anon')
  );
}

export function isSupabaseServiceConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  return (
    isSupabaseConfigured() &&
    serviceKey.length > 20 &&
    !serviceKey.includes('your-service-role')
  );
}

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, { ...init, cache: 'no-store' });
};

/**
 * SSR Supabase client bound to Next.js cookies (respects RLS policies).
 */
export function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('بيانات اتصال Supabase غير مهيأة في متغيرات البيئة');
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: noStoreFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Components
          }
        },
      },
    }
  );
}

/**
 * Server-ONLY Supabase Service Role client (bypasses RLS for hardened server-side APIs).
 * Strictly prohibited from browser/client bundles.
 */
export function createSupabaseServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: Service role client cannot run in the browser.');
  }

  if (!isSupabaseServiceConfigured()) {
    throw new Error('مفتاح SUPABASE_SERVICE_ROLE_KEY غير مهيأ على الخادم');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: noStoreFetch,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
