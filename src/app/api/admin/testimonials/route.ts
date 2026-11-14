import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import {
  fetchAllTestimonialsAdmin,
  updateTestimonialApprovalAdmin,
  deleteTestimonialRecordAdmin,
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
    const testimonials = await fetchAllTestimonialsAdmin();
    return NextResponse.json({ success: true, testimonials });
  } catch (error: unknown) {
    console.error('Admin get testimonials error:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب الآراء' }, { status: 500 });
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
    const { id, is_approved } = body;

    if (!id || typeof is_approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'معرف الرأي وحالة الاعتماد مطلوبة' }, { status: 400 });
    }

    await updateTestimonialApprovalAdmin(id, is_approved);
    await recordAuditLog(admin.username, is_approved ? 'اعتماد نشر رأي' : 'تعطيل نشر رأي', 'testimonial', id);

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الرأي بنجاح' });
  } catch (error: unknown) {
    console.error('Admin update testimonial error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحديث حالة الرأي' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'معرف الرأي مطلوب' }, { status: 400 });
    }

    await deleteTestimonialRecordAdmin(id);
    await recordAuditLog(admin.username, 'حذف رأي', 'testimonial', id);

    return NextResponse.json({ success: true, message: 'تم حذف الرأي' });
  } catch (error: unknown) {
    console.error('Admin delete testimonial error:', error);
    return NextResponse.json({ success: false, error: 'فشل حذف الرأي' }, { status: 500 });
  }
}
