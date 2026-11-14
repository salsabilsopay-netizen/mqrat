'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, Quote, AlertCircle, X, Sparkles } from 'lucide-react';
import { Testimonial } from '@/types';
import { Reveal, GoldLineDraw } from '@/components/motion/MotionPrimitives';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTestimonials(data.testimonials);
        }
      })
      .catch((err) => console.error('Error loading testimonials:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: name,
          session_name: sessionName,
          rating,
          content,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال الرأي');
      }

      setSuccessMessage(data.message);
      setName('');
      setSessionName('');
      setContent('');
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ في الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="testimonials" className="scroll-mt-24 py-14 lg:py-20 bg-ivory-100/70 border-t border-forest-100 relative overflow-hidden">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Right-Aligned Editorial Header with CTA (Editorial Variation) */}
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-forest-200/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GoldLineDraw className="h-0.5 w-6 bg-gold-500 rounded-full" origin="right" />
              <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">
                مشاركات الطالبات
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest-800 tracking-tight">
              آراء طالبات مقرأة الهدى
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-lg">
              تجارب ومشاركات معتمدة ترويها الطالبات عن مسيرتهن في حفظ وتلاوة كتاب الله تعالى.
            </p>
          </div>

          {testimonials.length > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-cinematic inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm shadow-sm group w-fit"
            >
              <MessageSquarePlus className="w-4 h-4 text-gold-300 transition-transform duration-200 group-hover:scale-110" />
              <span>شاركينا تجربتكِ</span>
            </button>
          )}
        </Reveal>

        {/* Testimonials Grid or Refined Institutional Empty State (Instruction 7) */}
        {loading ? (
          <div className="py-12 text-center text-charcoal-500 text-xs">
            <div className="inline-block w-5 h-5 border-2 border-forest-600/30 border-t-forest-600 rounded-full animate-spin mb-2" />
            <div>جارٍ تحميل آراء الطالبات...</div>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
              <Reveal key={t.id} delay={Math.min(idx, 5) * 80} className="h-full">
                <div
                  className="h-full bg-white p-5 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-105 ${
                              i < t.rating
                                ? 'text-gold-500 fill-gold-500'
                                : 'text-charcoal-200'
                            }`}
                          />
                        ))}
                      </div>
                      <Quote className="w-5 h-5 text-gold-300 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-sans mb-5">
                      «{t.content}»
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-forest-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-forest-800">{t.student_name}</div>
                      {t.session_name && (
                        <div className="text-[11px] text-charcoal-500 mt-0.5">{t.session_name}</div>
                      )}
                    </div>
                    <span className="text-[10px] text-charcoal-400">
                      {new Date(t.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          /* Institutional Dignified Empty State */
          <Reveal delay={100}>
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-forest-100 shadow-subtle hover:shadow-card transition-shadow duration-300 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-ivory-100 text-forest-700 mx-auto flex items-center justify-center mb-4">
                <Quote className="w-6 h-6 text-gold-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-forest-800 mb-2">
                تجارب ومشاركات الطالبات
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-lg mx-auto mb-6">
                تخضع جميع المشاركات والآراء للتدقيق والاعتماد المسبق من إدارة المقرأة لضمان الموثوقية والمصداقية. نرحب بمشاركتكم تجاربكم الكريمة في حلقات المقرأة عبر الضغط على «شاركينا تجربتكِ».
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn-cinematic inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm shadow-sm group"
              >
                <MessageSquarePlus className="w-4 h-4 text-gold-300 transition-transform duration-200 group-hover:scale-110" />
                <span>شاركينا تجربتكِ</span>
              </button>
            </div>
          </Reveal>
        )}

      </div>

      {/* Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/50 backdrop-blur-sm animate-backdrop-fade"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-forest-100 p-6 sm:p-8 z-10 text-right overflow-y-auto max-h-[90vh] animate-modal-panel">
            <div className="flex items-center justify-between pb-4 border-b border-forest-100 mb-5">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-forest-600" />
                <h3 className="text-base sm:text-lg font-bold text-forest-800">
                  إضافة رأي أو تجربة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-forest-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم"
                    className="input-cinematic w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    اسم الحلقة أو المعلمة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="اسم الحلقة أو المعلمة إن وجد"
                    className="input-cinematic w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    التقييم
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            s <= rating
                              ? 'text-gold-500 fill-gold-500'
                              : 'text-charcoal-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-charcoal-500 mr-2">
                      ({rating} من 5 نجوم)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    تفاصيل الرأي والتجربة <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="صفي تجربتكِ التعليمية وأثر الحلقة عليكِ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/50 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-ivory-100 text-[11px] text-charcoal-600 leading-relaxed border border-forest-100">
                  ملاحظة: تخضع جميع الآراء للمراجعة من قبل إدارة المقرأة قبل نشرها للزائرات لضمان دقة وسلامة المحتوى.
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 hover:bg-forest-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs shadow disabled:opacity-50"
                  >
                    {submitting ? 'جارٍ الإرسال...' : 'إرسال الرأي'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
