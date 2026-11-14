import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { isSafeStoredFilename } from '@/lib/file-security';
import { readPrivateDocument } from '@/lib/data-layer';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  if (!(await isAdminAuthenticated(request))) {
    return new NextResponse('غير مصرح بالوصول للمستندات الخاصة', { status: 401 });
  }

  const safeFilename = path.basename(params.filename || '');
  if (!safeFilename || !isSafeStoredFilename(safeFilename)) {
    return new NextResponse('اسم الملف غير صالح', { status: 400 });
  }

  const fileBuffer = await readPrivateDocument(safeFilename);
  if (!fileBuffer) {
    return new NextResponse('الملف غير موجود', { status: 404 });
  }

  const ext = path.extname(safeFilename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.pdf') contentType = 'application/pdf';

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
