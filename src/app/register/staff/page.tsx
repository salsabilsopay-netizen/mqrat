'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { UserPlus, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Upload, FileText, Info, Lock } from 'lucide-react';
import { StaffRole } from '@/types';

export default function StaffRegisterPage() {
  const [role, setRole] = useState<StaffRole>('معلمة');
  const [stage, setStage] = useState<1 | 2>(1); // 1 = Form & Uploads, 2 = Confirmation

  // 23 Fields State
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState('هوية وطنية');
  const [idNumber, setIdNumber] = useState('');
  const [idExpiryDate, setIdExpiryDate] = useState('');
  const [nationality, setNationality] = useState('سعودية');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDateHijri, setBirthDateHijri] = useState('');
  const [qualification, setQualification] = useState('بكالوريوس');
  const [major, setMajor] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [xAccount, setXAccount] = useState('');

  // Files
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [certificatesFiles, setCertificatesFiles] = useState<FileList | null>(null);

  // Commitment
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!commitmentAccepted) {
      setErrorMessage('يجب الإقرار بصحة البيانات والموافقة على التعهد للمتابعة');
      return;
    }

    if (!signatureFile) {
      setErrorMessage('يرجى إرفاق صورة التوقيع');
      return;
    }

    if (!certificatesFiles || certificatesFiles.length === 0) {
      setErrorMessage('يرجى إرفاق صور الشهادات والمؤهلات العلمية');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('role', role);
      formData.append('full_name', fullName);
      formData.append('id_type', idType);
      formData.append('id_number', idNumber);
      formData.append('id_expiry_date', idExpiryDate);
      formData.append('nationality', nationality);
      formData.append('birth_place', birthPlace);
      formData.append('birth_date_hijri', birthDateHijri);
      formData.append('qualification', qualification);
      formData.append('major', major);
      formData.append('workplace', workplace);
      formData.append('job_title', jobTitle);
      formData.append('phone', phone);
      formData.append('region', region);
      formData.append('city', city);
      formData.append('district', district);
      formData.append('street', street);
      formData.append('building_number', buildingNumber);
      formData.append('apartment_number', apartmentNumber);
      formData.append('email', email);
      if (xAccount) formData.append('x_account', xAccount);
      formData.append('signature_file', signatureFile);
      
      for (let i = 0; i < certificatesFiles.length; i++) {
        formData.append('certificates_files', certificatesFiles[i]);
      }

      formData.append('commitment_accepted', 'true');

      const res = await fetch('/api/register/staff', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال طلب التقديم');
      }

      setApplicationId(data.application_id);
      setStage(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#153D32', '#B69A65', '#528670'],
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ في تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-ivory-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500 mb-6">
          <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <span className="text-forest-700 font-semibold">التسجيل كمعلمة أو مشرفة</span>
        </div>

        {stage === 1 ? (
          <div className="space-y-8">
            
            {/* Header Card */}
            <div className="animate-hero-badge bg-white rounded-3xl border border-forest-100 p-6 sm:p-8 shadow-card">
              <span className="inline-block px-3.5 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-bold mb-3">
                بوابة الكادر التعليمي والإشرافي
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-4">
                التسجيل كمعلمة أو مشرفة في مقرأة الهدى
              </h1>

              {/* Official Introductory Notice from PDF Page 17 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  «يرجى تعبئة جميع البيانات المطلوبة بدقة واكتمال، وإرفاق المستندات اللازمة، حيث تُطلب هذه البيانات لاستكمال الإجراءات المتعلقة بوزارة الشؤون الإسلامية والدعوة والإرشاد. ونؤكد أهمية التأكد من صحة المعلومات قبل إرسال الطلب.»
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="animate-modal-panel p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="animate-hero-title bg-white rounded-3xl border border-forest-100 p-6 sm:p-10 shadow-card space-y-8">
              
              {/* Role Selection (معلمة / مشرفة) */}
              <div>
                <label className="block text-sm font-bold text-forest-800 mb-3">
                  تحديد الصفة المطلوبة للتقديم <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('معلمة')}
                    className={`py-3.5 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      role === 'معلمة'
                        ? 'border-forest-600 bg-forest-50 text-forest-800 ring-2 ring-forest-600/20'
                        : 'border-charcoal-200 bg-white text-charcoal-600 hover:bg-forest-50/30'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-forest-600" />
                    <span>التقديم كمعلمة قرآن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('مشرفة')}
                    className={`py-3.5 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      role === 'مشرفة'
                        ? 'border-forest-600 bg-forest-50 text-forest-800 ring-2 ring-forest-600/20'
                        : 'border-charcoal-200 bg-white text-charcoal-600 hover:bg-forest-50/30'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-forest-600" />
                    <span>التقديم كمشرفة حلقات</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Personal & Identity Data */}
              <div className="pt-6 border-t border-forest-100">
                <h3 className="text-base font-bold text-forest-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-xs">١</span>
                  <span>البيانات الشخصية والهوية</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* 1. Full 4-part name */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١. الاسم الرباعي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="الاسم الأول - اسم الأب - اسم الجد - اسم العائلة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 2. ID Type */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٢. نوع الهوية <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 font-medium"
                    >
                      <option value="هوية وطنية">هوية وطنية</option>
                      <option value="إقامة نظامية">إقامة نظامية</option>
                      <option value="جواز سفر">جواز سفر</option>
                    </select>
                  </div>

                  {/* 3. ID Number */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٣. رقم الهوية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="رقم السجل المدني / الإقامة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 4. ID Expiry Date */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٤. تاريخ انتهاء الهوية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={idExpiryDate}
                      onChange={(e) => setIdExpiryDate(e.target.value)}
                      placeholder="يوم / شهر / سنة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 5. Nationality */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٥. الجنسية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 6. Gender */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٦. الجنس
                    </label>
                    <input
                      type="text"
                      disabled
                      value="أنثى"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 bg-charcoal-50 text-charcoal-600 text-sm outline-none font-semibold cursor-not-allowed"
                    />
                  </div>

                  {/* 7. Birth Place */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٧. مكان الميلاد <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="المدينة / الدولة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 8. Birth Date Hijri */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٨. تاريخ الميلاد بالهجري <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={birthDateHijri}
                      onChange={(e) => setBirthDateHijri(e.target.value)}
                      placeholder="مثال: 1415/05/12هـ"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                </div>
              </div>

              {/* Section 2: Education & Professional Data */}
              <div className="pt-6 border-t border-forest-100">
                <h3 className="text-base font-bold text-forest-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-xs">٢</span>
                  <span>المؤهلات العلمية والخبرات</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  {/* 9. Qualification */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٩. المؤهل العلمي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="بكالوريوس / ماجستير / دبلوم"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 10. Major */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٠. التخصص <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="دراسات إسلامية / لغة عربية..."
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 11. Workplace */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١١. مكان العمل <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={workplace}
                      onChange={(e) => setWorkplace(e.target.value)}
                      placeholder="جهة العمل الحالية أو لا يوجد"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 12. Job Title */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٢. المسمى الوظيفي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="المسمى الوظيفي"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                </div>
              </div>

              {/* Section 3: Contact & National Address */}
              <div className="pt-6 border-t border-forest-100">
                <h3 className="text-base font-bold text-forest-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-xs">٣</span>
                  <span>بيانات التواصل والعنوان الوطني</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  {/* 13. Phone */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٣. رقم الجوال <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+9665xxxxxxxx"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 text-right"
                    />
                  </div>

                  {/* 20. Email */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٢٠. البريد الإلكتروني <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 text-right"
                    />
                  </div>

                  {/* 14. Region */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٤. المنطقة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="المنطقة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 15. City */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٥. المدينة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="المدينة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 16. District */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٦. الحي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="اسم الحي"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 17. Street */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٧. الشارع <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="اسم الشارع"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 18. Building Number */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٨. رقم المبنى <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={buildingNumber}
                      onChange={(e) => setBuildingNumber(e.target.value)}
                      placeholder="رقم المبنى"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 19. Apartment Number */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ١٩. رقم الشقة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={apartmentNumber}
                      onChange={(e) => setApartmentNumber(e.target.value)}
                      placeholder="رقم الشقة"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
                    />
                  </div>

                  {/* 21. X / Twitter Account (Optional) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                      ٢١. حساب منصة إكس (تويتر) <span className="text-charcoal-400 text-[11px] font-normal">(اختياري إن وجد)</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={xAccount}
                      onChange={(e) => setXAccount(e.target.value)}
                      placeholder="@username"
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40 text-right"
                    />
                  </div>

                </div>
              </div>

              {/* Section 4: Document Uploads & Absher Guidance */}
              <div className="pt-6 border-t border-forest-100">
                <h3 className="text-base font-bold text-forest-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-xs">٤</span>
                  <span>المرفقات الرسمية والتوقيع</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 22. Signature upload + Absher Note */}
                  <div className="p-5 rounded-2xl bg-ivory-50 border border-forest-100 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-forest-800 mb-2">
                        ٢٢. إرفاق صورة التوقيع <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSignatureFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-xs text-charcoal-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest-600 file:text-white hover:file:bg-forest-700 cursor-pointer"
                      />
                      {signatureFile && (
                        <div className="mt-2 text-xs text-emerald-700 font-medium">
                          ✓ تم تحديد ملف التوقيع: {signatureFile.name}
                        </div>
                      )}
                    </div>

                    {/* Mandated Note next to signature from PDF Page 18 */}
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] sm:text-xs text-amber-900 leading-relaxed">
                      <strong>ملاحظة هامة:</strong> «عند ورود رسالة نصية إليكم من الأدلة الجنائية تتطلب موافقتكم، يرجى الدخول إلى منصة أبشر الخاصة بكم، ثم اختيار خدماتي، ثم الخدمات العامة، واستكمال إجراء الموافقة المطلوب وفق التعليمات الواردة في الرسالة.»
                    </div>
                  </div>

                  {/* 23. Certificates upload */}
                  <div className="p-5 rounded-2xl bg-ivory-50 border border-forest-100 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-forest-800 mb-2">
                        ٢٣. إرفاق صور الشهادات والمؤهلات العلمية <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files) {
                            setCertificatesFiles(e.target.files);
                          }
                        }}
                        className="block w-full text-xs text-charcoal-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest-600 file:text-white hover:file:bg-forest-700 cursor-pointer"
                      />
                      {certificatesFiles && certificatesFiles.length > 0 && (
                        <div className="mt-2 text-xs text-emerald-700 font-medium">
                          ✓ تم تحديد {certificatesFiles.length} ملف للشهادات
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3.5 rounded-xl bg-forest-50 border border-forest-100 text-[11px] sm:text-xs text-forest-800 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>يتم حفظ جميع المستندات والتواقيع في خوادم مشفرة لا يطلع عليها إلا الإدارة المختصة.</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 5: Staff Commitment & Acceptance */}
              <div className="pt-6 border-t border-forest-100 space-y-4">
                <div className="p-6 rounded-2xl bg-ivory-50 border-r-4 border-gold-500 border-y border-l border-forest-100 space-y-3">
                  <div className="flex items-center gap-2 text-forest-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-gold-600" />
                    <span>التعهد الخاص بالمعلمة أو المشرفة</span>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-800 leading-relaxed font-sans font-medium">
                    «أتعهد أنا المتقدمة بالالتزام بأنظمة مقرأة الهدى وتعليماتها، وأداء المهام الموكلة إليّ بأمانة وإخلاص، والحرص على تعليم الطالبات ومتابعتهن بما يحقق أهداف المقرأة، والمحافظة على خصوصية الطالبات وسرية بياناتهن، والالتزام بأخلاقيات العمل والتعاون مع إدارة المقرأة بما يخدم كتاب الله تعالى.»
                  </p>
                </div>

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-forest-200 bg-white hover:bg-forest-50/40 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={commitmentAccepted}
                    onChange={(e) => setCommitmentAccepted(e.target.checked)}
                    className="w-5 h-5 rounded text-forest-600 focus:ring-forest-500 accent-forest-600 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-xs sm:text-sm font-bold text-forest-900 leading-relaxed">
                    أقر بصحة جميع البيانات والمستندات المقدمة، وأتعهد بالالتزام بما ورد أعلاه.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-forest-100 flex items-center justify-between">
                <Link href="/" className="text-xs font-semibold text-charcoal-500 hover:text-forest-600">
                  إلغاء والعودة للرئيسية
                </Link>

                <button
                  type="submit"
                  disabled={submitting || !commitmentAccepted}
                  className="btn-cinematic inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md disabled:opacity-50 group"
                >
                  <span>{submitting ? 'جارٍ رفع المستندات وإرسال الطلب...' : 'إرسال الطلب'}</span>
                  <ArrowLeft className="w-4 h-4 text-gold-300 transition-transform duration-200 group-hover:-translate-x-1" />
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="animate-modal-panel bg-white rounded-3xl border border-forest-100 p-8 sm:p-14 shadow-card text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-800 mb-2">
                تم استلام طلب التقديم بنجاح!
              </h2>
              <p className="text-sm text-charcoal-600 max-w-lg mx-auto leading-relaxed">
                شكراً لتقديمكِ للانضمام إلى كادر مقرأة الهدى الإلكترونية لتعليم القرآن الكريم كـ ({role}). تم حفظ بياناتكِ ومستنداتكِ المرفوعة بأمان لدى إدارة المقرأة وسيتم دراسة الطلب والتواصل معكِ قريباً لاستكمال الإجراءات الرسمية.
              </p>
              {applicationId && (
                <div className="text-xs text-charcoal-400 font-mono mt-3">
                  رقم الطلب المرجعي: {applicationId}
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl bg-forest-600 text-white text-xs font-semibold hover:bg-forest-700 transition-colors"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
