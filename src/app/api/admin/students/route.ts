import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import {
  fetchStudentApplicationsAdmin,
  updateStudentApplicationStatus,
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
    const status = searchParams.get('status') || undefined;
    const students = await fetchStudentApplicationsAdmin(status);
    return NextResponse.json({ success: true, students });
  } catch (error: unknown) {
    console.error('Admin get students error:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب طلبات الطالبات' }, { status: 500 });
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
    await updateStudentApplicationStatus(id, status, cleanNotes);
    await recordAuditLog(admin.username, `تحديث حالة طلب طالبة إلى ${status}`, 'student_application', id, cleanNotes);

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error: unknown) {
    console.error('Admin update student status error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحديث حالة الطلب' }, { status: 500 });
  }
}
