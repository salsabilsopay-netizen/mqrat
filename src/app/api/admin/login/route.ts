import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, getAuthenticatedAdmin, revokeCurrentAdminSession } from '@/lib/auth';
import { verifyAdminCredentials } from '@/lib/db';
import { getDataSource, recordAuditLog } from '@/lib/data-layer';
import { checkRateLimit, recordRateLimitFailure, clearRateLimit } from '@/lib/rate-limit';
import { getClientIp, verifySameOrigin } from '@/lib/security';
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const ipKey = `login:ip:${clientIp}`;
    const ipUserKey = `login:ip:${clientIp}:user:${username.toLowerCase()}`;

    const ipLimit = await checkRateLimit(ipKey);
    const userLimit = await checkRateLimit(ipUserKey);
    if (!ipLimit.allowed || !userLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSeconds || 0, userLimit.retryAfterSeconds || 0, 60);
      const minutes = Math.ceil(retryAfter / 60);
      return NextResponse.json(
        {
          success: false,
          error: `تم تجاوز الحد المسموح لمحاولات الدخول الفاشلة. يرجى المحاولة بعد ${minutes} دقيقة.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    let admin: { id: string; username: string; name: string; role: string } | null = null;

    if (getDataSource() === 'sqlite') {
      admin = verifyAdminCredentials(username, password);
    } else {
      // Supabase Auth + protected admin_profiles check
      const supabaseAuth = createSupabaseServerClient();
      const { data: authData, error: authErr } = await supabaseAuth.auth.signInWithPassword({
        email: username,
        password,
      });

      if (!authErr && authData.user) {
        const serviceClient = createSupabaseServiceClient();
        const { data: profile } = await serviceClient
          .from('admin_profiles')
          .select('id, email, full_name, role, is_active')
          .eq('id', authData.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (profile) {
          admin = {
            id: profile.id,
            username: profile.email,
            name: profile.full_name,
            role: profile.role,
          };
        } else {
          // Authenticated user without active admin profile must not gain admin session
          await supabaseAuth.auth.signOut();
        }
      }
    }

    if (!admin) {
      await recordRateLimitFailure(ipKey, 10, 15 * 60 * 1000, 15 * 60 * 1000);
      await recordRateLimitFailure(ipUserKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
      if (getDataSource() === 'sqlite') {
        await recordAuditLog(username, 'محاولة تسجيل دخول فاشلة', 'auth', undefined, `IP: ${clientIp}`);
      }
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    await clearRateLimit(ipKey);
    await clearRateLimit(ipUserKey);

    await createAdminSession(admin, request);
    await recordAuditLog(admin.username, 'تسجيل دخول إداري ناجح', 'auth', admin.id);

    return NextResponse.json({ success: true, name: admin.name });
  } catch (error: unknown) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (admin) {
    await recordAuditLog(admin.username, 'تسجيل خروج إداري', 'auth', admin.adminId);
  }

  await revokeCurrentAdminSession(request);
  return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
}
