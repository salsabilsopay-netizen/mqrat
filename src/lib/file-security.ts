import crypto from 'node:crypto';

export type AllowedFileCategory = 'signature' | 'certificate';

export interface ValidatedFile {
  buffer: Buffer;
  safeFilename: string;
  extension: '.png' | '.jpg' | '.pdf';
  mimeType: string;
  size: number;
}

export const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CERTIFICATES_COUNT = 5;
export const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

type DetectedFileFormat = {
  ext: '.png' | '.jpg' | '.pdf';
  mime: string;
};

/**
 * Inspects actual binary magic bytes of a file buffer.
 * Rejects disguised executables, SVG scripts, HTML, PHP, etc.
 */
function detectMagicFormat(buffer: Buffer): DetectedFileFormat | null {
  if (!buffer || buffer.length < 8) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: '.png', mime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { ext: '.pdf', mime: 'application/pdf' };
  }

  return null;
}

/**
 * Validates an uploaded File object against size, magic bytes, and allowed formats.
 * Never trusts client-supplied filename extension or MIME header alone.
 */
export async function validateUploadedFile(
  file: File,
  category: AllowedFileCategory
): Promise<ValidatedFile> {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size <= 0) {
    throw new Error('الملف المرفق فارغ أو غير صالح');
  }

  if (file.size > MAX_SINGLE_FILE_BYTES) {
    throw new Error('حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت)');
  }

  // Reject dangerous MIME hints immediately before buffering if obvious
  const lowerType = (file.type || '').toLowerCase();
  if (lowerType.includes('svg') || lowerType.includes('html') || lowerType.includes('javascript')) {
    throw new Error('نوع الملف المرفوع غير مسموح به لأسباب أمنية');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_SINGLE_FILE_BYTES) {
    throw new Error('حجم الملف الفعلي يتجاوز الحد الأقصى المسموح به (5 ميجابايت)');
  }

  const detected = detectMagicFormat(buffer);
  if (!detected) {
    throw new Error(
      category === 'signature'
        ? 'صيغة ملف التوقيع غير مدعومة. الصيغ المسموحة فقط: PNG أو JPG'
        : 'صيغة ملف الشهادة غير مدعومة. الصيغ المسموحة فقط: PDF أو PNG أو JPG'
    );
  }

  if (category === 'signature' && detected.ext === '.pdf') {
    throw new Error('ملف التوقيع يجب أن يكون صورة بصيغة PNG أو JPG فقط');
  }

  const prefix = category === 'signature' ? 'sig' : 'cert';
  const safeFilename = `${prefix}_${crypto.randomUUID()}${detected.ext}`;

  return {
    buffer,
    safeFilename,
    extension: detected.ext,
    mimeType: detected.mime,
    size: buffer.length,
  };
}

/**
 * Validates that a requested filename in /api/admin/files/[filename] matches
 * our strict cryptographic naming pattern and contains no path traversal characters.
 */
export function isSafeStoredFilename(filename: string): boolean {
  return /^(sig|cert)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|pdf)$/i.test(
    filename
  ) || /^(sig|cert)_[0-9]+_[a-z0-9]+\.(png|jpg|jpeg|pdf)$/i.test(filename);
}
