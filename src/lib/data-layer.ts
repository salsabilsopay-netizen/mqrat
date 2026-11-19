import path from 'path';
import fs from 'fs';
import {
  QuranSession,
  StudentApplication,
  StaffApplication,
  Testimonial,
  StatisticsData,
} from '@/types';
import * as sqliteDb from './db';
import { createSupabaseServiceClient } from './supabase/server';

export type DataSourceType = 'sqlite' | 'supabase';

export function getDataSource(): DataSourceType {
  const envVal = (process.env.DATA_SOURCE || 'sqlite').trim().toLowerCase();
  return envVal === 'supabase' ? 'supabase' : 'sqlite';
}

function getLocalUploadDir(): string {
  const dir = process.env.MAQRAAT_UPLOAD_DIR
    ? path.resolve(process.env.MAQRAAT_UPLOAD_DIR)
    : path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ==============================================================================
// 1. QURAN SESSIONS
// ==============================================================================

function extractRegisteredCount(row: Record<string, unknown>): number {
  const rel = row.student_applications as { count?: number }[] | { count?: number } | null;
  if (Array.isArray(rel) && rel.length > 0 && typeof rel[0]?.count === 'number') {
    return rel[0].count;
  }
  if (rel && !Array.isArray(rel) && typeof rel.count === 'number') {
    return rel.count;
  }
  return 0;
}

export async function fetchPublicSessions(): Promise<QuranSession[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getPublicSessions();
  }

  const supabase = createSupabaseServiceClient();
  let rows: Record<string, unknown>[] = [];

  const firstAttempt = await supabase
    .from('sessions')
    .select('id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, max_students, created_at, student_applications(count)')
    .order('created_at', { ascending: true });

  if (firstAttempt.error && (firstAttempt.error.code === '42703' || firstAttempt.error.message.includes('max_students'))) {
    const fallback = await supabase
      .from('sessions')
      .select('id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, created_at, student_applications(count)')
      .order('created_at', { ascending: true });

    if (fallback.error) throw new Error(fallback.error.message);
    rows = (fallback.data || []) as unknown as Record<string, unknown>[];
  } else if (firstAttempt.error) {
    throw new Error(firstAttempt.error.message);
  } else {
    rows = (firstAttempt.data || []) as unknown as Record<string, unknown>[];
  }

  return rows.map((row) => {
    const { student_applications: _omit, ...rest } = row;
    return {
      ...(rest as unknown as QuranSession),
      registered_students_count: extractRegisteredCount(row),
    };
  });
}

export async function fetchAllSessionsAdmin(): Promise<QuranSession[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getAllSessions();
  }

  const supabase = createSupabaseServiceClient();
  let rows: Record<string, unknown>[] = [];

  const firstAttempt = await supabase
    .from('sessions')
    .select('*, session_links(whatsapp_url), student_applications(count)')
    .order('created_at', { ascending: true });

  if (firstAttempt.error && (firstAttempt.error.code === '42703' || firstAttempt.error.message.includes('max_students'))) {
    const fallback = await supabase
      .from('sessions')
      .select('id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, created_at, session_links(whatsapp_url), student_applications(count)')
      .order('created_at', { ascending: true });

    if (fallback.error) throw new Error(fallback.error.message);
    rows = (fallback.data || []) as unknown as Record<string, unknown>[];
  } else if (firstAttempt.error) {
    throw new Error(firstAttempt.error.message);
  } else {
    rows = (firstAttempt.data || []) as unknown as Record<string, unknown>[];
  }

  return rows.map((row) => {
    const linksRel = row.session_links as { whatsapp_url?: string } | { whatsapp_url?: string }[] | null;
    const whatsappUrl = Array.isArray(linksRel)
      ? linksRel[0]?.whatsapp_url || ''
      : linksRel?.whatsapp_url || '';

    const { session_links: _omitLinks, student_applications: _omitStudents, ...rest } = row;
    return {
      ...(rest as unknown as QuranSession),
      whatsapp_url: whatsappUrl,
      registered_students_count: extractRegisteredCount(row),
    };
  });
}

export async function createSessionRecord(
  session: Omit<QuranSession, 'id' | 'created_at'>
): Promise<QuranSession> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.createSession(session);
  }

  const supabase = createSupabaseServiceClient();
  const { whatsapp_url, ...publicFields } = session;

  let created: Record<string, unknown> | null = null;
  const firstRes = await supabase
    .from('sessions')
    .insert(publicFields)
    .select('id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, max_students, created_at')
    .single();

  if (firstRes.error && (firstRes.error.code === '42703' || firstRes.error.message.includes('max_students'))) {
    const { max_students: _omitMax, ...fieldsWithoutMax } = publicFields;
    const fallbackRes = await supabase
      .from('sessions')
      .insert(fieldsWithoutMax)
      .select('id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, created_at')
      .single();

    if (fallbackRes.error || !fallbackRes.data) {
      throw new Error(fallbackRes.error?.message || 'فشل إنشاء الحلقة في Supabase');
    }
    created = fallbackRes.data as unknown as Record<string, unknown>;
  } else if (firstRes.error || !firstRes.data) {
    throw new Error(firstRes.error?.message || 'فشل إنشاء الحلقة في Supabase');
  } else {
    created = firstRes.data as unknown as Record<string, unknown>;
  }

  const createdId = String(created.id);

  if (whatsapp_url) {
    const { error: linkError } = await supabase
      .from('session_links')
      .upsert({ session_id: createdId, whatsapp_url });

    if (linkError) {
      throw new Error(linkError.message);
    }
  }

  return {
    ...(created as unknown as QuranSession),
    whatsapp_url: whatsapp_url || '',
  };
}

export async function updateSessionRecord(
  id: string,
  updates: Partial<QuranSession>
): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.updateSession(id, updates);
  }

  const supabase = createSupabaseServiceClient();
  const { whatsapp_url, id: _omitId, created_at: _omitCreated, registered_students_count: _omitCount, ...publicUpdates } = updates;

  if (Object.keys(publicUpdates).length > 0) {
    const firstRes = await supabase
      .from('sessions')
      .update(publicUpdates)
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (firstRes.error && (firstRes.error.code === '42703' || firstRes.error.message.includes('max_students'))) {
      const { max_students: _omitMax, ...updatesWithoutMax } = publicUpdates;
      const fallbackRes = await supabase
        .from('sessions')
        .update(updatesWithoutMax)
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (fallbackRes.error) throw new Error(fallbackRes.error.message);
      if (!fallbackRes.data) return false;
    } else {
      if (firstRes.error) throw new Error(firstRes.error.message);
      if (!firstRes.data) return false;
    }
  }

  if (typeof whatsapp_url === 'string') {
    const { error: linkErr } = await supabase
      .from('session_links')
      .upsert({
        session_id: id,
        whatsapp_url,
        updated_at: new Date().toISOString(),
      });
    if (linkErr) throw new Error(linkErr.message);
  }

  return true;
}

export async function deleteSessionRecord(id: string): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.deleteSession(id);
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('FOREIGN KEY constraint failed');
    }
    throw new Error(error.message);
  }
  return true;
}

// ==============================================================================
// 2. STUDENT APPLICATIONS
// ==============================================================================

export async function submitStudentRegistration(data: {
  session_id: string;
  full_name: string;
  phone: string;
  email?: string;
  id_type: 'مواطنة' | 'مقيمة' | 'زائرة';
  id_number: string;
  nationality: string;
  residence_country: string;
  residence_city: string;
  birth_date: string;
  is_child: boolean;
  commitment_accepted: boolean;
}): Promise<{ success: boolean; id: string; whatsapp_url?: string }> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.createStudentApplication(data);
  }

  const supabase = createSupabaseServiceClient();

  // Validate session existence, status, and max capacity
  const { data: sessRow } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', data.session_id)
    .maybeSingle();

  if (sessRow && sessRow.status !== 'متاح') {
    throw new Error('التسجيل في هذه الحلقة غير متاح حالياً');
  }

  // Check if max_students is set and count active student applications
  try {
    const { data: sessCap } = await supabase
      .from('sessions')
      .select('max_students')
      .eq('id', data.session_id)
      .maybeSingle();

    if (sessCap && typeof sessCap.max_students === 'number' && sessCap.max_students > 0) {
      const { count } = await supabase
        .from('student_applications')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', data.session_id)
        .in('status', ['pending', 'approved']);

      if (typeof count === 'number' && count >= sessCap.max_students) {
        throw new Error(`عذراً، اكتمل العدد المسموح به في هذه الحلقة (${sessCap.max_students} طالبة)`);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('اكتمل العدد')) {
      throw err;
    }
    // If column max_students doesn't exist yet in Supabase, proceed safely
  }

  const { data: rpcResult, error } = await supabase.rpc('register_student_and_get_link', {
    p_session_id: data.session_id,
    p_full_name: data.full_name,
    p_phone: data.phone,
    p_email: data.email || null,
    p_id_type: data.id_type,
    p_id_number: data.id_number,
    p_nationality: data.nationality,
    p_residence_country: data.residence_country,
    p_residence_city: data.residence_city,
    p_birth_date: data.birth_date,
    p_is_child: data.is_child,
    p_commitment_accepted: data.commitment_accepted,
  });

  if (error) {
    throw new Error(error.message);
  }

  const resObj = rpcResult as { application_id: string; whatsapp_url?: string | null };
  return {
    success: true,
    id: resObj.application_id,
    whatsapp_url: resObj.whatsapp_url || undefined,
  };
}

export async function fetchStudentApplicationsAdmin(
  statusFilter?: string
): Promise<StudentApplication[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getStudentApplications(statusFilter);
  }

  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('student_applications')
    .select('*, sessions(name, teacher_name)')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row: Record<string, unknown>) => {
    const sess = row.sessions as { name?: string; teacher_name?: string } | null;
    const { sessions: _omit, ...rest } = row;
    return {
      ...(rest as unknown as StudentApplication),
      session_name: sess?.name,
      teacher_name: sess?.teacher_name,
    };
  });
}

export async function updateStudentApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  notes?: string
): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.updateStudentStatus(id, status, notes);
  }

  const supabase = createSupabaseServiceClient();
  const payload: Record<string, unknown> = { status };
  if (typeof notes === 'string') payload.notes = notes;

  const { error } = await supabase.from('student_applications').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ==============================================================================
// 3. STAFF APPLICATIONS & PRIVATE DOCUMENT STORAGE
// ==============================================================================

export async function storePrivateDocument(
  safeFilename: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  if (getDataSource() === 'sqlite') {
    const filePath = path.join(getLocalUploadDir(), safeFilename);
    fs.writeFileSync(filePath, buffer);
    return;
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage
    .from('staff-documents')
    .upload(safeFilename, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`فشل حفظ المرفق سحابياً: ${error.message}`);
  }
}

export async function deletePrivateDocuments(filenames: string[]): Promise<void> {
  if (filenames.length === 0) return;

  if (getDataSource() === 'sqlite') {
    const dir = getLocalUploadDir();
    for (const name of filenames) {
      const p = path.join(dir, path.basename(name));
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {
        // ignore rollback cleanup failure
      }
    }
    return;
  }

  try {
    const supabase = createSupabaseServiceClient();
    await supabase.storage.from('staff-documents').remove(filenames);
  } catch {
    // ignore rollback cleanup failure
  }
}

export async function readPrivateDocument(safeFilename: string): Promise<Buffer | null> {
  if (getDataSource() === 'sqlite') {
    const uploadDir = getLocalUploadDir();
    const filePath = path.join(uploadDir, safeFilename);
    if (!path.resolve(filePath).startsWith(path.resolve(uploadDir))) {
      return null;
    }
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from('staff-documents')
    .download(safeFilename);

  if (error || !data) return null;
  const arrBuf = await data.arrayBuffer();
  return Buffer.from(arrBuf);
}

export async function submitStaffRegistration(
  data: Omit<StaffApplication, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; id: string }> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.createStaffApplication(data);
  }

  const supabase = createSupabaseServiceClient();
  let certsArray: string[] = [];
  try {
    certsArray = JSON.parse(data.certificates_urls);
  } catch {
    certsArray = [];
  }

  const { data: created, error } = await supabase
    .from('staff_applications')
    .insert({
      role: data.role,
      full_name: data.full_name,
      id_type: data.id_type,
      id_number: data.id_number,
      id_expiry_date: data.id_expiry_date,
      nationality: data.nationality,
      gender: 'أنثى',
      birth_place: data.birth_place,
      birth_date_hijri: data.birth_date_hijri,
      qualification: data.qualification,
      major: data.major,
      workplace: data.workplace,
      job_title: data.job_title,
      phone: data.phone,
      region: data.region,
      city: data.city,
      district: data.district,
      street: data.street,
      building_number: data.building_number,
      apartment_number: data.apartment_number,
      email: data.email,
      x_account: data.x_account || null,
      signature_url: data.signature_url,
      certificates_urls: certsArray,
      commitment_accepted: data.commitment_accepted,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(error?.message || 'فشل حفظ طلب التقديم');
  }

  return { success: true, id: created.id };
}

export async function fetchStaffApplicationsAdmin(
  role?: 'معلمة' | 'مشرفة',
  statusFilter?: string
): Promise<StaffApplication[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getStaffApplications(role, statusFilter);
  }

  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('staff_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as StaffApplication),
    certificates_urls: Array.isArray(row.certificates_urls)
      ? JSON.stringify(row.certificates_urls)
      : String(row.certificates_urls || '[]'),
  }));
}

export async function getStaffApplicationById(id: string): Promise<StaffApplication | null> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getStaffApplicationById(id);
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('staff_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    ...(row as unknown as StaffApplication),
    certificates_urls: Array.isArray(row.certificates_urls)
      ? JSON.stringify(row.certificates_urls)
      : String(row.certificates_urls || '[]'),
  };
}

export async function updateStaffApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  notes?: string
): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.updateStaffStatus(id, status, notes);
  }

  const supabase = createSupabaseServiceClient();
  const payload: Record<string, unknown> = { status };
  if (typeof notes === 'string') payload.notes = notes;

  const { error } = await supabase.from('staff_applications').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ==============================================================================
// 4. TESTIMONIALS
// ==============================================================================

export async function fetchApprovedTestimonials(): Promise<Testimonial[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getApprovedTestimonials();
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, student_name, content, rating, session_name, is_approved, created_at')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Testimonial[];
}

export async function fetchAllTestimonialsAdmin(): Promise<Testimonial[]> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getAllTestimonials();
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Testimonial[];
}

export async function submitTestimonialRecord(data: {
  student_name: string;
  content: string;
  rating: number;
  session_name?: string;
}): Promise<{ success: boolean; id: string }> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.createTestimonial(data);
  }

  const supabase = createSupabaseServiceClient();
  const { data: created, error } = await supabase
    .from('testimonials')
    .insert({
      student_name: data.student_name,
      content: data.content,
      rating: Math.min(5, Math.max(1, data.rating)),
      session_name: data.session_name || null,
      is_approved: false,
    })
    .select('id')
    .single();

  if (error || !created) throw new Error(error?.message || 'فشل إرسال الرأي');
  return { success: true, id: created.id };
}

export async function updateTestimonialApprovalAdmin(
  id: string,
  is_approved: boolean
): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.updateTestimonialApproval(id, is_approved);
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('testimonials')
    .update({ is_approved })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

export async function deleteTestimonialRecordAdmin(id: string): Promise<boolean> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.deleteTestimonial(id);
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ==============================================================================
// 5. STATISTICS & AUDIT LOGS
// ==============================================================================

export async function fetchPublicStatistics(): Promise<StatisticsData> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getPublicStatistics();
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc('get_public_institution_statistics');
  if (error) throw new Error(error.message);
  return data as StatisticsData;
}

export async function fetchAdminDashboardStatistics(): Promise<StatisticsData> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getAdminDashboardStats();
  }

  const supabase = createSupabaseServiceClient();
  const [
    publicStats,
    totalStudentsRes,
    pendingStudentsRes,
    totalStaffRes,
    pendingStaffRes,
    totalSessionsRes,
    activeSessionsRes,
  ] = await Promise.all([
    fetchPublicStatistics(),
    supabase.from('student_applications').select('*', { count: 'exact', head: true }),
    supabase.from('student_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('staff_applications').select('*', { count: 'exact', head: true }),
    supabase.from('staff_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'متاح'),
  ]);

  return {
    ...publicStats,
    total_student_applications: totalStudentsRes.count || 0,
    pending_student_applications: pendingStudentsRes.count || 0,
    total_staff_applications: totalStaffRes.count || 0,
    pending_staff_applications: pendingStaffRes.count || 0,
    total_sessions: totalSessionsRes.count || 0,
    active_sessions: activeSessionsRes.count || 0,
  };
}

export async function recordAuditLog(
  admin_user: string,
  action: string,
  target_type: string,
  target_id?: string,
  details?: string
): Promise<void> {
  if (getDataSource() === 'sqlite') {
    sqliteDb.logAdminAction(admin_user, action, target_type, target_id, details);
    return;
  }

  const supabase = createSupabaseServiceClient();
  await supabase.from('audit_logs').insert({
    admin_user,
    action,
    target_type,
    target_id: target_id || null,
    details: details ? { message: details } : null,
  });
}

export async function fetchAuditLogsAdmin(limit: number = 50) {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.getAuditLogs(limit);
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    details:
      typeof row.details === 'object' && row.details !== null
        ? (row.details as { message?: string }).message || JSON.stringify(row.details)
        : row.details || null,
  }));
}
