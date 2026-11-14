import { NextRequest, NextResponse } from 'next/server';
import {
  storePrivateDocument,
  deletePrivateDocuments,
  submitStaffRegistration,
} from '@/lib/data-layer';
import { checkRateLimit, recordRateLimitFailure } from '@/lib/rate-limit';
import {
  MAX_CERTIFICATES_COUNT,
  MAX_TOTAL_UPLOAD_BYTES,
  validateUploadedFile,
  ValidatedFile,
} from '@/lib/file-security';
import { getClientIp, verifySameOrigin } from '@/lib/security';

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'طلب غير مصرح به (CSRF)' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rateKey = `reg_staff:ip:${clientIp}`;
  const limitStatus = await checkRateLimit(rateKey);
  if (!limitStatus.allowed) {
    return NextResponse.json(
      { success: false, error: 'تم تجاوز حد الطلبات المسموح. يرجى المحاولة لاحقاً.' },
      { status: 429, headers: { 'Retry-After': String(limitStatus.retryAfterSeconds || 60) } }
    );
  }
  await recordRateLimitFailure(rateKey, 20, 15 * 60 * 1000, 15 * 60 * 1000);

  const storedFiles: string[] = [];

  try {
    const formData = await request.formData();

    const roleRaw = (formData.get('role') as string)?.trim();
    if (roleRaw !== 'معلمة' && roleRaw !== 'مشرفة') {
      return NextResponse.json({ success: false, error: 'الصفة المطلوبة غير صالحة' }, { status: 400 });
    }
    const role = roleRaw as 'معلمة' | 'مشرفة';

    const full_name = (formData.get('full_name') as string)?.trim();
    const id_type = (formData.get('id_type') as string)?.trim();
    const id_number = (formData.get('id_number') as string)?.trim();
    const id_expiry_date = (formData.get('id_expiry_date') as string)?.trim();
    const nationality = (formData.get('nationality') as string)?.trim();
    const birth_place = (formData.get('birth_place') as string)?.trim();
    const birth_date_hijri = (formData.get('birth_date_hijri') as string)?.trim();
    const qualification = (formData.get('qualification') as string)?.trim();
    const major = (formData.get('major') as string)?.trim();
    const workplace = (formData.get('workplace') as string)?.trim();
    const job_title = (formData.get('job_title') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();
    const region = (formData.get('region') as string)?.trim();
    const city = (formData.get('city') as string)?.trim();
    const district = (formData.get('district') as string)?.trim();
    const street = (formData.get('street') as string)?.trim();
    const building_number = (formData.get('building_number') as string)?.trim();
    const apartment_number = (formData.get('apartment_number') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const x_account = (formData.get('x_account') as string)?.trim() || undefined;
    const commitment_accepted =
      formData.get('commitment_accepted') === 'true' || formData.get('commitment_accepted') === '1';

    if (
      !full_name || !id_type || !id_number || !id_expiry_date ||
      !nationality || !birth_place || !birth_date_hijri || !qualification ||
      !major || !workplace || !job_title || !phone || !region || !city ||
      !district || !street || !building_number || !apartment_number || !email
    ) {
      return NextResponse.json(
        { success: false, error: 'يرجى استكمال جميع البيانات المطلوبة بدقة' },
        { status: 400 }
      );
    }

    if (!commitment_accepted) {
      return NextResponse.json(
        { success: false, error: 'يجب الإقرار والموافقة على التعهد للمتابعة' },
        { status: 400 }
      );
    }

    // 1. Validate Signature File (Binary Magic Bytes + Size)
    const signatureFile = formData.get('signature_file') as File | null;
    if (!signatureFile || signatureFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'صورة التوقيع مطلوبة وإلزامية' },
        { status: 400 }
      );
    }

    let validatedSig: ValidatedFile;
    try {
      validatedSig = await validateUploadedFile(signatureFile, 'signature');
    } catch (err: unknown) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'ملف التوقيع غير صالح' },
        { status: 400 }
      );
    }

    // 2. Validate Certificates Files
    const rawCerts = (formData.getAll('certificates_files') as File[]).filter(
      (f) => f && f.size > 0
    );

    if (rawCerts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يرجى إرفاق صورة أو ملف المؤهل العلمي / الشهادات' },
        { status: 400 }
      );
    }

    if (rawCerts.length > MAX_CERTIFICATES_COUNT) {
      return NextResponse.json(
        { success: false, error: `الحد الأقصى لعدد ملفات الشهادات هو ${MAX_CERTIFICATES_COUNT} ملفات` },
        { status: 400 }
      );
    }

    const validatedCerts: ValidatedFile[] = [];
    let totalBytes = validatedSig.size;

    for (const file of rawCerts) {
      totalBytes += file.size;
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        return NextResponse.json(
          { success: false, error: 'إجمالي حجم المرفقات يتجاوز الحد المسموح (20 ميجابايت)' },
          { status: 400 }
        );
      }

      try {
        const validated = await validateUploadedFile(file, 'certificate');
        validatedCerts.push(validated);
      } catch (err: unknown) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'أحد ملفات الشهادات غير صالح' },
          { status: 400 }
        );
      }
    }

    // 3. Store validated files securely (SQLite disk or Supabase Private Bucket)
    await storePrivateDocument(validatedSig.safeFilename, validatedSig.buffer, validatedSig.mimeType);
    storedFiles.push(validatedSig.safeFilename);

    const savedCertNames: string[] = [];
    for (const cert of validatedCerts) {
      await storePrivateDocument(cert.safeFilename, cert.buffer, cert.mimeType);
      storedFiles.push(cert.safeFilename);
      savedCertNames.push(cert.safeFilename);
    }

    // 4. Persist staff application in active database
    const result = await submitStaffRegistration({
      role,
      full_name,
      id_type,
      id_number,
      id_expiry_date,
      nationality,
      gender: 'أنثى',
      birth_place,
      birth_date_hijri,
      qualification,
      major,
      workplace,
      job_title,
      phone,
      region,
      city,
      district,
      street,
      building_number,
      apartment_number,
      email,
      x_account,
      signature_url: validatedSig.safeFilename,
      certificates_urls: JSON.stringify(savedCertNames),
      commitment_accepted: true,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلبكم بنجاح إلى إدارة مقرأة الهدى',
      application_id: result.id,
    });
  } catch (error: unknown) {
    // Atomic rollback if DB persistence fails
    await deletePrivateDocuments(storedFiles);
    console.error('Staff registration error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة طلب التسجيل. يرجى المحاولة مجدداً' },
      { status: 500 }
    );
  }
}
