'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Video,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { QuranSession, PlatformType, SessionStatus } from '@/types';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<QuranSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<QuranSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('Zoom');
  const [daysCount, setDaysCount] = useState('4 أيام');
  const [timeSlot, setTimeSlot] = useState('');
  const [daysSchedule, setDaysSchedule] = useState('الجمعة - السبت');
  const [status, setStatus] = useState<SessionStatus>('متاح');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const fetchSessions = () => {
    setLoading(true);
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.sessions);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const openCreateModal = () => {
    setEditingSession(null);
    setName('مقرأة الهدى - حلقة ');
    setTeacherName('');
    setPlatform('Zoom');
    setDaysCount('4 أيام');
    setTimeSlot('05:00 - 06:00 مساءً');
    setDaysSchedule('الجمعة - السبت');
    setStatus('متاح');
    setWhatsappUrl('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (s: QuranSession) => {
    setEditingSession(s);
    setName(s.name);
    setTeacherName(s.teacher_name);
    setPlatform(s.platform);
    setDaysCount(s.days_count);
    setTimeSlot(s.time_slot);
    setDaysSchedule(s.days_schedule);
    setStatus(s.status);
    setWhatsappUrl(s.whatsapp_url || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        name,
        teacher_name: teacherName,
        platform,
        days_count: daysCount,
        time_slot: timeSlot,
        days_schedule: daysSchedule,
        status,
        whatsapp_url: whatsappUrl,
      };

      let res;
      if (editingSession) {
        res = await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSession.id, ...payload }),
        });
      } else {
        res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حفظ الحلقة');
      }

      setModalOpen(false);
      fetchSessions();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ في الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, sessionName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحلقة (${sessionName})؟`)) return;

    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      } else {
        alert(data.error || 'فشل حذف الحلقة');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-200/80">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">
            إدارة حلقات المقرأة
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            إضافة الحلقات، تعيين المعلمات، تحديد المنصات والمواعيد، وضبط روابط مجموعات الواتساب
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-forest-100 text-xs font-semibold text-charcoal-700 hover:bg-forest-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-gold-300" />
            <span>إضافة حلقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="py-20 text-center text-charcoal-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-forest-600 mx-auto mb-2" />
          <span>جارٍ تحميل الحلقات...</span>
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-forest-100 p-6 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-100">
                    <Video className="w-3 h-3 text-forest-600" />
                    <span>{s.platform}</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      s.status === 'متاح'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {s.status === 'متاح' ? 'متاح التسجيل' : 'غير متاح'}
                  </span>
                </div>

                <h3 className="font-bold text-forest-800 text-base mb-1">{s.name}</h3>
                
                <div className="flex items-center gap-1.5 text-xs text-charcoal-600 mb-4">
                  <User className="w-3.5 h-3.5 text-gold-600" />
                  <span>المعلمة: <strong>{s.teacher_name}</strong></span>
                </div>

                <div className="space-y-2 text-xs text-charcoal-600 border-t border-forest-50 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-400">الموعد:</span>
                    <span className="font-semibold">{s.time_slot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-400">الأيام:</span>
                    <span className="font-semibold">{s.days_schedule} ({s.days_count})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-400">رابط الواتساب:</span>
                    <span className="font-mono text-[11px] text-forest-700 truncate max-w-[150px]">
                      {s.whatsapp_url ? 'مُعد ✓' : 'غير محدد'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-forest-100 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-100 hover:bg-forest-50 text-forest-800 text-xs font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-charcoal-500 text-xs bg-white rounded-2xl border border-dashed border-forest-200">
          لا توجد حلقات مسجلة حالياً. اضغط على «إضافة حلقة جديدة» لإنشاء أول حلقة.
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-elevated border border-forest-100 p-6 sm:p-8 z-10 text-right overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-forest-100 mb-6">
              <h3 className="text-lg font-bold text-forest-800">
                {editingSession ? 'تعديل بيانات الحلقة' : 'إضافة حلقة قرآنية جديدة'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-charcoal-400 hover:bg-forest-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">اسم الحلقة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مقرأة الهدى - حلقة الفجر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">اسم المعلمة</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="مثال: أ. خديجة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">المنصة المعتمدة</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PlatformType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40 font-medium"
                  >
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">حالة التسجيل</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SessionStatus)}
                    className="w-full px-3 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40 font-medium"
                  >
                    <option value="متاح">متاح التسجيل</option>
                    <option value="غير متاح">غير متاح</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">موعد الحلقة</label>
                  <input
                    type="text"
                    required
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="مثال: 06:00 - 07:00 صباحاً"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">أيام الحلقة</label>
                  <input
                    type="text"
                    required
                    value={daysSchedule}
                    onChange={(e) => setDaysSchedule(e.target.value)}
                    placeholder="مثال: الجمعة - السبت"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  رابط مجموعة الواتساب الخاصة بالحلقة (اختياري)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40 text-left"
                />
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  سيظهر هذا الرابط للطالبة تلقائياً في شاشة التأكيد فور نجاح تسجيلها.
                </span>
              </div>

              <div className="pt-4 border-t border-forest-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-charcoal-600 hover:bg-forest-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold shadow disabled:opacity-50"
                >
                  {submitting ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
