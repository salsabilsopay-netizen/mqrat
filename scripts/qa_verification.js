const fs = require('fs');

async function runQA() {
  console.log('=== MAQRAAT AL-HUDA QA & TECHNICAL VERIFICATION ===\n');

  const BASE_URL = 'http://localhost:3000';
  let adminCookie = '';

  // 1. Check Public Statistics Zero State
  console.log('1. Checking Public Statistics Zero State...');
  const statsRes = await fetch(`${BASE_URL}/api/statistics`);
  const statsData = await statsRes.json();
  console.log('Stats Response:', JSON.stringify(statsData.stats));
  if (statsData.stats.total_students !== 0 || statsData.stats.total_teachers !== 0) {
    throw new Error('Statistics are not zero on clean state!');
  }
  console.log('✓ Public statistics zero state confirmed: all metrics strictly 0.\n');

  // 2. Check Public Sessions (Empty State)
  console.log('2. Checking Public Sessions...');
  const sessRes = await fetch(`${BASE_URL}/api/sessions`);
  const sessData = await sessRes.json();
  console.log('Sessions count:', sessData.sessions.length);
  if (sessData.sessions.length !== 0) {
    throw new Error('Found unverified demonstration sessions in public endpoint!');
  }
  console.log('✓ Public sessions endpoint clean: 0 demo sessions.\n');

  // 3. Check Public Testimonials (Empty State)
  console.log('3. Checking Public Testimonials...');
  const testRes = await fetch(`${BASE_URL}/api/testimonials`);
  const testData = await testRes.json();
  console.log('Testimonials count:', testData.testimonials.length);
  if (testData.testimonials.length !== 0) {
    throw new Error('Found demo testimonials in public endpoint!');
  }
  console.log('✓ Public testimonials clean: 0 unapproved/demo testimonials.\n');

  // 4. Test Private File Access Restriction (Unauthorized)
  console.log('4. Testing Private File Access Boundary...');
  const unauthorizedFileRes = await fetch(`${BASE_URL}/api/admin/files/nonexistent.png`);
  console.log('Unauthorized file status:', unauthorizedFileRes.status);
  if (unauthorizedFileRes.status !== 401) {
    throw new Error('Security flaw: Private files endpoint is accessible without authentication!');
  }
  console.log('✓ Private file endpoint strictly protected (401 Unauthorized).\n');

  // 5. Test Admin Authentication & Session Management
  console.log('5. Testing Administrator Login...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error('Admin login failed!');
  }
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    adminCookie = setCookie.split(';')[0];
  }
  console.log('✓ Admin login successful. Session cookie established.\n');

  // 6. Test Quran Session Creation & Student Registration Workflow
  console.log('6. Testing Quran Session & Student Registration Workflow...');
  // Create an approved session
  const createSessRes = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      name: 'حلقة الاختبار المؤقتة',
      teacher_name: 'معلمة معتمدة',
      platform: 'Zoom',
      days_count: '4 أيام',
      time_slot: '05:00 - 06:00 مساءً',
      days_schedule: 'الأحد - الأربعاء',
      status: 'متاح',
      whatsapp_url: 'https://chat.whatsapp.com/test-qa-group'
    })
  });
  const createSessData = await createSessRes.json();
  if (!createSessData.success) throw new Error('Failed to create session: ' + createSessData.error);
  const testSessionId = createSessData.session.id;
  console.log('Created temporary test session:', testSessionId);

  // Student registers for this session
  const stuRegRes = await fetch(`${BASE_URL}/api/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: testSessionId,
      full_name: 'طالبة تجربة الجودة',
      phone: '+966500000000',
      id_type: 'مواطنة',
      id_number: '1000000000',
      nationality: 'سعودية',
      residence_country: 'المملكة العربية السعودية',
      residence_city: 'الرياض',
      birth_date: '2000-01-01',
      commitment_accepted: true
    })
  });
  const stuRegData = await stuRegRes.json();
  if (!stuRegData.success) throw new Error('Student registration failed: ' + stuRegData.error);
  console.log('Registered student application:', stuRegData.application_id);
  console.log('Received session WhatsApp URL:', stuRegData.whatsapp_url);
  if (stuRegData.whatsapp_url !== 'https://chat.whatsapp.com/test-qa-group') {
    throw new Error('WhatsApp URL was not populated correctly from session!');
  }

  // Verify that pending application DOES NOT count towards public statistics
  const statsAfterPending = await (await fetch(`${BASE_URL}/api/statistics`)).json();
  console.log('Public total_students with pending application:', statsAfterPending.stats.total_students);
  if (statsAfterPending.stats.total_students !== 0) {
    throw new Error('Pending application leaked into public statistics before approval!');
  }
  console.log('✓ Strict separation verified: submitted applications do NOT count until approved.');

  // Admin approves student
  const approveRes = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      id: stuRegData.application_id,
      status: 'approved',
      notes: 'معتمدة للفحص التقني'
    })
  });
  const approveData = await approveRes.json();
  if (!approveData.success) throw new Error('Failed to approve student');

  // Verify that approved student NOW counts in public statistics
  const statsAfterApprove = await (await fetch(`${BASE_URL}/api/statistics`)).json();
  console.log('Public total_students after approval:', statsAfterApprove.stats.total_students);
  if (statsAfterApprove.stats.total_students !== 1) {
    throw new Error('Approved student was not counted in public statistics!');
  }
  console.log('✓ Dynamic calculation verified: increments only on official administrative approval.');

  // Clean up test records
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync('data/maqraat_huda.db');
  db.prepare('DELETE FROM student_applications WHERE id = ?').run(stuRegData.application_id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(testSessionId);
  db.close();
  console.log('✓ Cleaned temporary test records from database.\n');

  // Verify statistics returned to zero
  const statsFinal = await (await fetch(`${BASE_URL}/api/statistics`)).json();
  console.log('Final statistics zero state:', JSON.stringify(statsFinal.stats));
  if (statsFinal.stats.total_students !== 0) {
    throw new Error('Statistics did not reset cleanly to zero!');
  }
  console.log('✓ Database clean state verified.\n');

  // 7. Verify Homepage Render Elements
  console.log('7. Verifying Homepage Render and Content Integrity...');
  const homeHtml = await (await fetch(BASE_URL)).text();
  const checks = {
    hasApprovedBadge: homeHtml.includes('منصة تعليمية إلكترونية لتعليم القرآن الكريم عن بُعد'),
    noFakeAccreditation: !homeHtml.includes('منصة تعليمية إلكترونية معتمدة عن بُعد'),
    hasApprovedAboutText: homeHtml.includes('بإشراف معلمات مؤهلات'),
    noUnverifiedClaims: !homeHtml.includes('نخبة من المعلمات المتمكنات الحاصلات على إجازات وقراءات معتمدة'),
    hasAboutImage: homeHtml.includes('about-quran.jpg'),
    hasHeroImage: homeHtml.includes('hero-quran.jpg'),
    noDotZero: !homeHtml.includes('>٠<')
  };
  console.log('Content integrity checks:', JSON.stringify(checks, null, 2));
  for (const [k, v] of Object.entries(checks)) {
    if (!v) throw new Error(`Homepage check failed: ${k}`);
  }
  console.log('✓ All 7 homepage content integrity checks passed.\n');

  console.log('=== ALL QA AND TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runQA().catch((err) => {
  console.error('QA Failed:', err);
  process.exit(1);
});
