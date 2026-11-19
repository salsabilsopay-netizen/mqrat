import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { QuranSession, StudentApplication, StaffApplication, Testimonial, StatisticsData } from '@/types';
import { hashPassword, verifyPassword } from './password';

const DB_PATH = process.env.MAQRAAT_DB_PATH
  ? path.resolve(process.env.MAQRAAT_DB_PATH)
  : path.join(process.cwd(), 'data', 'maqraat_huda.db');

let _db: DatabaseSync | null = null;
let _currentDbPath: string | null = null;

function generateSafeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

export function getDb(): DatabaseSync {
  if (!_db || _currentDbPath !== DB_PATH) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (_db) {
      try {
        _db.close();
      } catch {
        // ignore
      }
    }
    _db = new DatabaseSync(DB_PATH);
    _currentDbPath = DB_PATH;
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA foreign_keys = ON;');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      days_count TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      days_schedule TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'متاح',
      whatsapp_url TEXT,
      max_students INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_applications (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      nationality TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'أنثى',
      residence_country TEXT NOT NULL,
      residence_city TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      is_child INTEGER NOT NULL DEFAULT 0,
      commitment_accepted INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS staff_applications (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      id_expiry_date TEXT NOT NULL,
      nationality TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'أنثى',
      birth_place TEXT NOT NULL,
      birth_date_hijri TEXT NOT NULL,
      qualification TEXT NOT NULL,
      major TEXT NOT NULL,
      workplace TEXT NOT NULL,
      job_title TEXT NOT NULL,
      phone TEXT NOT NULL,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      street TEXT NOT NULL,
      building_number TEXT NOT NULL,
      apartment_number TEXT NOT NULL,
      email TEXT NOT NULL,
      x_account TEXT,
      signature_url TEXT NOT NULL,
      certificates_urls TEXT NOT NULL,
      commitment_accepted INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      session_name TEXT,
      is_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_user TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_start TEXT NOT NULL,
      blocked_until TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_students_status ON student_applications(status);
    CREATE INDEX IF NOT EXISTS idx_students_session ON student_applications(session_id);
    CREATE INDEX IF NOT EXISTS idx_staff_role_status ON staff_applications(role, status);
    CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
  `);

  // Migrate existing sessions table to have max_students column if missing
  try {
    db.exec('ALTER TABLE sessions ADD COLUMN max_students INTEGER DEFAULT NULL;');
  } catch {
    // Column already exists
  }

  // Transparently migrate any legacy plaintext admin passwords to salted scrypt hashes
  const admins = db.prepare('SELECT id, password_hash FROM admin_users').all() as { id: string; password_hash: string }[];
  for (const admin of admins) {
    if (admin.password_hash && !admin.password_hash.startsWith('scrypt$')) {
      const upgradedHash = hashPassword(admin.password_hash);
      db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(upgradedHash, admin.id);
    }
  }

  // Bootstrap initial admin ONLY if table is empty and ADMIN_BOOTSTRAP_PASSWORD is provided via env
  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get() as { cnt: number };
  if (adminCount.cnt === 0 && process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    const bootstrapUser = process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin';
    const hashed = hashPassword(process.env.ADMIN_BOOTSTRAP_PASSWORD);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateSafeId('adm'), bootstrapUser, hashed, 'إدارة مقرأة الهدى', 'superadmin', new Date().toISOString());
  }
}

// Data access operations
export function getPublicSessions(): QuranSession[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.name, s.teacher_name, s.platform, s.days_count, s.time_slot, s.days_schedule, s.status, s.max_students, s.created_at,
      (SELECT COUNT(*) FROM student_applications sa WHERE sa.session_id = s.id AND sa.status IN ('pending', 'approved')) AS registered_students_count
    FROM sessions s
    ORDER BY s.created_at ASC
  `).all() as unknown as QuranSession[];
}

export function getAllSessions(): QuranSession[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM student_applications sa WHERE sa.session_id = s.id AND sa.status IN ('pending', 'approved')) AS registered_students_count
    FROM sessions s
    ORDER BY s.created_at ASC
  `).all() as unknown as QuranSession[];
}

export function getSessionById(id: string): QuranSession | null {
  const db = getDb();
  const session = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM student_applications sa WHERE sa.session_id = s.id AND sa.status IN ('pending', 'approved')) AS registered_students_count
    FROM sessions s
    WHERE s.id = ?
  `).get(id);
  return (session as unknown as QuranSession) || null;
}

export function createSession(session: Omit<QuranSession, 'id' | 'created_at'>): QuranSession {
  const db = getDb();
  const id = generateSafeId('sess');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO sessions (id, name, teacher_name, platform, days_count, time_slot, days_schedule, status, whatsapp_url, max_students, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    session.name,
    session.teacher_name,
    session.platform,
    session.days_count,
    session.time_slot,
    session.days_schedule,
    session.status,
    session.whatsapp_url || '',
    session.max_students ?? null,
    now
  );

  return { id, ...session, created_at: now };
}

export function updateSession(id: string, updates: Partial<QuranSession>): boolean {
  const db = getDb();
  const existing = getSessionById(id);
  if (!existing) return false;

  const merged = { ...existing, ...updates };
  db.prepare(`
    UPDATE sessions
    SET name = ?, teacher_name = ?, platform = ?, days_count = ?, time_slot = ?, days_schedule = ?, status = ?, whatsapp_url = ?, max_students = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.teacher_name,
    merged.platform,
    merged.days_count,
    merged.time_slot,
    merged.days_schedule,
    merged.status,
    merged.whatsapp_url || '',
    merged.max_students ?? null,
    id
  );

  return true;
}

export function deleteSession(id: string): boolean {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return true;
}

// Student Applications
export function createStudentApplication(data: {
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
}): { success: boolean; id: string; whatsapp_url?: string } {
  const db = getDb();
  const id = generateSafeId('stu');
  const now = new Date().toISOString();

  // Look up session to ensure it exists and get WhatsApp URL
  const session = getSessionById(data.session_id);
  if (!session) {
    throw new Error('الحلقة المختارة غير موجودة');
  }
  if (session.status !== 'متاح') {
    throw new Error('التسجيل في هذه الحلقة غير متاح حالياً');
  }

  // Capacity check
  if (session.max_students && session.max_students > 0) {
    const countRow = db.prepare(`
      SELECT COUNT(*) as cnt FROM student_applications
      WHERE session_id = ? AND status IN ('pending', 'approved')
    `).get(data.session_id) as { cnt: number };

    if (countRow && countRow.cnt >= session.max_students) {
      throw new Error(`عذراً، اكتمل العدد المسموح به في هذه الحلقة (${session.max_students} طالبة)`);
    }
  }

  db.prepare(`
    INSERT INTO student_applications (
      id, session_id, full_name, phone, email, id_type, id_number,
      nationality, gender, residence_country, residence_city,
      birth_date, is_child, commitment_accepted, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'أنثى', ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    data.session_id,
    data.full_name,
    data.phone,
    data.email || null,
    data.id_type,
    data.id_number,
    data.nationality,
    data.residence_country,
    data.residence_city,
    data.birth_date,
    data.is_child ? 1 : 0,
    data.commitment_accepted ? 1 : 0,
    now
  );

  return {
    success: true,
    id,
    whatsapp_url: session.whatsapp_url || undefined,
  };
}

export function getStudentApplications(statusFilter?: string): StudentApplication[] {
  const db = getDb();
  let query = `
    SELECT s.*, sess.name as session_name, sess.teacher_name
    FROM student_applications s
    LEFT JOIN sessions sess ON s.session_id = sess.id
  `;
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'all') {
    query += ' WHERE s.status = ?';
    params.push(statusFilter);
  }
  query += ' ORDER BY s.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    ...r,
    is_child: Boolean(r.is_child),
    commitment_accepted: Boolean(r.commitment_accepted),
  }));
}

export function updateStudentStatus(id: string, status: 'pending' | 'approved' | 'rejected', notes?: string): boolean {
  const db = getDb();
  db.prepare(`
    UPDATE student_applications
    SET status = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, notes || null, id);
  return true;
}

// Staff Applications
export function createStaffApplication(data: Omit<StaffApplication, 'id' | 'created_at' | 'status'>): { success: boolean; id: string } {
  const db = getDb();
  const id = generateSafeId('stf');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO staff_applications (
      id, role, full_name, id_type, id_number, id_expiry_date,
      nationality, gender, birth_place, birth_date_hijri, qualification,
      major, workplace, job_title, phone, region, city, district,
      street, building_number, apartment_number, email, x_account,
      signature_url, certificates_urls, commitment_accepted, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'أنثى', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    data.role,
    data.full_name,
    data.id_type,
    data.id_number,
    data.id_expiry_date,
    data.nationality,
    data.birth_place,
    data.birth_date_hijri,
    data.qualification,
    data.major,
    data.workplace,
    data.job_title,
    data.phone,
    data.region,
    data.city,
    data.district,
    data.street,
    data.building_number,
    data.apartment_number,
    data.email,
    data.x_account || null,
    data.signature_url,
    data.certificates_urls,
    data.commitment_accepted ? 1 : 0,
    now
  );

  return { success: true, id };
}

export function getStaffApplications(role?: 'معلمة' | 'مشرفة', statusFilter?: string): StaffApplication[] {
  const db = getDb();
  let query = 'SELECT * FROM staff_applications WHERE 1=1';
  const params: any[] = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (statusFilter && statusFilter !== 'all') {
    query += ' AND status = ?';
    params.push(statusFilter);
  }
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    ...r,
    commitment_accepted: Boolean(r.commitment_accepted),
  }));
}

export function getStaffApplicationById(id: string): StaffApplication | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM staff_applications WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...(row as unknown as StaffApplication),
    commitment_accepted: Boolean(row.commitment_accepted),
  };
}

export function updateStaffStatus(id: string, status: 'pending' | 'approved' | 'rejected', notes?: string): boolean {
  const db = getDb();
  db.prepare(`
    UPDATE staff_applications
    SET status = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, notes || null, id);
  return true;
}

// Testimonials
export function getApprovedTestimonials(): Testimonial[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, student_name, content, rating, session_name, is_approved, created_at
    FROM testimonials
    WHERE is_approved = 1
    ORDER BY created_at DESC
  `).all() as any[];

  return rows.map(r => ({ ...r, is_approved: Boolean(r.is_approved) }));
}

export function getAllTestimonials(): Testimonial[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM testimonials ORDER BY created_at DESC
  `).all() as any[];

  return rows.map(r => ({ ...r, is_approved: Boolean(r.is_approved) }));
}

export function createTestimonial(data: { student_name: string; content: string; rating: number; session_name?: string }): { success: boolean; id: string } {
  const db = getDb();
  const id = generateSafeId('tst');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO testimonials (id, student_name, content, rating, session_name, is_approved, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(id, data.student_name, data.content, Math.min(5, Math.max(1, data.rating)), data.session_name || null, now);

  return { success: true, id };
}

export function updateTestimonialApproval(id: string, is_approved: boolean): boolean {
  const db = getDb();
  db.prepare('UPDATE testimonials SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, id);
  return true;
}

export function deleteTestimonial(id: string): boolean {
  const db = getDb();
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  return true;
}

// Dynamic Statistics Calculation
// Rules:
// 1. Never expose individual personal info.
// 2. Clear distinction between submitted and approved.
// 3. Dynamic grouping by actual country field.
export function getPublicStatistics(): StatisticsData {
  const db = getDb();

  // Aggregate approved students
  const totalStudentsRow = db.prepare(`
    SELECT COUNT(*) as count FROM student_applications WHERE status = 'approved'
  `).get() as { count: number };

  const adultStudentsRow = db.prepare(`
    SELECT COUNT(*) as count FROM student_applications WHERE status = 'approved' AND is_child = 0
  `).get() as { count: number };

  const childStudentsRow = db.prepare(`
    SELECT COUNT(*) as count FROM student_applications WHERE status = 'approved' AND is_child = 1
  `).get() as { count: number };

  // Aggregate approved teachers
  const teachersRow = db.prepare(`
    SELECT COUNT(*) as count FROM staff_applications WHERE role = 'معلمة' AND status = 'approved'
  `).get() as { count: number };

  // Aggregate approved supervisors
  const supervisorsRow = db.prepare(`
    SELECT COUNT(*) as count FROM staff_applications WHERE role = 'مشرفة' AND status = 'approved'
  `).get() as { count: number };

  // Aggregate countries from approved student registrations only
  const countriesRows = db.prepare(`
    SELECT residence_country as country, COUNT(*) as count
    FROM student_applications
    WHERE status = 'approved' AND residence_country IS NOT NULL AND TRIM(residence_country) != ''
    GROUP BY residence_country
    ORDER BY count DESC
  `).all() as unknown as { country: string; count: number }[];

  return {
    total_students: totalStudentsRow.count,
    adult_students: adultStudentsRow.count,
    child_students: childStudentsRow.count,
    total_teachers: teachersRow.count,
    total_supervisors: supervisorsRow.count,
    countries: countriesRows,
  };
}

export function getAdminDashboardStats(): StatisticsData {
  const db = getDb();
  const publicStats = getPublicStatistics();

  const totalStudentApps = (db.prepare('SELECT COUNT(*) as count FROM student_applications').get() as { count: number }).count;
  const pendingStudentApps = (db.prepare("SELECT COUNT(*) as count FROM student_applications WHERE status = 'pending'").get() as { count: number }).count;

  const totalStaffApps = (db.prepare('SELECT COUNT(*) as count FROM staff_applications').get() as { count: number }).count;
  const pendingStaffApps = (db.prepare("SELECT COUNT(*) as count FROM staff_applications WHERE status = 'pending'").get() as { count: number }).count;

  const totalSessions = (db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }).count;
  const activeSessions = (db.prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'متاح'").get() as { count: number }).count;

  return {
    ...publicStats,
    total_student_applications: totalStudentApps,
    pending_student_applications: pendingStudentApps,
    total_staff_applications: totalStaffApps,
    pending_staff_applications: pendingStaffApps,
    total_sessions: totalSessions,
    active_sessions: activeSessions,
  };
}

// Audit Logs
export function logAdminAction(admin_user: string, action: string, target_type: string, target_id?: string, details?: string) {
  const db = getDb();
  const id = generateSafeId('log');
  db.prepare(`
    INSERT INTO audit_logs (id, admin_user, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, admin_user, action, target_type, target_id || null, details || null, new Date().toISOString());
}

export function getAuditLogs(limit: number = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
}

// Secure Admin Credentials & Revocable Sessions
export function verifyAdminCredentials(
  username: string,
  password: string
): { id: string; username: string; name: string; role: string } | null {
  const db = getDb();
  const admin = db.prepare(
    'SELECT id, username, password_hash, name, role FROM admin_users WHERE username = ?'
  ).get(username.trim()) as { id: string; username: string; password_hash: string; name: string; role: string } | undefined;

  if (!admin) return null;

  const { valid, needsRehash } = verifyPassword(password, admin.password_hash);
  if (!valid) return null;

  if (needsRehash) {
    const newHash = hashPassword(password);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, admin.id);
  }

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
  };
}

export function createAdminSessionRecord(data: {
  id: string;
  admin_id: string;
  username: string;
  role: string;
  expires_at: string;
  ip_address?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO admin_sessions (id, admin_id, username, role, expires_at, revoked_at, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(data.id, data.admin_id, data.username, data.role, data.expires_at, data.ip_address || null, new Date().toISOString());
}

export function getActiveAdminSession(
  sessionId: string
): { id: string; admin_id: string; username: string; role: string } | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, admin_id, username, role, expires_at, revoked_at
    FROM admin_sessions
    WHERE id = ?
  `).get(sessionId) as
    | { id: string; admin_id: string; username: string; role: string; expires_at: string; revoked_at: string | null }
    | undefined;

  if (!row || row.revoked_at !== null) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return {
    id: row.id,
    admin_id: row.admin_id,
    username: row.username,
    role: row.role,
  };
}

export function revokeAdminSessionRecord(sessionId: string) {
  const db = getDb();
  db.prepare(`
    UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), sessionId);
}

// Persistent Rate Limiting
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const db = getDb();
  const row = db.prepare('SELECT attempts, window_start, blocked_until FROM rate_limits WHERE key = ?').get(key) as
    | { attempts: number; window_start: string; blocked_until: string | null }
    | undefined;

  if (!row) return { allowed: true };

  if (row.blocked_until) {
    const blockedMs = new Date(row.blocked_until).getTime();
    const nowMs = Date.now();
    if (blockedMs > nowMs) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((blockedMs - nowMs) / 1000),
      };
    }
  }

  return { allowed: true };
}

export function recordRateLimitFailure(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): { blocked: boolean; remainingAttempts: number } {
  const db = getDb();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const row = db.prepare('SELECT attempts, window_start, blocked_until FROM rate_limits WHERE key = ?').get(key) as
    | { attempts: number; window_start: string; blocked_until: string | null }
    | undefined;

  if (!row || nowMs - new Date(row.window_start).getTime() > windowMs) {
    db.prepare(`
      INSERT INTO rate_limits (key, attempts, window_start, blocked_until)
      VALUES (?, 1, ?, NULL)
      ON CONFLICT(key) DO UPDATE SET attempts = 1, window_start = ?, blocked_until = NULL
    `).run(key, nowIso, nowIso);
    return { blocked: false, remainingAttempts: Math.max(0, maxAttempts - 1) };
  }

  const nextAttempts = row.attempts + 1;
  const shouldBlock = nextAttempts >= maxAttempts;
  const blockedUntilIso = shouldBlock ? new Date(nowMs + blockDurationMs).toISOString() : null;

  db.prepare(`
    UPDATE rate_limits SET attempts = ?, blocked_until = ? WHERE key = ?
  `).run(nextAttempts, blockedUntilIso, key);

  return {
    blocked: shouldBlock,
    remainingAttempts: Math.max(0, maxAttempts - nextAttempts),
  };
}

export function clearRateLimit(key: string) {
  const db = getDb();
  db.prepare('DELETE FROM rate_limits WHERE key = ?').run(key);
}
