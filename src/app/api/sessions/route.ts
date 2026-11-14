import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import {
  fetchPublicSessions,
  fetchAllSessionsAdmin,
  createSessionRecord,
  updateSessionRecord,
  deleteSessionRecord,
  recordAuditLog,
} from '@/lib/data-layer';
import { getAuthenticatedAdmin, isAdminAuthenticated } from '@/lib/auth';
import { verifySameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  noStore();
  try {
    const isAdmin = await isAdminAuthenticated(request);
    const sessions = isAdmin ? await fetchAllSessionsAdmin() : await fetchPublicSessions();
    return NextResponse.json(
      { success: true, sessions },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في جلب الحلقات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.teacher_name || !body.platform || !body.time_slot || !body.days_schedule) {
      return NextResponse.json({ success: false, error: 'جميع الحقول الأساسية مطلوبة' }, { status: 400 });
    }

    if (!['Zoom', 'Google Meet'].includes(body.platform)) {
      return NextResponse.json({ success: false, error: 'المنصة المعتمدة غير صالحة' }, { status: 400 });
    }

    const newSession = await createSessionRecord({
      name: String(body.name).trim(),
      teacher_name: String(body.teacher_name).trim(),
      platform: body.platform,
      days_count: String(body.days_count || '4 أيام').trim(),
      time_slot: String(body.time_slot).trim(),
      days_schedule: String(body.days_schedule).trim(),
      status: body.status === 'غير متاح' ? 'غير متاح' : 'متاح',
      whatsapp_url: typeof body.whatsapp_url === 'string' ? body.whatsapp_url.trim() : '',
    });

    await recordAuditLog(admin.username, 'إنشاء حلقة جديدة', 'session', newSession.id, `إنشاء ${newSession.name}`);

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create session error:', error);
    return NextResponse.json({ success: false, error: 'فشل إنشاء الحلقة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'معرف الحلقة مطلوب' }, { status: 400 });
    }

    const updated = await updateSessionRecord(body.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'الحلقة غير موجودة' }, { status: 404 });
    }

    await recordAuditLog(admin.username, 'تعديل حلقة', 'session', body.id, `تعديل بيانات ${body.name || body.id}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Update session error:', error);
    return NextResponse.json({ success: false, error: 'فشل تعديل الحلقة' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الحلقة مطلوب' }, { status: 400 });
    }

    await deleteSessionRecord(id);
    await recordAuditLog(admin.username, 'حذف حلقة', 'session', id, `حذف الحلقة ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف حلقة مسجل بها طالبات؛ يمكن تغيير حالتها إلى غير متاح بدلاً من الحذف' },
        { status: 409 }
      );
    }
    console.error('Delete session error:', error);
    return NextResponse.json({ success: false, error: 'فشل حذف الحلقة' }, { status: 500 });
  }
}
