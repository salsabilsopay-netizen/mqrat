-- ==============================================================================
-- MAQRAAT AL-HUDA — SUPABASE / POSTGRESQL PRODUCTION SCHEMA (PHASE 4A HARDENED)
-- مقرأة الهدى الإلكترونية لتعليم القرآن الكريم
--
-- Idempotent & Safely Re-runnable Migration Script:
-- 1. TEXT Primary Keys compatible with existing SQLite IDs (sess-*, stu-*, stf-*)
-- 2. Strict separation of private WhatsApp URLs into session_links table
-- 3. Role-based Admin Access Control via admin_profiles (never user_metadata)
-- 4. Server-gated registrations: anonymous direct RPC/INSERT blocked to prevent
--    bypassing Rate Limiting, CSRF, and Magic Bytes validation in Next.js APIs
-- 5. Hardened SECURITY DEFINER functions with SET search_path = public, pg_temp
--    and explicit REVOKE/GRANT EXECUTE controls
-- 6. Private Storage Bucket policies for signatures and certificates
-- ==============================================================================

-- ==============================================================================
-- 1. ADMIN PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'supervisor' CHECK (role IN ('superadmin', 'admin', 'supervisor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Secure helper functions (never inspect user_metadata; read protected admin_profiles only)
CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.admin_profiles
  WHERE id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('superadmin', 'admin', 'supervisor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.current_admin_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_admin_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, service_role;

-- Admin profiles RLS: strictly read-only for authenticated own record or superadmin.
-- Zero INSERT/UPDATE/DELETE policies for anon/authenticated -> impossible to self-promote!
DROP POLICY IF EXISTS "Admins can view own profile or superadmin views all" ON public.admin_profiles;
CREATE POLICY "Admins can view own profile or superadmin views all"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_superadmin());

-- ==============================================================================
-- 2. QURAN SESSIONS & ISOLATED PRIVATE SESSION LINKS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY DEFAULT ('sess-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Zoom', 'Google Meet')),
  days_count TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  days_schedule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'متاح' CHECK (status IN ('متاح', 'غير متاح')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to public sessions metadata" ON public.sessions;
CREATE POLICY "Allow public read access to public sessions metadata"
  ON public.sessions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins only write access to sessions" ON public.sessions;
CREATE POLICY "Admins only write access to sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Private table exclusively for session WhatsApp group URLs
CREATE TABLE IF NOT EXISTS public.session_links (
  session_id TEXT PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  whatsapp_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.session_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strictly admin-only access to private session links" ON public.session_links;
CREATE POLICY "Strictly admin-only access to private session links"
  ON public.session_links FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. STUDENT APPLICATIONS (طلبات تسجيل الطالبات)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_applications (
  id TEXT PRIMARY KEY DEFAULT ('stu-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_type TEXT NOT NULL CHECK (id_type IN ('مواطنة', 'مقيمة', 'زائرة')),
  id_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'أنثى' CHECK (gender = 'أنثى'),
  residence_country TEXT NOT NULL,
  residence_city TEXT NOT NULL,
  birth_date DATE NOT NULL,
  is_child BOOLEAN NOT NULL DEFAULT false,
  commitment_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

-- Note: Anonymous direct REST INSERT to student_applications is intentionally omitted!
-- Public student registrations MUST submit through Next.js /api/register/student
-- (which applies CSRF, Rate Limiting, validation, then writes via service_role).

DROP POLICY IF EXISTS "Allow anonymous student submission as pending only" ON public.student_applications;
DROP POLICY IF EXISTS "Admins only select student applications" ON public.student_applications;
CREATE POLICY "Admins only select student applications"
  ON public.student_applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only update student applications" ON public.student_applications;
CREATE POLICY "Admins only update student applications"
  ON public.student_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins only delete student applications" ON public.student_applications;
CREATE POLICY "Admins only delete student applications"
  ON public.student_applications FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- ==============================================================================
-- 4. STAFF APPLICATIONS (طلبات المعلمات والمشرفات)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.staff_applications (
  id TEXT PRIMARY KEY DEFAULT ('stf-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  role TEXT NOT NULL CHECK (role IN ('معلمة', 'مشرفة')),
  full_name TEXT NOT NULL,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_expiry_date TEXT NOT NULL,
  nationality TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'أنثى' CHECK (gender = 'أنثى'),
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
  certificates_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  commitment_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;

-- Note: Public direct REST INSERT is intentionally omitted; uploads & registrations
-- must pass through Next.js /api/register/staff for binary magic-bytes validation.

DROP POLICY IF EXISTS "Allow anonymous staff submission as pending only" ON public.staff_applications;
DROP POLICY IF EXISTS "Admins only select staff applications" ON public.staff_applications;
CREATE POLICY "Admins only select staff applications"
  ON public.staff_applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only update staff applications" ON public.staff_applications;
CREATE POLICY "Admins only update staff applications"
  ON public.staff_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Superadmin only delete staff applications" ON public.staff_applications;
CREATE POLICY "Superadmin only delete staff applications"
  ON public.staff_applications FOR DELETE
  TO authenticated
  USING (public.is_superadmin());

-- ==============================================================================
-- 5. TESTIMONIALS (آراء طالبات مقرأة الهدى)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY DEFAULT ('tst-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  student_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  session_name TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read approved testimonials" ON public.testimonials;
CREATE POLICY "Allow public read approved testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

-- Submissions go through Next.js /api/testimonials (rate-limited + CSRF checked)
DROP POLICY IF EXISTS "Allow public submission of unapproved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins full access to testimonials" ON public.testimonials;
CREATE POLICY "Admins full access to testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. AUDIT LOGS (سجلات العمليات الإدارية — غير قابلة للتعديل أو الحذف)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  admin_user TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only read audit logs" ON public.audit_logs;
CREATE POLICY "Admins only read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins only insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. INDEXES FOR PERFORMANCE & INTEGRITY
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.student_applications(status);
CREATE INDEX IF NOT EXISTS idx_students_session ON public.student_applications(session_id);
CREATE INDEX IF NOT EXISTS idx_students_approved_country ON public.student_applications(residence_country) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_staff_role_status ON public.staff_applications(role, status);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON public.testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 8. HARDENED RPC FUNCTIONS
-- ==============================================================================

-- 8.1 Server-Only Atomic Student Registration & Private WhatsApp Link Retrieval
-- CRITICAL SECURITY FIX: Restricted strictly to service_role (Next.js Server API)
-- Prevents attackers from bypassing Rate Limiting/CSRF via direct PostgREST RPC
-- to harvest private WhatsApp group URLs or flood fake applications!
CREATE OR REPLACE FUNCTION public.register_student_and_get_link(
  p_session_id TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_id_type TEXT,
  p_id_number TEXT,
  p_nationality TEXT,
  p_residence_country TEXT,
  p_residence_city TEXT,
  p_birth_date DATE,
  p_is_child BOOLEAN,
  p_commitment_accepted BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_status TEXT;
  v_app_id TEXT;
  v_whatsapp_url TEXT;
BEGIN
  IF p_commitment_accepted IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'يجب الموافقة على تعهد الطالبة للمتابعة';
  END IF;

  IF char_length(trim(coalesce(p_full_name, ''))) < 3
     OR char_length(trim(coalesce(p_phone, ''))) < 7
     OR char_length(trim(coalesce(p_id_number, ''))) < 5
     OR p_id_type NOT IN ('مواطنة', 'مقيمة', 'زائرة') THEN
    RAISE EXCEPTION 'البيانات المدخلة غير مكتملة أو غير صالحة';
  END IF;

  SELECT status INTO v_session_status
  FROM public.sessions
  WHERE id = p_session_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'الحلقة المختارة غير موجودة';
  END IF;

  IF v_session_status <> 'متاح' THEN
    RAISE EXCEPTION 'التسجيل في هذه الحلقة غير متاح حالياً';
  END IF;

  v_app_id := 'stu-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  INSERT INTO public.student_applications (
    id, session_id, full_name, phone, email, id_type, id_number,
    nationality, gender, residence_country, residence_city,
    birth_date, is_child, commitment_accepted, status
  ) VALUES (
    v_app_id, p_session_id, trim(p_full_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''),
    p_id_type, trim(p_id_number), trim(p_nationality), 'أنثى',
    trim(p_residence_country), trim(p_residence_city),
    p_birth_date, coalesce(p_is_child, false), true, 'pending'
  );

  SELECT nullif(trim(whatsapp_url), '') INTO v_whatsapp_url
  FROM public.session_links
  WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'application_id', v_app_id,
    'whatsapp_url', v_whatsapp_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_student_and_get_link(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, BOOLEAN, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_student_and_get_link(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, BOOLEAN, BOOLEAN) TO service_role;

-- 8.2 Safe Dynamic Statistics Aggregation Function (Public RPC - Approved Records Only)
CREATE OR REPLACE FUNCTION public.get_public_institution_statistics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_students INT;
  v_adult_students INT;
  v_child_students INT;
  v_total_teachers INT;
  v_total_supervisors INT;
  v_countries JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total_students FROM public.student_applications WHERE status = 'approved';
  SELECT COUNT(*) INTO v_adult_students FROM public.student_applications WHERE status = 'approved' AND is_child = false;
  SELECT COUNT(*) INTO v_child_students FROM public.student_applications WHERE status = 'approved' AND is_child = true;

  SELECT COUNT(*) INTO v_total_teachers FROM public.staff_applications WHERE role = 'معلمة' AND status = 'approved';
  SELECT COUNT(*) INTO v_total_supervisors FROM public.staff_applications WHERE role = 'مشرفة' AND status = 'approved';

  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) INTO v_countries
  FROM (
    SELECT residence_country AS country, COUNT(*)::INT AS count
    FROM public.student_applications
    WHERE status = 'approved'
      AND residence_country IS NOT NULL
      AND TRIM(residence_country) != ''
    GROUP BY residence_country
    ORDER BY count DESC
  ) c;

  RETURN jsonb_build_object(
    'total_students', v_total_students,
    'adult_students', v_adult_students,
    'child_students', v_child_students,
    'total_teachers', v_total_teachers,
    'total_supervisors', v_total_supervisors,
    'countries', v_countries
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_institution_statistics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_institution_statistics() TO anon, authenticated, service_role;

-- 8.3 Admin Dashboard Detailed Statistics RPC (SECURITY INVOKER preserves caller role)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_statistics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_public JSONB;
  v_total_student_apps INT;
  v_pending_student_apps INT;
  v_rejected_student_apps INT;
  v_total_staff_apps INT;
  v_pending_staff_apps INT;
  v_rejected_staff_apps INT;
  v_total_sessions INT;
  v_active_sessions INT;
BEGIN
  IF current_user <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح بالوصول إلى إحصائيات الإدارة';
  END IF;

  v_public := public.get_public_institution_statistics();

  SELECT COUNT(*) INTO v_total_student_apps FROM public.student_applications;
  SELECT COUNT(*) INTO v_pending_student_apps FROM public.student_applications WHERE status = 'pending';
  SELECT COUNT(*) INTO v_rejected_student_apps FROM public.student_applications WHERE status = 'rejected';

  SELECT COUNT(*) INTO v_total_staff_apps FROM public.staff_applications;
  SELECT COUNT(*) INTO v_pending_staff_apps FROM public.staff_applications WHERE status = 'pending';
  SELECT COUNT(*) INTO v_rejected_staff_apps FROM public.staff_applications WHERE status = 'rejected';

  SELECT COUNT(*) INTO v_total_sessions FROM public.sessions;
  SELECT COUNT(*) INTO v_active_sessions FROM public.sessions WHERE status = 'متاح';

  RETURN v_public || jsonb_build_object(
    'total_student_applications', v_total_student_apps,
    'pending_student_applications', v_pending_student_apps,
    'rejected_student_applications', v_rejected_student_apps,
    'total_staff_applications', v_total_staff_apps,
    'pending_staff_applications', v_pending_staff_apps,
    'rejected_staff_applications', v_rejected_staff_apps,
    'total_sessions', v_total_sessions,
    'active_sessions', v_active_sessions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_statistics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_statistics() TO authenticated, service_role;

-- ==============================================================================
-- 9. SUPABASE PRIVATE STORAGE CONFIGURATION (SIGNATURES & CERTIFICATES)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents',
  'staff-documents',
  false,
  5242880, -- 5MB limit per file
  ARRAY['image/png', 'image/jpeg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'application/pdf'];

DROP POLICY IF EXISTS "Admins only read staff documents" ON storage.objects;
CREATE POLICY "Admins only read staff documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'staff-documents' AND public.is_admin());

DROP POLICY IF EXISTS "Superadmin only delete staff documents" ON storage.objects;
CREATE POLICY "Superadmin only delete staff documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'staff-documents' AND public.is_superadmin());

-- ==============================================================================
-- 10. DISTRIBUTED SERVERLESS RATE LIMITING (SHARED PERSISTENT STORE)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Zero client RLS policies: strictly inaccessible via anon or authenticated JWTs.

CREATE OR REPLACE FUNCTION public.rate_limit_check(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_blocked_until TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limits
  WHERE key = p_key;

  IF v_blocked_until IS NOT NULL AND v_blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_blocked_until - v_now)))::INT)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rate_limit_record_failure(
  p_key TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_ms BIGINT DEFAULT 900000,
  p_block_ms BIGINT DEFAULT 900000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window INTERVAL := make_interval(secs => p_window_ms / 1000.0);
  v_block INTERVAL := make_interval(secs => p_block_ms / 1000.0);
  v_attempts INT;
  v_window_start TIMESTAMPTZ;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Ensure row exists atomically without race conditions
  INSERT INTO public.rate_limits (key, attempts, window_start, blocked_until)
  VALUES (p_key, 0, v_now, NULL)
  ON CONFLICT (key) DO NOTHING;

  -- Lock the key row for atomic counter increment
  SELECT attempts, window_start
  INTO v_attempts, v_window_start
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF v_now - v_window_start > v_window THEN
    v_attempts := 1;
    v_window_start := v_now;
  ELSE
    v_attempts := v_attempts + 1;
  END IF;

  IF v_attempts >= p_max_attempts THEN
    v_blocked_until := v_now + v_block;
  ELSE
    v_blocked_until := NULL;
  END IF;

  UPDATE public.rate_limits
  SET attempts = v_attempts,
      window_start = v_window_start,
      blocked_until = v_blocked_until
  WHERE key = p_key;

  RETURN jsonb_build_object(
    'blocked', (v_blocked_until IS NOT NULL AND v_blocked_until > v_now),
    'remaining_attempts', GREATEST(0, p_max_attempts - v_attempts)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rate_limit_clear(p_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE key = p_key;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_check(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rate_limit_record_failure(TEXT, INT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rate_limit_clear(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_record_failure(TEXT, INT, BIGINT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_clear(TEXT) TO service_role;
