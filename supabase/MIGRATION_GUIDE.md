# دليل تهيئة والترحيل الآمن إلى Supabase — مقرأة الهدى الإلكترونية
## Phase 4A Architecture, Provisioning & Rollback Guide

> **حالة التشغيل الحالية:** الموقع يعمل حالياً على `DATA_SOURCE=sqlite` محلياً دون أي تعديل على البيانات الحقيقية.

---

### ١. خطوات إنشاء وإعداد مشروع Supabase من لوحة التحكم (إعداد يدوي مطلوب من المالك)

1. **إنشاء المشروع:**
   - الدخول إلى [https://supabase.com/dashboard](https://supabase.com/dashboard) وإنشاء حساب / منظمة لمقرأة الهدى.
   - النقر على **New Project**:
     - اختيار الاسم (مثلاً: `maqraat-al-huda`).
     - تعيين كلمة مرور قوية لقاعدة بيانات PostgreSQL وحفظها في مكان آمن.
     - اختيار المنطقة الجغرافية الأقرب للمملكة العربية السعودية (مثل **Central EU / Frankfurt** أو أقرب مركز بيانات متاح).
2. **استخراج مفاتيح الربط (API Keys):**
   - بعد اكتمال تجهيز المشروع، الانتقال إلى **Project Settings -> API** واستخراج 3 قيم فقط:
     1. `Project URL` -> يوضع في `.env.local` كـ `NEXT_PUBLIC_SUPABASE_URL`
     2. `anon public` Key -> يوضع في `.env.local` كـ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     3. `service_role secret` Key -> يوضع في `.env.local` كـ `SUPABASE_SERVICE_ROLE_KEY` (**سري للغاية — للخادم فقط ولا يُشارك أو يُوضع ببادئة `NEXT_PUBLIC_`**)
3. **تنفيذ مخطط قاعدة البيانات وحاوية التخزين:**
   - الانتقال إلى **SQL Editor -> New Query**.
   - نسخ كامل محتوى الملف [`supabase/schema.sql`](file:///c:/Users/almwf/Desktop/مقراة%20الهدى/supabase/schema.sql) ولصقه وتشغيله (`Run`).
   - المخطط مصمم ليكون **قابلاً لإعادة التشغيل بأمان (Idempotent)**؛ حيث ينشئ الجداول والفهارس، السياسات الأمنية RLS، الدوال المحصنة، وحاوية التخزين الخاصة `staff-documents`.
4. **تعطيل التسجيل الذاتي في Supabase Auth:**
   - الانتقال إلى **Authentication -> Providers -> Email** وتعطيل خيار التسجيل المفتوح إن أمكن، أو الاقتصار على إدارة حسابات الإدارة من لوحة Supabase لأن صلاحية `is_admin()` محصورة بجدول `admin_profiles` المحمي.

---

### ٢. تهيئة أول حساب مدير نظام (Superadmin Provisioning)
1. من لوحة Supabase: الانتقال إلى **Authentication -> Users -> Add user -> Create new user**.
2. إدخال البريد الإلكتروني الرسمي للإدارة وكلمة مرور قوية (لا يوجد تسجيل عام للمشرفات من واجهة الموقع).
3. نسخ `User UID` (معرف UUID) للحساب الجديد.
4. تشغيل الاستعلام التالي في **SQL Editor**:
   ```sql
   INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
   VALUES (
     '<USER-UID-FROM-AUTH>',
     'admin@maqraat-al-huda.org',
     'المديرة العامة لمقرأة الهدى',
     'superadmin',
     true
   )
   ON CONFLICT (id) DO UPDATE SET
     role = EXCLUDED.role,
     is_active = EXCLUDED.is_active;
   ```

---

### ٣. أمان روابط الواتساب ودالة التسجيل (`register_student_and_get_link`)
- عمود `whatsapp_url` مفصول تماماً في جدول مستقل (`public.session_links`) مقفل بسياسة RLS للإدارة فقط.
- قراءة الحلقات العامة (`SELECT` على `public.sessions`) لا تتضمن رابط الواتساب إطلاقاً.
- دالة `register_student_and_get_link(...)` مقيدة الصلاحية برمجياً بـ:
  `REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;`
  لضمان استحالة استغلالها مباشرة عبر Supabase REST API دون المرور بخادم Next.js (`/api/register/student`) الذي يفرض فحص الأصل (CSRF)، وتحديد المعدل (Rate Limiting)، والتحقق من الحقول.

---

### ٤. آلية نقل البيانات والتراجع (Migration & Rollback Plan)

#### أ) خطوات الترحيل في المرحلة 4B:
1. المعاينة الجافة الآمنة (بدون كتابة):
   `node scripts/migrate_to_supabase.js --dry-run`
2. التنفيذ الفعلي (ينشئ نسخة احتياطية آلية لـ SQLite والمرفقات أولاً ثم ينقل البيانات والمرفقات دون تكرار):
   `node scripts/migrate_to_supabase.js --confirm`
3. التحقق الحي من سياسات الأمان:
   `node scripts/verify_supabase_security.js`
4. تحويل متغير البيئة في `.env.local` إلى: `DATA_SOURCE=supabase`.

#### ب) خطة التراجع (Rollback) والقيود الحرجة:
- **على الخوادم المستمرة (VPS أو خادم محلي دائم):** يمكن الرجوع فوراً لقاعدة SQLite عبر تغيير متغير البيئة إلى `DATA_SOURCE=sqlite` واستعادة ملف القاعدة من مجلد `backups/pre_supabase_...`.
- **تحذير مهم لمنصات الاستضافة السحابية (مثل Vercel):**  
  الرجوع إلى `DATA_SOURCE=sqlite` **يتطلب بيئة تخزين ملفات مستمرة (Persistent Disk) ولا يعمل تلقائياً على منصات الاستضافة عديمة الحالة (Stateless Serverless مثل Vercel)**، لأن نظام الملفات في Vercel للقراءة فقط ومؤقت؛ لذا في بيئة Vercel يكون التراجع السحابي عبر استعادة نسخة احتياطية داخل Supabase (Point-in-Time Recovery / Backup Snapshot) وليس عبر العودة إلى SQLite.
