import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getStaffApplicationById, recordAuditLog } from '@/lib/data-layer';
import { mapStaffToForm261 } from '@/lib/form261/mapper';
import { renderForm261Html } from '@/lib/form261/template';
import { generateForm261PdfBuffer } from '@/lib/form261/pdf-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  noStore();

  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح بالوصول إلى استمارات المعلمات والمشرفات' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  const rawId = (params?.id || '').trim();
  if (!rawId || rawId.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(rawId)) {
    return NextResponse.json(
      { success: false, error: 'معرف الطلب غير صالح' },
      { status: 400 }
    );
  }

  try {
    const staff = await getStaffApplicationById(rawId);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'طلب التقديم غير موجود' },
        { status: 404 }
      );
    }

    const formData = mapStaffToForm261(staff);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const isDownload = searchParams.get('download') === '1';

    if (format === 'html') {
      const html = renderForm261Html(formData);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; frame-ancestors 'self';",
        },
      });
    }

    const pdfBuffer = await generateForm261PdfBuffer(formData);

    await recordAuditLog(
      admin.username,
      isDownload ? 'تحميل استمارة الوزارة (261) PDF' : 'عرض PDF استمارة الوزارة (261)',
      'staff_application',
      staff.id,
      `إصدار نموذج (261) — ${staff.role}`
    );

    const disposition = isDownload ? 'attachment' : 'inline';
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="form-261-${rawId}.pdf"`,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  } catch (error: unknown) {
    // Log only non-sensitive metadata; never log national ID, phone, or personal details
    console.error(
      'Form 261 generation error for applicationId=',
      rawId,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'تعذر توليد استمارة الوزارة (261) حاليًا' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
