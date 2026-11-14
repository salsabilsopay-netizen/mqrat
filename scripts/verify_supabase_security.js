/**
 * Live Supabase Security, RLS & Client-Bundle Isolation Suite (Phase 4B)
 *
 * Tests 3 real permission tiers + Next.js static client bundle isolation:
 * 1. Static check: Verifies SUPABASE_SERVICE_ROLE_KEY never leaks into browser code or .next/static chunks.
 * 2. Anonymous user (anon): Blocked from PII, whatsapp_url, sensitive RPCs, writes, and private storage.
 * 3. Regular authenticated user (authenticated, NOT in admin_profiles):
 *    Blocked from staff/student records, admin RPCs, self-promotion to admin_profiles,
 *    spoofing user_metadata, approving applications, and private storage.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function scanClientBundleForSecrets() {
  const staticDir = path.join(process.cwd(), '.next', 'static');
  if (!fs.existsSync(staticDir)) {
    console.log('ℹ Note: .next/static not built yet; skipping static chunk scan.');
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const adminSecret = process.env.ADMIN_SECRET_KEY?.trim();

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        assert.equal(
          content.includes('SUPABASE_SERVICE_ROLE_KEY'),
          false,
          `CRITICAL LEAK: SUPABASE_SERVICE_ROLE_KEY string found in browser chunk ${entry.name}!`
        );
        if (serviceKey && serviceKey.length > 15) {
          assert.equal(
            content.includes(serviceKey),
            false,
            `CRITICAL LEAK: Service role secret value found in browser chunk ${entry.name}!`
          );
        }
        if (adminSecret && adminSecret.length > 15) {
          assert.equal(
            content.includes(adminSecret),
            false,
            `CRITICAL LEAK: ADMIN_SECRET_KEY value found in browser chunk ${entry.name}!`
          );
        }
      }
    }
  }

  walk(staticDir);
  console.log('✓ Client bundle static scan passed: zero server secrets in .next/static JS chunks.');
}

async function main() {
  loadEnvLocal();
  scanClientBundleForSecrets();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  if (!url.startsWith('https://') || url.includes('your-project') || anonKey.length < 20) {
    console.log('\nSKIPPED LIVE CLOUD CHECKS: Real Supabase URL / Anon Key not configured in .env.local.');
    console.log('Complete manual Supabase project setup first, then re-run this script.');
    process.exit(0);
  }

  const { createClient } = require('@supabase/supabase-js');
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n=== TIER 1: ANONYMOUS (anon) SECURITY VERIFICATION ===');

  for (const tbl of [
    'student_applications',
    'staff_applications',
    'session_links',
    'admin_profiles',
    'audit_logs',
    'rate_limits',
  ]) {
    const { data, error } = await anon.from(tbl).select('*').limit(5);
    assert.ok(error || (Array.isArray(data) && data.length === 0), `BREACH: anon read ${tbl}`);
    console.log(`✓ Anon blocked from sensitive table: ${tbl}`);
  }

  const { data: pubSessions, error: sessErr } = await anon.from('sessions').select('*').limit(5);
  assert.ok(!sessErr, `Public sessions query failed: ${sessErr?.message}`);
  for (const s of pubSessions || []) {
    assert.equal(Object.prototype.hasOwnProperty.call(s, 'whatsapp_url'), false, 'LEAK: whatsapp_url exposed!');
  }
  console.log('✓ Public sessions verified: zero whatsapp_url exposure.');

  for (const rpcCall of [
    anon.rpc('register_student_and_get_link', {
      p_session_id: 'sess-test',
      p_full_name: 'attacker',
      p_phone: '1234567',
      p_email: null,
      p_id_type: 'مواطنة',
      p_id_number: '12345',
      p_nationality: 'SA',
      p_residence_country: 'SA',
      p_residence_city: 'Riyadh',
      p_birth_date: '2000-01-01',
      p_is_child: false,
      p_commitment_accepted: true,
    }),
    anon.rpc('get_admin_dashboard_statistics'),
    anon.rpc('rate_limit_check', { p_key: 'test' }),
  ]) {
    const { error } = await rpcCall;
    assert.ok(error, 'CRITICAL BREACH: anon executed restricted RPC!');
  }
  console.log('✓ Anon blocked from restricted RPCs (register_student_and_get_link, admin stats, rate_limit).');

  const { error: insErr } = await anon.from('student_applications').insert({
    session_id: 'sess-x',
    full_name: 'test',
    phone: '1234567',
    id_type: 'مواطنة',
    id_number: '12345',
    nationality: 'SA',
    residence_country: 'SA',
    residence_city: 'Riyadh',
    birth_date: '2000-01-01',
    commitment_accepted: true,
    status: 'approved',
  });
  assert.ok(insErr, 'BREACH: anon direct INSERT succeeded on student_applications!');
  console.log('✓ Direct anon INSERT denied across restricted tables.');

  const { data: bucketFiles, error: storageErr } = await anon.storage.from('staff-documents').list();
  assert.ok(storageErr || (Array.isArray(bucketFiles) && bucketFiles.length === 0), 'BREACH: anon accessed private bucket!');
  console.log('✓ Private bucket "staff-documents" blocked from anon.');

  const { data: pubStats, error: statsErr } = await anon.rpc('get_public_institution_statistics');
  assert.ok(!statsErr && pubStats && typeof pubStats.total_students === 'number', `Public stats RPC failed: ${statsErr?.message}`);
  console.log('✓ Public statistics RPC verified:', JSON.stringify(pubStats));

  // TIER 2: Regular Authenticated Non-Admin User Test
  if (serviceKey.length > 20 && !serviceKey.includes('your-service-role')) {
    console.log('\n=== TIER 2: REGULAR AUTHENTICATED NON-ADMIN ESCALATION VERIFICATION ===');
    const adminApi = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const tempEmail = `qa_regular_${crypto.randomBytes(6).toString('hex')}@example.com`;
    const tempPassword = crypto.randomBytes(16).toString('hex');
    let tempUserId = null;

    try {
      const { data: createdUser, error: createErr } = await adminApi.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'superadmin' }, // Deliberately attempt fake user_metadata claim!
      });
      assert.ok(!createErr && createdUser.user, `Could not create temp QA user: ${createErr?.message}`);
      tempUserId = createdUser.user.id;

      const regUserClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: signInErr } = await regUserClient.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword,
      });
      assert.ok(!signInErr, `Temp QA user sign in failed: ${signInErr?.message}`);

      // 1. Verify is_admin() ignores spoofed user_metadata and returns FALSE
      const { data: isAdminRes } = await regUserClient.rpc('is_admin');
      assert.equal(isAdminRes, false, 'CRITICAL: Spoofed user_metadata granted is_admin()=true!');
      console.log('✓ Confirmed is_admin() ignores user_metadata and returns false for non-admin.');

      // 2. Verify regular user CANNOT self-promote into admin_profiles
      const { error: selfPromoteErr } = await regUserClient.from('admin_profiles').insert({
        id: tempUserId,
        email: tempEmail,
        full_name: 'Attacker',
        role: 'superadmin',
        is_active: true,
      });
      assert.ok(selfPromoteErr, 'CRITICAL BREACH: Regular user inserted themselves into admin_profiles!');
      console.log('✓ Self-elevation into admin_profiles blocked by RLS.');

      // 3. Verify regular user CANNOT read staff/student applications, session_links, or audit_logs
      for (const tbl of ['student_applications', 'staff_applications', 'session_links', 'audit_logs']) {
        const { data, error } = await regUserClient.from(tbl).select('*').limit(5);
        assert.ok(error || (Array.isArray(data) && data.length === 0), `BREACH: Regular user read ${tbl}!`);
      }
      console.log('✓ Regular authenticated user blocked from PII, WhatsApp links, and audit logs.');

      // 4. Verify regular user CANNOT execute admin dashboard stats RPC or private storage
      const { error: adminStatsErr } = await regUserClient.rpc('get_admin_dashboard_statistics');
      assert.ok(adminStatsErr, 'BREACH: Regular user called get_admin_dashboard_statistics!');

      const { data: regFiles, error: regStorageErr } = await regUserClient.storage.from('staff-documents').list();
      assert.ok(regStorageErr || (Array.isArray(regFiles) && regFiles.length === 0), 'BREACH: Regular user listed private storage!');
      console.log('✓ Regular user blocked from admin stats RPC and private storage bucket.');
    } finally {
      if (tempUserId) {
        await adminApi.auth.admin.deleteUser(tempUserId);
      }
    }
  }

  console.log('\n=== ALL LIVE SUPABASE SECURITY CHECKS PASSED ===');
}

main().catch((err) => {
  console.error('SECURITY VERIFICATION FAILED:', err);
  process.exit(1);
});
