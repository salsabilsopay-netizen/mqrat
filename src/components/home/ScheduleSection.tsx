'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Video, User, Users, AlertCircle, ArrowLeft, Filter, CheckSquare, BookOpen } from 'lucide-react';
import { QuranSession } from '@/types';
import { Reveal, GoldLineDraw } from '@/components/motion/MotionPrimitives';

export default function ScheduleSection() {
  const [sessions, setSessions] = useState<QuranSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'Zoom' | 'Google Meet'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.sessions);
        }
      })
      .catch((err) => console.error('Error loading sessions:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (platformFilter !== 'all' && s.platform !== platformFilter) return false;
    const isFull = typeof s.max_students === 'number' && s.max_students > 0 && (s.registered_students_count ?? 0) >= s.max_students;
    if (onlyAvailable && (s.status !== 'متاح' || isFull)) return false;
    return true;
  });

  return (
    <section id="schedule" className="scroll-mt-24 py-14 lg:py-20 bg-white relative">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Right-Aligned Editorial Header (Editorial Variation) */}
        <Reveal className="mb-10 text-right">
          <div className="flex items-center gap-2 mb-2">
            <GoldLineDraw className="h-0.5 w-6 bg-gold-500 rounded-full" origin="right" />
            <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">
              نظام وحلقات المقرأة
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest-800 tracking-tight">
            أوقات وحلقات المقرأة
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl">
            نظام تعليمي متكامل في رحاب القرآن الكريم عن بُعد عبر المنصات المعتمدة بإشراف معلمات مؤهلات.
          </p>
        </Reveal>

        {/* Dual Guidance System (Page 9 & 10 from PDF) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          
          {/* Instructions Block */}
          <Reveal delay={70}>
            <div className="h-full bg-ivory-50 p-5 sm:p-6 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card transition-shadow duration-300">
              <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-forest-100">
                <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-gold-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-forest-800">
                    تعليمات مهمة للطالبات
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    لضمان تجربة تعليمية متميزة وتحقيق أقصى فائدة
                  </p>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-charcoal-700 leading-relaxed">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">١</span>
                  <span><strong>تحميل التطبيق:</strong> تحميل Zoom أو Google Meet المعتمد للحلقة مسبقاً.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٢</span>
                  <span><strong>الحضور بالموعد:</strong> الالتزام بالوقت المحدد للحلقة والحرص على الانتظام.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٣</span>
                  <span><strong>الاستماع والانضباط:</strong> إغلاق الميكروفون عند الدخول واتباع إرشادات المعلمة.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٤</span>
                  <span><strong>آداب المجلس:</strong> حسن الاستماع وعدم مقاطعة الزميلات أثناء التسميع.</span>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Registration Steps Block */}
          <Reveal delay={150}>
            <div className="h-full bg-forest-50/50 p-5 sm:p-6 rounded-2xl border border-forest-200/60 shadow-subtle hover:shadow-card transition-shadow duration-300">
              <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-forest-200/40">
                <div className="w-8 h-8 rounded-xl bg-gold-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-forest-800">
                    طريقة التسجيل في 4 خطوات
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    تسجيل مباشر دون الحاجة لإنشاء حساب مسبق
                  </p>
                </div>
              </div>

              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-charcoal-700 leading-relaxed">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">١</span>
                  <span><strong>اختيار الحلقة:</strong> استعراض الأوقات واختيار حلقة «متاح التسجيل».</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٢</span>
                  <span><strong>تعبئة البيانات:</strong> إدخال بيانات الطالبة بدقة في نموذج التسجيل.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٣</span>
                  <span><strong>الموافقة على التعهد:</strong> الاطلاع على ميثاق الطالبة وقبوله.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-forest-100/60 hover:border-gold-300 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">٤</span>
                  <span><strong>رابط الواتساب:</strong> الانضمام مباشرة للمجموعة المعتمدة للحلقة.</span>
                </li>
              </ol>
            </div>
          </Reveal>

        </div>

        {/* Sessions Content */}
        {loading ? (
          <div className="py-12 text-center text-charcoal-500 text-xs">
            <div className="inline-block w-5 h-5 border-2 border-forest-600/30 border-t-forest-600 rounded-full animate-spin mb-2" />
            <div>جارٍ تحميل جدول الحلقات...</div>
          </div>
        ) : sessions.length > 0 ? (
          <>
            {/* Filter Toolbar (Only shown when sessions exist) */}
            <Reveal delay={100}>
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-ivory-100 border border-forest-100 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-forest-600" />
                  <span className="text-xs font-bold text-forest-800">تصفية المنصة:</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'Zoom', 'Google Meet'] as const).map((plat) => (
                      <button
                        key={plat}
                        onClick={() => setPlatformFilter(plat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                          platformFilter === plat
                            ? 'bg-forest-600 text-white shadow-sm'
                            : 'bg-white text-charcoal-700 hover:bg-forest-50 border border-forest-100'
                        }`}
                      >
                        {plat === 'all' ? 'جميع المنصات' : plat}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-charcoal-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-forest-600 focus:ring-forest-500 accent-forest-600"
                  />
                  <span>عرض المتاح فقط</span>
                </label>
              </div>
            </Reveal>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessions.map((session, idx) => {
                const isFull = typeof session.max_students === 'number' &&
                  session.max_students > 0 &&
                  (session.registered_students_count ?? 0) >= session.max_students;
                const isAvailable = session.status === 'متاح' && !isFull;
                return (
                  <Reveal key={session.id} delay={Math.min(idx, 5) * 75} className="h-full">
                    <div
                      className={`h-full relative rounded-2xl bg-white border p-5 flex flex-col justify-between transition-all duration-300 group ${
                        isAvailable
                          ? 'border-forest-200 hover:border-gold-400 hover:-translate-y-1.5 hover:shadow-elevated'
                          : 'border-charcoal-200 opacity-85 bg-gray-50/60 hover:-translate-y-0.5 hover:shadow-subtle'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-100">
                            <Video className="w-3 h-3 text-forest-600 transition-transform duration-300 group-hover:scale-110" />
                            <span>{session.platform}</span>
                          </span>

                          <span className="text-xs font-semibold text-charcoal-500 bg-ivory-100 px-2 py-0.5 rounded-lg">
                            {session.days_count}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1 text-xs text-charcoal-500">
                          <User className="w-3.5 h-3.5 text-gold-600 transition-transform duration-300 group-hover:scale-110" />
                          <span>اسم المعلمة:</span>
                        </div>
                        <h3 className="text-base font-bold text-forest-800 mb-3 font-sans">
                          {session.teacher_name}
                        </h3>

                        <div className="space-y-2 pt-2.5 border-t border-forest-100 text-xs text-charcoal-600">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-charcoal-500">
                              <Clock className="w-3 h-3 text-gold-600" />
                              <span>موعد الحلقة:</span>
                            </span>
                            <span className="font-semibold text-charcoal-800">{session.time_slot}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-charcoal-500">
                              <Calendar className="w-3 h-3 text-gold-600" />
                              <span>أيام الحلقة:</span>
                            </span>
                            <span className="font-semibold text-charcoal-800">{session.days_schedule}</span>
                          </div>

                          {typeof session.max_students === 'number' && session.max_students > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-charcoal-500">
                                <Users className="w-3 h-3 text-gold-600" />
                                <span>المقاعد الشاغرة:</span>
                              </span>
                              <span className={`font-semibold ${isFull ? 'text-rose-600' : 'text-forest-700'}`}>
                                {isFull
                                  ? 'اكتملت المقاعد'
                                  : `متبقي ${session.max_students - (session.registered_students_count ?? 0)} من ${session.max_students}`}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-charcoal-500">اسم المقرأة:</span>
                            <span className="font-medium text-forest-700">مقرأة الهدى</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-forest-100 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFull
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isAvailable ? 'متاح التسجيل' : isFull ? 'مكتملة العدد' : 'غير متاح'}
                        </span>

                        {isAvailable ? (
                          <Link
                            href={`/register/student?sessionId=${session.id}`}
                            className="btn-cinematic inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs shadow-sm hover:shadow group/btn"
                          >
                            <span>التسجيل في الحلقة</span>
                            <ArrowLeft className="w-3 h-3 text-gold-300 transition-transform duration-200 group-hover/btn:-translate-x-1" />
                          </Link>
                        ) : isFull ? (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium text-xs cursor-not-allowed"
                          >
                            اكتمل عدد الطالبات
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-charcoal-100 text-charcoal-400 font-medium text-xs cursor-not-allowed"
                          >
                            غير متاح حالياً
                          </button>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </>
        ) : (
          /* Institutional Empty State (Instruction 6) */
          <Reveal delay={120}>
            <div className="p-8 sm:p-10 rounded-2xl bg-ivory-50 border border-forest-100 text-center max-w-2xl mx-auto shadow-subtle">
              <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 mx-auto flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-forest-700" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-forest-800 mb-2">
                مواعيد الحلقات القرآنية
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-lg mx-auto mb-6">
                يتم تحديث وإعلان جداول الحلقات القرآنية المعتمدة بالتنسيق مع إدارة المقرأة والمعلمات. ترقبوا الإعلان عن مواعيد الحلقات الجديدة قريباً أو تواصلوا مع إدارة المقرأة.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 text-white text-xs font-semibold shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-gold-300" />
                <span>ترقبوا فتح باب التسجيل للحلقات الجديدة</span>
              </div>
            </div>
          </Reveal>
        )}

      </div>
    </section>
  );
}
