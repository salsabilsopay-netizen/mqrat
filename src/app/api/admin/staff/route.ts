import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import {
  fetchStaffApplicationsAdmin,
  updateStaffApplicationStatus,
  recordAuditLog,
} from '@/lib/data-layer';
import { verifySameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const role = roleParam === 'معلمة' || roleParam === 'مشرفة' ? roleParam : undefined;
    const status = searchParams.get('status') || undefined;

    const staff = await fetchStaffApplicationsAdmin(role, status);
    return NextResponse.json({ success: true, staff });
  } catch (error: unknown) {
    console.error('Admin get staff error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل جلب طلبات المعلمات والمشرفات' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'معرف الطلب والحالة الصحيحة مطلوبان' }, { status: 400 });
    }

    const cleanNotes = typeof notes === 'string' ? notes.trim() : undefined;
    await updateStaffApplicationStatus(id, status, cleanNotes);
    await recordAuditLog(admin.username, `تحديث حالة طلب منسوبة إلى ${status}`, 'staff_application', id, cleanNotes);

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error: unknown) {
    console.error('Admin update staff status error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحديث حالة الطلب' }, { status: 500 });
  }
}
