/**
 * Idempotent & Zero-PII-Logging Migration Tool: SQLite -> Supabase (Phase 4B Execution)
 *
 * Usage:
 *   node scripts/migrate_to_supabase.js --dry-run    (Safe local audit, default if --confirm omitted)
 *   node scripts/migrate_to_supabase.js --confirm    (Requires NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY)
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function createPreMigrationBackup(dbPath, uploadDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(process.cwd(), 'backups', `pre_supabase_${stamp}`);
  fs.mkdirSync(backupRoot, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    db.close();
    fs.copyFileSync(dbPath, path.join(backupRoot, 'maqraat_huda.db'));
  }

  if (fs.existsSync(uploadDir)) {
    fs.cpSync(uploadDir, path.join(backupRoot, 'uploads'), { recursive: true });
  }

  return backupRoot;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

async function main() {
  loadEnvLocal();

  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm') && !args.includes('--dry-run');

  const dbPath = process.env.MAQRAAT_DB_PATH
    ? path.resolve(process.env.MAQRAAT_DB_PATH)
    : path.join(process.cwd(), 'data', 'maqraat_huda.db');

  const uploadDir = process.env.MAQRAAT_UPLOAD_DIR
    ? path.resolve(process.env.MAQRAAT_UPLOAD_DIR)
    : path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(dbPath)) {
    console.error('ERROR: SQLite database file not found.');
    process.exit(1);
  }

  const db = new DatabaseSync(dbPath);
  const integrity = db.prepare('PRAGMA integrity_check;').get();
  if (integrity.integrity_check !== 'ok') {
    console.error('ERROR: SQLite integrity check failed:', integrity);
    db.close();
    process.exit(1);
  }

  const sessions = db.prepare('SELECT * FROM sessions ORDER BY created_at ASC').all();
  const students = db.prepare('SELECT * FROM student_applications ORDER BY created_at ASC').all();
  const staff = db.prepare('SELECT * FROM staff_applications ORDER BY created_at ASC').all();
  const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY created_at ASC').all();
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at ASC').all();
  db.close();

  const localFiles = fs.existsSync(uploadDir)
    ? fs.readdirSync(uploadDir).filter((f) => fs.statSync(path.join(uploadDir, f)).isFile())
    : [];

  console.log('=== MAQRAAT AL-HUDA MIGRATION PRE-FLIGHT AUDIT ===');
  console.log('SQLite integrity:', integrity.integrity_check);
  console.log('Record counts:', {
    sessions: sessions.length,
    student_applications: students.length,
    staff_applications: staff.length,
    testimonials: testimonials.length,
    audit_logs: auditLogs.length,
    attachment_files: localFiles.length,
  });

  if (!isConfirmed) {
    console.log('\n[DRY-RUN MODE] No data was written to Supabase.');
    console.log('Run with "--confirm" after setting valid Supabase environment credentials to execute.');
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  if (
    !supabaseUrl.startsWith('https://') ||
    supabaseUrl.includes('your-project') ||
    serviceKey.length < 20 ||
    serviceKey.includes('your-service-role')
  ) {
    console.error('ERROR: Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --confirm mode.');
    process.exit(1);
  }

  const backupPath = createPreMigrationBackup(dbPath, uploadDir);
  console.log('✓ Pre-migration snapshot saved at:', backupPath);

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Migrate Sessions & Private Links
  if (sessions.length > 0) {
    const publicSessions = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      teacher_name: s.teacher_name,
      platform: s.platform,
      days_count: s.days_count,
      time_slot: s.time_slot,
      days_schedule: s.days_schedule,
      status: s.status,
      created_at: s.created_at,
    }));
    const { error } = await supabase.from('sessions').upsert(publicSessions, { onConflict: 'id' });
    if (error) throw new Error(`Sessions migration error: ${error.message}`);

    const privateLinks = sessions.map((s) => ({
      session_id: s.id,
      whatsapp_url: s.whatsapp_url || '',
    }));
    const { error: linkErr } = await supabase
      .from('session_links')
      .upsert(privateLinks, { onConflict: 'session_id' });
    if (linkErr) throw new Error(`Session links migration error: ${linkErr.message}`);
  }
  console.log(`✓ Sessions & session_links migrated (${sessions.length}).`);

  // 2. Migrate Student Applications (preserves statuses, is_child, FK relations)
  if (students.length > 0) {
    const formattedStudents = students.map((st) => ({
      id: st.id,
      session_id: st.session_id,
      full_name: st.full_name,
      phone: st.phone,
      email: st.email || null,
      id_type: st.id_type,
      id_number: st.id_number,
      nationality: st.nationality,
      gender: st.gender || 'أنثى',
      residence_country: st.residence_country,
      residence_city: st.residence_city,
      birth_date: st.birth_date,
      is_child: Boolean(st.is_child),
      commitment_accepted: Boolean(st.commitment_accepted),
      status: st.status,
      notes: st.notes || null,
      created_at: st.created_at,
    }));
    const { error } = await supabase
      .from('student_applications')
      .upsert(formattedStudents, { onConflict: 'id' });
    if (error) throw new Error(`Student applications migration error: ${error.message}`);
  }
  console.log(`✓ Student applications migrated (${students.length}).`);

  // 3. Upload Private Staff Documents & Migrate Staff Applications
  for (const filename of localFiles) {
    const buf = fs.readFileSync(path.join(uploadDir, filename));
    const { error } = await supabase.storage
      .from('staff-documents')
      .upload(filename, buf, { contentType: getContentType(filename), upsert: false });

    if (error && !String(error.message).toLowerCase().includes('already exists')) {
      throw new Error(`Storage upload error for ${filename}: ${error.message}`);
    }
  }
  console.log(`✓ Attachment files uploaded safely (${localFiles.length}).`);

  if (staff.length > 0) {
    const formattedStaff = staff.map((sf) => {
      let certs = [];
      try {
        certs = JSON.parse(sf.certificates_urls || '[]');
      } catch {
        certs = [];
      }
      return {
        id: sf.id,
        role: sf.role,
        full_name: sf.full_name,
        id_type: sf.id_type,
        id_number: sf.id_number,
        id_expiry_date: sf.id_expiry_date,
        nationality: sf.nationality,
        gender: sf.gender || 'أنثى',
        birth_place: sf.birth_place,
        birth_date_hijri: sf.birth_date_hijri,
        qualification: sf.qualification,
        major: sf.major,
        workplace: sf.workplace,
        job_title: sf.job_title,
        phone: sf.phone,
        region: sf.region,
        city: sf.city,
        district: sf.district,
        street: sf.street,
        building_number: sf.building_number,
        apartment_number: sf.apartment_number,
        email: sf.email,
        x_account: sf.x_account || null,
        signature_url: sf.signature_url,
        certificates_urls: certs,
        commitment_accepted: Boolean(sf.commitment_accepted),
        status: sf.status,
        notes: sf.notes || null,
        created_at: sf.created_at,
      };
    });
    const { error } = await supabase
      .from('staff_applications')
      .upsert(formattedStaff, { onConflict: 'id' });
    if (error) throw new Error(`Staff applications migration error: ${error.message}`);
  }
  console.log(`✓ Staff applications migrated (${staff.length}).`);

  // 4. Migrate Testimonials
  if (testimonials.length > 0) {
    const formattedTestimonials = testimonials.map((t) => ({
      id: t.id,
      student_name: t.student_name,
      content: t.content,
      rating: t.rating,
      session_name: t.session_name || null,
      is_approved: Boolean(t.is_approved),
      created_at: t.created_at,
    }));
    const { error } = await supabase
      .from('testimonials')
      .upsert(formattedTestimonials, { onConflict: 'id' });
    if (error) throw new Error(`Testimonials migration error: ${error.message}`);
  }
  console.log(`✓ Testimonials migrated (${testimonials.length}).`);

  // 5. Migrate Audit Logs
  if (auditLogs.length > 0) {
    const formattedLogs = auditLogs.map((l) => ({
      id: l.id,
      admin_user: l.admin_user,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id || null,
      details: l.details ? { message: l.details } : null,
      created_at: l.created_at,
    }));
    const { error } = await supabase.from('audit_logs').upsert(formattedLogs, { onConflict: 'id' });
    if (error) throw new Error(`Audit logs migration error: ${error.message}`);
  }
  console.log(`✓ Audit logs migrated (${auditLogs.length}).`);

  // 6. Parity Count Verification (No PII printed)
  const tablesToCheck = [
    ['sessions', sessions.length],
    ['student_applications', students.length],
    ['staff_applications', staff.length],
    ['testimonials', testimonials.length],
    ['audit_logs', auditLogs.length],
  ];

  for (const [table, expected] of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) throw new Error(`Parity check failed on ${table}: ${error.message}`);
    if ((count || 0) < expected) {
      throw new Error(`Parity mismatch on ${table}: expected >= ${expected}, got ${count}`);
    }
  }

  console.log('\n=== MIGRATION & PARITY VERIFICATION COMPLETED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('MIGRATION FAILED:', err.message);
  process.exit(1);
});
