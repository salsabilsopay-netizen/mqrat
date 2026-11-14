'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Quote,
} from 'lucide-react';
import { Testimonial } from '@/types';

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTestimonials = () => {
    setLoading(true);
    fetch('/api/admin/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTestimonials(data.testimonials);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTestimonials();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الرأي نهائياً؟')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTestimonials();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-200/80">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">
            إدارة آراء وشهادات الطالبات
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            مراجعة الآراء والتجارب المرسلة من الزائرات، اعتماد النشر في الصفحة الرئيسية، ومكافحة الرسائل المزعجة
          </p>
        </div>

        <button
          onClick={fetchTestimonials}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-forest-100 text-xs font-semibold text-charcoal-700 hover:bg-forest-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحديث</span>
        </button>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-charcoal-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-600 mx-auto mb-2" />
            <span>جارٍ تحميل الآراء...</span>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="divide-y divide-forest-50">
            {testimonials.map((t) => (
              <div key={t.id} className="p-5 hover:bg-ivory-50/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-forest-800">{t.student_name}</span>
                    {t.session_name && (
                      <span className="text-[11px] text-charcoal-500 bg-ivory-100 px-2 py-0.5 rounded-md">
                        {t.session_name}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.is_approved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.is_approved ? 'معتمد للنشر في الموقع' : 'بانتظار المراجعة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < t.rating ? 'text-gold-500 fill-gold-500' : 'text-charcoal-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] text-charcoal-400 mr-2 font-mono">
                      {new Date(t.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-sans bg-ivory-50/80 p-3 rounded-xl border border-forest-100/50">
                    «{t.content}»
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggleApproval(t.id, t.is_approved)}
                    disabled={actionLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      t.is_approved
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {t.is_approved ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>تعطيل النشر</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>اعتماد ونشر في الموقع</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-charcoal-500 text-xs">
            لا توجد آراء مسجلة حتى الآن.
          </div>
        )}
      </div>

    </div>
  );
}
