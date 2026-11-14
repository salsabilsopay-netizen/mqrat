import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { fetchApprovedTestimonials, submitTestimonialRecord } from '@/lib/data-layer';
import { checkRateLimit, recordRateLimitFailure } from '@/lib/rate-limit';
import { getClientIp, verifySameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  noStore();
  try {
    const testimonials = await fetchApprovedTestimonials();
    return NextResponse.json(
      { success: true, testimonials },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    console.error('Get testimonials error:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب الآراء' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateKey = `testimonial:ip:${clientIp}`;
  const limitStatus = await checkRateLimit(rateKey);
  if (!limitStatus.allowed) {
    return NextResponse.json(
      { success: false, error: 'تم تجاوز حد الإرسال المسموح. يرجى المحاولة لاحقاً.' },
      { status: 429, headers: { 'Retry-After': String(limitStatus.retryAfterSeconds || 60) } }
    );
  }
  await recordRateLimitFailure(rateKey, 15, 15 * 60 * 1000, 15 * 60 * 1000);

  try {
    const body = await request.json();
    const { student_name, content, rating, session_name } = body;

    if (!student_name || !content) {
      return NextResponse.json({ success: false, error: 'الاسم وتفاصيل الرأي مطلوبة' }, { status: 400 });
    }

    if (String(content).trim().length < 10) {
      return NextResponse.json({ success: false, error: 'يرجى كتابة رأي مفيد وتفصيلي' }, { status: 400 });
    }

    const result = await submitTestimonialRecord({
      student_name: String(student_name).trim(),
      content: String(content).trim(),
      rating: Number(rating) || 5,
      session_name: session_name ? String(session_name).trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'شكراً لمشاركتكِ، سيتم مراجعة رأيكِ ونشره قريباً بإذن الله',
      id: result.id,
    });
  } catch (error: unknown) {
    console.error('Create testimonial error:', error);
    return NextResponse.json({ success: false, error: 'فشل إرسال الرأي' }, { status: 500 });
  }
}
