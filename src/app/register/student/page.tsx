'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { GraduationCap, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, MessageCircle, ShieldCheck, User, Phone, Mail, IdCard, Globe, MapPin, Calendar } from 'lucide-react';
import { QuranSession } from '@/types';

function StudentRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSessionId = searchParams.get('sessionId') || '';

  // Sessions state
  const [sessions, setSessions] = useState<QuranSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuranSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Workflow Stages: 1 = Details, 2 = Commitment, 3 = Confirmation
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState<'مواطنة' | 'مقيمة' | 'زائرة'>('مواطنة');
  const [idNumber, setIdNumber] = useState('');
  const [nationality, setNationality] = useState('سعودية');
  const [gender] = useState<'أنثى'>('أنثى');
  const [residenceCountry, setResidenceCountry] = useState('المملكة العربية السعودية');
  const [residenceCity, setResidenceCity] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Load available sessions
  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const list: QuranSession[] = data.sessions;
          setSessions(list);
          if (initialSessionId) {
            const found = list.find((s) => s.id === initialSessionId);
            if (found) setSelectedSession(found);
          } else if (list.length > 0) {
            const available = list.find((s) => s.status === 'متاح');
            if (available) setSelectedSession(available);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingSessions(false));
  }, [initialSessionId]);

  // Handle Stage 1 submission
  const handleProceedToStage2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSession) {
      setErrorMessage('يرجى اختيار الحلقة المراد التسجيل بها');
      return;
    }
    const isSelectedFull = typeof selectedSession.max_students === 'number' &&
      selectedSession.max_students > 0 &&
      (selectedSession.registered_students_count ?? 0) >= selectedSession.max_students;

    if (selectedSession.status !== 'متاح' || isSelectedFull) {
      setErrorMessage(isSelectedFull ? 'عذراً، هذه الحلقة اكتملت طاقتها الاستيعابية ولا تقبل تسجيلات جديدة' : 'عذراً، هذه الحلقة غير متاحة للتسجيل حالياً');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !idNumber.trim() || !nationality.trim() || !residenceCountry.trim() || !residenceCity.trim() || !birthDate) {
      setErrorMessage('يرجى تعبئة جميع الحقول الإلزامية');
      return;
    }

    setStage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Stage 2 final submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!commitmentAccepted) {
      setErrorMessage('يجب الإقرار والموافقة على التعهد للمتابعة');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession?.id,
          full_name: fullName,
          phone,
          email: email || undefined,
          id_type: idType,
          id_number: idNumber,
          nationality,
          residence_country: residenceCountry,
          residence_city: residenceCity,
          birth_date: birthDate,
          commitment_accepted: commitmentAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال طلب التسجيل');
      }

      setApplicationId(data.application_id);
      setWhatsappUrl(data.whatsapp_url);
      setStage(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#153D32', '#B69A65', '#528670'],
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-ivory-100 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500 mb-6">
          <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/schedule" className="hover:text-forest-600 transition-colors">الحلقات</Link>
          <span>/</span>
          <span className="text-forest-700 font-semibold">التسجيل كطالبة</span>
        </div>

        {/* Header Stepper Card */}
        <div className="animate-hero-badge bg-white rounded-3xl border border-forest-100 p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-100">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-bold mb-2">
                بوابة الطالبات
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-800">
                التسجيل في حلقات مقرأة الهدى
              </h1>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors duration-300 ${stage >= 1 ? 'bg-forest-600 text-white shadow-sm' : 'bg-charcoal-100 text-charcoal-400'}`}>
                ١
              </div>
              <div className={`w-6 sm:w-10 h-0.5 transition-colors duration-300 ${stage >= 2 ? 'bg-forest-600' : 'bg-charcoal-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors duration-300 ${stage >= 2 ? 'bg-forest-600 text-white shadow-sm' : 'bg-charcoal-100 text-charcoal-400'}`}>
                ٢
              </div>
              <div className={`w-6 sm:w-10 h-0.5 transition-colors duration-300 ${stage >= 3 ? 'bg-forest-600' : 'bg-charcoal-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors duration-300 ${stage === 3 ? 'bg-gold-600 text-white shadow-sm' : 'bg-charcoal-100 text-charcoal-400'}`}>
                ٣
              </div>
            </div>
          </div>

          {/* Current Step Title */}
          <div className="pt-4 text-xs font-semibold text-charcoal-500">
            {stage === 1 && 'المرحلة الأولى: تعبئة بيانات الطالبة والحلقة المختارة'}
            {stage === 2 && 'المرحلة الثانية: التعهد والالتزام بضوابط المقرأة'}
            {stage === 3 && 'المرحلة الثالثة: تأكيد التسجيل ورابط حلقة الواتساب'}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-modal-panel">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STAGE 1: Student Information */}
        {stage === 1 && (
          <form onSubmit={handleProceedToStage2} className="animate-hero-title bg-white rounded-3xl border border-forest-100 p-6 sm:p-10 shadow-card space-y-6">
            
            {/* Session Pre-population / Selection */}
            <div className="p-4 sm:p-5 rounded-2xl bg-ivory-50 border border-forest-100">
              <label className="block text-xs font-bold text-forest-800 mb-2">
                الحلقة والمعلمة المختارة <span className="text-rose-500">*</span>
              </label>
              
              {loadingSessions ? (
                <div className="text-xs text-charcoal-500 py-2">جارٍ تحميل الحلقات...</div>
              ) : sessions.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedSession?.id || ''}
                    onChange={(e) => {
                      const found = sessions.find((s) => s.id === e.target.value);
                      if (found) setSelectedSession(found);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-white font-medium"
                  >
                    {sessions.map((s) => {
                      const isFull = typeof s.max_students === 'number' && s.max_students > 0 && (s.registered_students_count ?? 0) >= s.max_students;
                      const isUnavailable = s.status !== 'متاح' || isFull;
                      const seatInfo = typeof s.max_students === 'number' && s.max_students > 0
                        ? isFull
                          ? '[مكتملة العدد]'
                          : `[المتبقي: ${s.max_students - (s.registered_students_count ?? 0)} مقعد]`
                        : '';

                      return (
                        <option key={s.id} value={s.id} disabled={isUnavailable}>
                          {s.name} — المعلمة: {s.teacher_name} ({s.time_slot} | {s.platform}) {s.status !== 'متاح' ? '[غير متاح]' : seatInfo}
                        </option>
                      );
                    })}
                  </select>

                  {selectedSession && (
                    <div className="mt-2 text-xs text-charcoal-600 flex flex-wrap gap-4 pt-2 border-t border-forest-100">
                      <span><strong>المعلمة:</strong> {selectedSession.teacher_name}</span>
                      <span><strong>الموعد:</strong> {selectedSession.time_slot}</span>
                      <span><strong>المنصة:</strong> {selectedSession.platform}</span>
                      <span><strong>الأيام:</strong> {selectedSession.days_schedule}</span>
                      {typeof selectedSession.max_students === 'number' && selectedSession.max_students > 0 && (
                        <span>
                          <strong>المقاعد الشاغرة:</strong>{' '}
                          <span className="font-semibold text-forest-700">
                            {Math.max(0, selectedSession.max_students - (selectedSession.registered_students_count ?? 0))} من أصل {selectedSession.max_students}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
                  لا توجد حلقات متاحة للتسجيل حالياً. يتم فتح باب التسجيل وتحديث مواعيد الحلقات دورياً من قِبل إدارة المقرأة.
                </div>
              )}
            </div>

            {/* Student Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الاسم الكامل للطالبة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="الاسم الثلاثي أو الرباعي"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  رقم الجوال (مع مفتاح الدولة) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+9665xxxxxxxx"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 text-right"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  البريد الإلكتروني <span className="text-charcoal-400 text-[11px] font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 text-right"
                  />
                </div>
              </div>

              {/* ID Type */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  نوع الهوية <span className="text-rose-500">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as 'مواطنة' | 'مقيمة' | 'زائرة')}
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 font-medium"
                >
                  <option value="مواطنة">مواطنة</option>
                  <option value="مقيمة">مقيمة</option>
                  <option value="زائرة">زائرة</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  رقم الهوية / الإقامة / جواز السفر <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="رقم الهوية"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الجنسية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="مثال: سعودية، مصرية، مغربية..."
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                />
              </div>

              {/* Gender (Fixed) */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  الجنس
                </label>
                <input
                  type="text"
                  disabled
                  value="أنثى"
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-charcoal-50 text-charcoal-600 text-sm outline-none cursor-not-allowed font-semibold"
                />
              </div>

              {/* Residence Country */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  بلد الإقامة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    required
                    value={residenceCountry}
                    onChange={(e) => setResidenceCountry(e.target.value)}
                    placeholder="الدولة التي تقيمين بها حالياً"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

              {/* Residence City */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  مدينة الإقامة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    required
                    value={residenceCity}
                    onChange={(e) => setResidenceCity(e.target.value)}
                    placeholder="المدينة"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  تاريخ الميلاد <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-charcoal-400" />
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

            </div>

            {/* Next Button */}
            <div className="pt-6 border-t border-forest-100 flex items-center justify-between">
              <Link href="/schedule" className="text-xs font-semibold text-charcoal-500 hover:text-forest-600">
                إلغاء والعودة للحلقات
              </Link>
              <button
                type="submit"
                className="btn-cinematic inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-sm shadow-md group"
              >
                <span>التالي: التعهد والالتزام</span>
                <ArrowLeft className="w-4 h-4 text-gold-300 transition-transform duration-200 group-hover:-translate-x-1" />
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2: Student Commitment */}
        {stage === 2 && (
          <form onSubmit={handleFinalSubmit} className="animate-modal-panel bg-white rounded-3xl border border-forest-100 p-6 sm:p-10 shadow-card space-y-6">
            
            <div className="p-4 rounded-2xl bg-forest-50 border border-forest-100 text-xs text-forest-800">
              <span>طالبة: <strong>{fullName}</strong></span>
              <span className="mx-2">•</span>
              <span>الحلقة: <strong>{selectedSession?.name} ({selectedSession?.teacher_name})</strong></span>
            </div>

            {/* Official Commitment Text */}
            <div className="p-6 rounded-2xl bg-ivory-50 border-r-4 border-gold-500 border-y border-l border-forest-100 space-y-3">
              <div className="flex items-center gap-2 text-forest-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-gold-600" />
                <span>تعهد الطالبة</span>
              </div>
              <p className="text-sm sm:text-base text-charcoal-800 leading-relaxed font-sans font-medium">
                «أتعهد أنا الطالبة بالالتزام بأنظمة مقرأة الهدى وتعليماتها، والحرص على الحضور في المواعيد المحددة، واحترام المعلمة والزميلات، وحسن الاستماع والمشاركة، والمحافظة على آداب حلقات القرآن الكريم، وإبلاغ المعلمة عند وجود عذر يمنعني من الحضور.»
              </p>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-xl border border-forest-200 bg-white hover:bg-forest-50/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                required
                checked={commitmentAccepted}
                onChange={(e) => setCommitmentAccepted(e.target.checked)}
                className="w-5 h-5 rounded text-forest-600 focus:ring-forest-500 accent-forest-600 flex-shrink-0 mt-0.5"
              />
              <span className="text-xs sm:text-sm font-bold text-forest-900 leading-relaxed">
                أقر بأنني قرأت التعهد، وأوافق على الالتزام بجميع ما ورد فيه.
              </span>
            </label>

            {/* Stage 2 Buttons */}
            <div className="pt-6 border-t border-forest-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-charcoal-600 hover:bg-forest-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لتعديل البيانات</span>
              </button>

              <button
                type="submit"
                disabled={submitting || !commitmentAccepted}
                className="btn-cinematic inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md disabled:opacity-50"
              >
                {submitting ? 'جارٍ إرسال الطلب...' : 'تأكيد التسجيل وإتمام الطلب'}
              </button>
            </div>
          </form>
        )}

        {/* STAGE 3: Registration Confirmation & WhatsApp Group Link */}
        {stage === 3 && (
          <div className="animate-modal-panel bg-white rounded-3xl border border-forest-100 p-8 sm:p-12 shadow-card text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-800 mb-2">
                تم تسجيل طلبكِ بنجاح!
              </h2>
              <p className="text-sm text-charcoal-600 max-w-md mx-auto">
                مرحباً بكِ في مقرأة الهدى الإلكترونية لتعليم القرآن الكريم. تم حفظ بياناتكِ لدى إدارة المقرأة وربطكِ بالحلقة المعتمدة.
              </p>
              {applicationId && (
                <div className="text-xs text-charcoal-400 font-mono mt-2">
                  رقم الطلب المرجعي: {applicationId}
                </div>
              )}
            </div>

            {/* WhatsApp Group Action */}
            {whatsappUrl ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 max-w-lg mx-auto text-right space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span>رابط مجموعة الحلقة على الواتساب</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  يُرجى الضغط على الزر أدناه للانضمام فوراً إلى مجموعة الواتساب المخصصة لحلقتكِ لمتابعة المواعيد وروابط البث والتوجيهات المباشرة من المعلمة.
                </p>
                <div className="pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>الانضمام إلى مجموعة الواتساب الخاصة بالحلقة</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-ivory-50 border border-forest-100 max-w-lg mx-auto text-xs text-charcoal-600 leading-relaxed">
                تم استلام طلبكِ وستقوم مشرفة المقرأة بالتواصل معكِ عبر رقم الجوال المسجل لإرسال رابط الحلقة وموعد اللقاء الأول.
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/schedule"
                className="px-6 py-2.5 rounded-xl bg-forest-600 text-white text-xs font-semibold hover:bg-forest-700 transition-colors"
              >
                استعراض جدول الحلقات
              </Link>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl border border-forest-200 text-forest-700 text-xs font-semibold hover:bg-forest-50 transition-colors"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-charcoal-500">جارٍ التحميل...</div>}>
      <StudentRegisterContent />
    </Suspense>
  );
}
