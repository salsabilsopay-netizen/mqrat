import { NextRequest, NextResponse } from 'next/server';
import { submitStudentRegistration } from '@/lib/data-layer';
import { checkRateLimit, recordRateLimitFailure } from '@/lib/rate-limit';
import { getClientIp, verifySameOrigin } from '@/lib/security';

function calculateIsChild(birthDateStr: string): boolean {
  const dob = new Date(birthDateStr);
  if (isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age < 16;
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateKey = `reg_stu:ip:${clientIp}`;
  const limitStatus = await checkRateLimit(rateKey);
  if (!limitStatus.allowed) {
    return NextResponse.json(
      { success: false, error: 'تم تجاوز حد الطلبات المسموح. يرجى المحاولة لاحقاً.' },
      { status: 429, headers: { 'Retry-After': String(limitStatus.retryAfterSeconds || 60) } }
    );
  }
  await recordRateLimitFailure(rateKey, 25, 15 * 60 * 1000, 15 * 60 * 1000);

  try {
    const body = await request.json();

    const {
      session_id,
      full_name,
      phone,
      email,
      id_type,
      id_number,
      nationality,
      residence_country,
      residence_city,
      birth_date,
      commitment_accepted,
    } = body;

    if (
      !session_id ||
      !full_name ||
      !phone ||
      !id_type ||
      !id_number ||
      !nationality ||
      !residence_country ||
      !residence_city ||
      !birth_date
    ) {
      return NextResponse.json(
        { success: false, error: 'يرجى تعبئة جميع الحقول الإلزامية بدقة' },
        { status: 400 }
      );
    }

    if (
      String(full_name).trim().length < 3 ||
      String(phone).trim().length < 7 ||
      String(id_number).trim().length < 5
    ) {
      return NextResponse.json(
        { success: false, error: 'الاسم أو رقم الجوال أو رقم الهوية المدخل غير مكتمل' },
        { status: 400 }
      );
    }

    if (!['مواطنة', 'مقيمة', 'زائرة'].includes(id_type)) {
      return NextResponse.json({ success: false, error: 'نوع الهوية غير صالح' }, { status: 400 });
    }

    if (commitment_accepted !== true) {
      return NextResponse.json(
        { success: false, error: 'يجب الموافقة على تعهد الطالبة للمتابعة' },
        { status: 400 }
      );
    }

    const is_child = calculateIsChild(String(birth_date));

    const result = await submitStudentRegistration({
      session_id: String(session_id).trim(),
      full_name: String(full_name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      id_type,
      id_number: String(id_number).trim(),
      nationality: String(nationality).trim(),
      residence_country: String(residence_country).trim(),
      residence_city: String(residence_city).trim(),
      birth_date: String(birth_date).trim(),
      is_child,
      commitment_accepted: true,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل طلبك بنجاح في مقرأة الهدى',
      application_id: result.id,
      whatsapp_url: result.whatsapp_url || null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ طلب التسجيل';
    const safeMessages = [
      'الحلقة المختارة غير موجودة',
      'التسجيل في هذه الحلقة غير متاح حالياً',
      'يجب الموافقة على تعهد الطالبة للمتابعة',
      'البيانات المدخلة غير مكتملة أو غير صالحة',
    ];
    return NextResponse.json(
      { success: false, error: safeMessages.includes(msg) ? msg : 'حدث خطأ أثناء حفظ طلب التسجيل' },
      { status: 400 }
    );
  }
}
