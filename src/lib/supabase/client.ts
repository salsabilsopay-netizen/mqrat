import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-safe Supabase client using ONLY public URL and Anon Key.
 * Never imports or accesses SUPABASE_SERVICE_ROLE_KEY.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('متغيرات اتصال Supabase العامة غير مضبوطة في البيئة');
  }

  return createBrowserClient(url, anonKey);
}
