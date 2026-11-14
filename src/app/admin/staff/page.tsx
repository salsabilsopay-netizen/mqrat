'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  X,
  FileText,
  Lock,
  Download,
  AlertCircle,
  Printer,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';
import { StaffApplication, StaffRole } from '@/types';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'معلمة' | 'مشرفة'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffApplication | null>(null);
  const [showForm261Preview, setShowForm261Preview] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [formPreviewError, setFormPreviewError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const formIframeRef = useRef<HTMLIFrameElement | null>(null);

  const openStaffDetails = (applicant: StaffApplication) => {
    setShowForm261Preview(false);
    setIframeLoaded(false);
    setFormPreviewError(null);
    setSelectedStaff(applicant);
  };

  const closeStaffModal = () => {
    setSelectedStaff(null);
    setShowForm261Preview(false);
    setIframeLoaded(false);
    setFormPreviewError(null);
  };

  const handleOpenForm261Preview = () => {
    setFormPreviewError(null);
    setIframeLoaded(false);
    setShowForm261Preview(true);
  };

  const handleDownloadForm261Pdf = async (applicationId: string) => {
    setPdfDownloading(true);
    setFormPreviewError(null);
    try {
      const res = await fetch(`/api/admin/staff/${encodeURIComponent(applicationId)}/form-261?download=1`, {
        method: 'GET',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'تعذر تحميل ملف PDF');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `form-261-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err: unknown) {
      setFormPreviewError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل PDF');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handlePrintForm261 = () => {
    const win = formIframeRef.current?.contentWindow;
    if (!win) {
      setFormPreviewError('يرجى انتظار اكتمال تحميل معاينة الاستمارة قبل الطباعة');
      return;
    }
    setFormPreviewError(null);
    win.focus();
    win.print();
  };

  const fetchStaff = useCallback(() => {
    setLoading(true);
    let url = `/api/admin/staff?status=${statusFilter}`;
    if (roleFilter !== 'all') url += `&role=${roleFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStaff(data.staff);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStaff();
        if (selectedStaff && selectedStaff.id === id) {
          setSelectedStaff({ ...selectedStaff, status, notes });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.id_number.includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.major.toLowerCase().includes(q)
    );
  });

  const parseCertificates = (jsonStr: string): string[] => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-200/80">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">
            طلبات المعلمات والمشرفات
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            فحص الحقول الـ 23، تدقيق التواقيع والشهادات العلمية، وإجراءات التعيين والاعتماد
          </p>
        </div>

        <button
          onClick={fetchStaff}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-forest-100 text-xs font-semibold text-charcoal-700 hover:bg-forest-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-forest-100 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الجوال، التخصص، الهوية..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
          />
        </div>

        {/* Roles and Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-ivory-50 p-1 rounded-xl border border-forest-100">
            {(['all', 'معلمة', 'مشرفة'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === r
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-charcoal-600 hover:text-forest-700'
                }`}
              >
                {r === 'all' ? 'الكل' : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-ivory-50 p-1 rounded-xl border border-forest-100">
            {[
              { id: 'all', label: 'جميع الحالات' },
              { id: 'pending', label: 'قيد المراجعة' },
              { id: 'approved', label: 'المعتمدة' },
              { id: 'rejected', label: 'المرفوضة' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-gold-600 text-white shadow-sm'
                    : 'text-charcoal-600 hover:text-gold-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Staff Applications Table */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-charcoal-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-600 mx-auto mb-2" />
            <span>جارٍ تحميل طلبات المعلمات والمشرفات...</span>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-ivory-50 border-b border-forest-100 text-forest-900 font-bold">
                <tr>
                  <th className="py-3 px-4">الصفة المطلوبة</th>
                  <th className="py-3 px-4">الاسم الرباعي</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">المؤهل والتخصص</th>
                  <th className="py-3 px-4">المنطقة والمدينة</th>
                  <th className="py-3 px-4">المرفقات</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ التقديم</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {filteredStaff.map((s) => {
                  const certs = parseCertificates(s.certificates_urls);
                  return (
                    <tr key={s.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            s.role === 'معلمة'
                              ? 'bg-forest-50 text-forest-800 border border-forest-200'
                              : 'bg-gold-50 text-gold-800 border border-gold-200'
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-800">
                        <div>{s.full_name}</div>
                        <div className="text-[10px] text-charcoal-400 font-normal">
                          {s.nationality} • هـ: {s.id_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-charcoal-700" dir="ltr">
                        {s.phone}
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-700">
                        <div className="font-semibold">{s.qualification}</div>
                        <div className="text-[10px] text-charcoal-400">{s.major}</div>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-700">
                        <div>{s.city}</div>
                        <div className="text-[10px] text-charcoal-400">{s.region}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-100">
                          <FileText className="w-3 h-3 text-gold-600" />
                          <span>توقيع + {certs.length} شهادات</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            s.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.status === 'approved' ? 'معتمدة' : s.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-charcoal-500 font-mono">
                        {new Date(s.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openStaffDetails(s)}
                            title="فحص كامل الحقول والملفات"
                            className="p-1.5 rounded-lg bg-ivory-100 hover:bg-forest-100 text-forest-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {s.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'approved')}
                              disabled={actionLoading}
                              title="اعتماد وتعيين"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {s.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'rejected')}
                              disabled={actionLoading}
                              title="رفض الطلب"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-charcoal-500 text-xs">
            لا توجد طلبات معلمات أو مشرفات مطابقة للتصفية الحالية.
          </div>
        )}
      </div>

      {/* Staff Full Review Modal & Form (261) Preview */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/50 backdrop-blur-sm"
            onClick={closeStaffModal}
          />

          <div
            className={`relative w-full ${
              showForm261Preview ? 'max-w-5xl' : 'max-w-3xl'
            } bg-white rounded-3xl shadow-elevated border border-forest-100 p-6 sm:p-8 z-10 text-right overflow-y-auto max-h-[92vh] transition-all`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-forest-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-forest-800">
                  {showForm261Preview
                    ? `استمارة الوزارة رقم (261) — ${selectedStaff.role} (${selectedStaff.full_name})`
                    : `ملف طلب التقديم — ${selectedStaff.role} (${selectedStaff.full_name})`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-charcoal-400 font-mono">ID: {selectedStaff.id}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStaff.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedStaff.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedStaff.status === 'approved'
                      ? 'معتمدة'
                      : selectedStaff.status === 'rejected'
                      ? 'مرفوضة'
                      : 'قيد المراجعة'}
                  </span>
                </div>
              </div>
              <button
                onClick={closeStaffModal}
                aria-label="إغلاق النافذة"
                className="p-1.5 rounded-lg text-charcoal-400 hover:bg-forest-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showForm261Preview ? (
              <div className="space-y-4">
                {/* Preview Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-ivory-50 border border-forest-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm261Preview(false);
                      setFormPreviewError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-forest-50 border border-forest-200 text-xs font-bold text-forest-800 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة لتفاصيل الطلب</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrintForm261}
                      disabled={!iframeLoaded}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gold-50 border border-gold-300 text-xs font-bold text-forest-800 transition-colors disabled:opacity-50"
                    >
                      <Printer className="w-4 h-4 text-gold-700" />
                      <span>طباعة الاستمارة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadForm261Pdf(selectedStaff.id)}
                      disabled={pdfDownloading}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                    >
                      {pdfDownloading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{pdfDownloading ? 'جارٍ إنشاء PDF...' : 'تحميل PDF'}</span>
                    </button>
                  </div>
                </div>

                {formPreviewError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formPreviewError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
                  <strong>تنبيه التطابق الرسمي:</strong> تمت تعبئة الحقول تلقائيًا من بيانات الطلب. الحقول غير المتوفرة في نموذج التقديم (رقم الهاتف الثابت وحساب فيسبوك) تبقى فارغة دون أي بيانات افتراضية، كما تبقى خانة التوقيع بالقلم والصورة الشخصية (للرجال فقط) كما هي في النموذج الرسمي.
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-forest-200 bg-[#eef1ee]">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#eef1ee]/90 z-10 text-xs text-forest-800 font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                      <span>جارٍ تجهيز معاينة الاستمارة (261)...</span>
                    </div>
                  )}
                  <iframe
                    key={selectedStaff.id}
                    ref={formIframeRef}
                    src={`/api/admin/staff/${encodeURIComponent(selectedStaff.id)}/form-261?format=html`}
                    onLoad={() => setIframeLoaded(true)}
                    title={`استمارة الوزارة (261) - ${selectedStaff.full_name}`}
                    className="w-full h-[70vh] border-0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Personal Data */}
                <div className="p-4 rounded-2xl bg-ivory-50 border border-forest-100">
                  <h4 className="font-bold text-forest-800 mb-3 text-sm">البيانات الشخصية والهوية:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div><span className="text-charcoal-500">١. الاسم الرباعي:</span> <strong>{selectedStaff.full_name}</strong></div>
                    <div><span className="text-charcoal-500">٢. نوع الهوية:</span> <strong>{selectedStaff.id_type}</strong></div>
                    <div><span className="text-charcoal-500">٣. رقم الهوية:</span> <strong className="font-mono">{selectedStaff.id_number}</strong></div>
                    <div><span className="text-charcoal-500">٤. انتهاء الهوية:</span> <strong>{selectedStaff.id_expiry_date}</strong></div>
                    <div><span className="text-charcoal-500">٥. الجنسية:</span> <strong>{selectedStaff.nationality}</strong></div>
                    <div><span className="text-charcoal-500">٦. الجنس:</span> <strong>{selectedStaff.gender}</strong></div>
                    <div><span className="text-charcoal-500">٧. مكان الميلاد:</span> <strong>{selectedStaff.birth_place}</strong></div>
                    <div><span className="text-charcoal-500">٨. الميلاد بالهجري:</span> <strong>{selectedStaff.birth_date_hijri}</strong></div>
                  </div>
                </div>

                {/* Professional & Qualifications */}
                <div className="p-4 rounded-2xl bg-ivory-50 border border-forest-100">
                  <h4 className="font-bold text-forest-800 mb-3 text-sm">المؤهلات العلمية والعمل:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><span className="text-charcoal-500">٩. المؤهل:</span> <strong>{selectedStaff.qualification}</strong></div>
                    <div><span className="text-charcoal-500">١٠. التخصص:</span> <strong>{selectedStaff.major}</strong></div>
                    <div><span className="text-charcoal-500">١١. مكان العمل:</span> <strong>{selectedStaff.workplace}</strong></div>
                    <div><span className="text-charcoal-500">١٢. المسمى الوظيفي:</span> <strong>{selectedStaff.job_title}</strong></div>
                  </div>
                </div>

                {/* National Address & Contact */}
                <div className="p-4 rounded-2xl bg-ivory-50 border border-forest-100">
                  <h4 className="font-bold text-forest-800 mb-3 text-sm">العنوان الوطني والتواصل:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><span className="text-charcoal-500">١٣. الجوال:</span> <strong className="font-mono" dir="ltr">{selectedStaff.phone}</strong></div>
                    <div><span className="text-charcoal-500">٢٠. البريد:</span> <strong className="font-mono">{selectedStaff.email}</strong></div>
                    <div><span className="text-charcoal-500">١٤. المنطقة:</span> <strong>{selectedStaff.region}</strong></div>
                    <div><span className="text-charcoal-500">١٥. المدينة:</span> <strong>{selectedStaff.city}</strong></div>
                    <div><span className="text-charcoal-500">١٦. الحي:</span> <strong>{selectedStaff.district}</strong></div>
                    <div><span className="text-charcoal-500">١٧. الشارع:</span> <strong>{selectedStaff.street}</strong></div>
                    <div><span className="text-charcoal-500">١٨. المبنى:</span> <strong>{selectedStaff.building_number}</strong></div>
                    <div><span className="text-charcoal-500">١٩. الشقة:</span> <strong>{selectedStaff.apartment_number}</strong></div>
                    {selectedStaff.x_account && (
                      <div className="col-span-2"><span className="text-charcoal-500">٢١. حساب إكس:</span> <strong className="font-mono">{selectedStaff.x_account}</strong></div>
                    )}
                  </div>
                </div>

                {/* Uploaded Documents (Signature & Certificates) */}
                <div className="p-4 rounded-2xl bg-forest-50 border border-forest-100 space-y-4">
                  <h4 className="font-bold text-forest-800 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-forest-600" />
                    <span>المستندات المحمية (خاصة بالإدارة):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Signature Preview */}
                    <div className="bg-white p-3 rounded-xl border border-forest-100">
                      <span className="font-bold text-forest-800 block mb-2">٢٢. صورة التوقيع المعتمد:</span>
                      <a
                        href={`/api/admin/files/${selectedStaff.signature_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-600 text-white text-xs font-semibold hover:bg-forest-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>فتح / معاينة صورة التوقيع</span>
                      </a>
                    </div>

                    {/* Certificates Previews */}
                    <div className="bg-white p-3 rounded-xl border border-forest-100">
                      <span className="font-bold text-forest-800 block mb-2">٢٣. الشهادات والمؤهلات:</span>
                      <div className="space-y-1.5">
                        {parseCertificates(selectedStaff.certificates_urls).map((cert, i) => (
                          <a
                            key={i}
                            href={`/api/admin/files/${cert}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-ivory-50 hover:bg-forest-50 border border-forest-100 text-[11px] font-semibold text-forest-800"
                          >
                            <span className="truncate max-w-[180px]">شهادة رقم ({i + 1})</span>
                            <span className="text-gold-700">معاينة الملف ←</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-forest-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleOpenForm261Preview}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-50 hover:bg-gold-100 border border-gold-300 text-forest-900 font-bold transition-colors shadow-sm"
                  >
                    <FileCheck2 className="w-4 h-4 text-gold-700" />
                    <span>عرض استمارة الوزارة (261)</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedStaff.id, 'rejected')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                    >
                      رفض الطلب
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedStaff.id, 'approved')}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold"
                    >
                      اعتماد وتعيين {selectedStaff.role}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
