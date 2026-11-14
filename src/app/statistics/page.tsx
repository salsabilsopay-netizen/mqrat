'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserCheck, Baby, GraduationCap, ShieldCheck, Globe, ArrowLeft, BarChart3, Info } from 'lucide-react';
import { StatisticsData } from '@/types';
import { Reveal, GoldLineDraw, CountUpNumber } from '@/components/motion/MotionPrimitives';

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetch('/api/statistics')
      .then((res) => {
        if (!res.ok) throw new Error('فشل جلب البيانات');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        } else {
          setHasError(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val) || val === 0) return '0';
    return val.toLocaleString();
  };

  const total = stats?.total_students || 0;

  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-ivory-100 min-h-screen">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500 mb-8">
          <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <span className="text-forest-700 font-semibold">إحصائيات المقرأة</span>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="animate-hero-badge inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-semibold mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-gold-600" />
            <span>بيانات حية ومباشرة</span>
          </div>
          <h1 className="animate-hero-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-800 tracking-tight">
            إحصائيات المقرأة
          </h1>
          <div className="mt-3 mb-4 flex justify-center">
            <GoldLineDraw className="w-16 h-1 bg-gold-500 rounded-full" origin="center" />
          </div>
          <p className="animate-hero-desc text-sm sm:text-base text-charcoal-600 leading-relaxed">
            يتم احتساب هذه البيانات الإحصائية بشكل آلي ودقيق من واقع السجلات المعتمدة بقاعدة البيانات لتعكس الأعداد الحقيقية للطالبات والمنسوبات بالمقرأة.
          </p>
        </div>

        {/* 5 Main Statistical Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-12">
          
          <Reveal delay={0} className="h-full">
            <div className="h-full bg-white p-6 rounded-2xl border border-forest-100 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-forest-700 font-sans mb-1 min-h-[36px] flex items-center justify-center">
                {loading ? (
                  <span className="inline-block w-14 h-7 bg-forest-100/60 rounded-md animate-pulse" />
                ) : hasError ? (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                ) : (
                  <CountUpNumber value={stats?.total_students ?? 0} />
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-800 mb-1">إجمالي الطالبات (ككل)</div>
              <div className="text-xs text-charcoal-500">المقيدات بالحلقات</div>
            </div>
          </Reveal>

          <Reveal delay={75} className="h-full">
            <div className="h-full bg-white p-6 rounded-2xl border border-forest-100 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gold-700 font-sans mb-1 min-h-[36px] flex items-center justify-center">
                {loading ? (
                  <span className="inline-block w-14 h-7 bg-gold-100/60 rounded-md animate-pulse" />
                ) : hasError ? (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                ) : (
                  <CountUpNumber value={stats?.adult_students ?? 0} />
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-800 mb-1">إجمالي الطالبات الكبار</div>
              <div className="text-xs text-charcoal-500">حلقات البالغات</div>
            </div>
          </Reveal>

          <Reveal delay={150} className="h-full">
            <div className="h-full bg-white p-6 rounded-2xl border border-forest-100 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Baby className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-forest-700 font-sans mb-1 min-h-[36px] flex items-center justify-center">
                {loading ? (
                  <span className="inline-block w-14 h-7 bg-forest-100/60 rounded-md animate-pulse" />
                ) : hasError ? (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                ) : (
                  <CountUpNumber value={stats?.child_students ?? 0} />
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-800 mb-1">إجمالي الأطفال</div>
              <div className="text-xs text-charcoal-500">حلقات البراعم والناشئة</div>
            </div>
          </Reveal>

          <Reveal delay={225} className="h-full">
            <div className="h-full bg-white p-6 rounded-2xl border border-forest-100 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gold-700 font-sans mb-1 min-h-[36px] flex items-center justify-center">
                {loading ? (
                  <span className="inline-block w-14 h-7 bg-gold-100/60 rounded-md animate-pulse" />
                ) : hasError ? (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                ) : (
                  <CountUpNumber value={stats?.total_teachers ?? 0} />
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-800 mb-1">إجمالي المعلمات</div>
              <div className="text-xs text-charcoal-500">المعتمدات في المقرأة</div>
            </div>
          </Reveal>

          <Reveal delay={300} className="h-full">
            <div className="h-full bg-white p-6 rounded-2xl border border-forest-100 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-forest-700 font-sans mb-1 min-h-[36px] flex items-center justify-center">
                {loading ? (
                  <span className="inline-block w-14 h-7 bg-forest-100/60 rounded-md animate-pulse" />
                ) : hasError ? (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                ) : (
                  <CountUpNumber value={stats?.total_supervisors ?? 0} />
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-800 mb-1">إجمالي المشرفات</div>
              <div className="text-xs text-charcoal-500">فريق الجودة والمتابعة</div>
            </div>
          </Reveal>

        </div>

        {/* Country Breakdown & Map Visual */}
        <Reveal delay={120}>
          <div className="bg-white rounded-3xl border border-forest-100 p-8 sm:p-10 shadow-card mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-forest-100 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-forest-800 flex items-center gap-2.5">
                  <Globe className="w-6 h-6 text-gold-600" />
                  <span>إحصائيات التسجيل حسب الدول</span>
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
                  تُحدث هذه القائمة آلياً بناءً على الدولة المحددة في طلبات التسجيل المعتمدة
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-charcoal-500 text-sm">
                جارٍ معالجة إحصائيات الدول...
              </div>
            ) : stats?.countries && stats.countries.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Detailed Progress Bars */}
                <div className="lg:col-span-7 space-y-4">
                  {stats.countries.map((c, idx) => {
                    const percentage = total > 0 ? Math.round((c.count / total) * 100) : 0;
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-ivory-50 border border-forest-100/70 hover:border-gold-300 transition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-forest-800">{c.country}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-charcoal-700 font-sans">
                              {formatNumber(c.count)} طالبة
                            </span>
                            <span className="text-[11px] font-semibold text-gold-700 bg-gold-100 px-2 py-0.5 rounded-full font-sans">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-forest-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-forest-600 h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(4, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Card */}
                <div className="lg:col-span-5 bg-forest-900 text-white p-7 rounded-2xl shadow-elevated">
                  <h3 className="text-lg font-bold text-gold-300 mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span>توسع وانتشار عالمي</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-ivory-200 leading-relaxed mb-6">
                    بفضل الله وتوفيقه، استطاعت مقرأة الهدى الإلكترونية توفير حلقات قرآنية منتظمة بإشراف نخبوي في مختلف البلدان.
                  </p>

                  <div className="p-4 rounded-xl bg-forest-800/80 border border-gold-500/20 text-xs text-ivory-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>عدد الدول النشطة:</span>
                      <strong className="text-white font-sans">{formatNumber(stats.countries.length)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التحديث:</span>
                      <span className="text-gold-300">مباشر وفوري مع كل تسجيل</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/schedule"
                      className="btn-cinematic flex items-center justify-center gap-2 w-full py-3 bg-gold-600 hover:bg-gold-700 text-forest-950 font-bold text-xs rounded-xl shadow group"
                    >
                      <span>انضمي إلى طالبات المقرأة اليوم</span>
                      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-charcoal-500 text-sm bg-ivory-50 rounded-2xl border border-dashed border-forest-200">
                لا توجد بيانات تسجيل مؤكدة حالياً، وسيتم تحديث إحصائيات الدول تلقائياً بمجرد اعتماد التسجيلات الجديدة.
              </div>
            )}
          </div>
        </Reveal>

        {/* Institutional Integrity Notice */}
        <Reveal delay={180}>
          <div className="p-5 rounded-2xl bg-white border border-forest-100 flex items-start gap-3.5 text-xs text-charcoal-600 leading-relaxed">
            <Info className="w-5 h-5 text-forest-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>إشعار الأمان والشفافية الإحصائية:</strong> تخضع جميع الإحصائيات المعروضة لمعايير الخصوصية الصارمة لمقرأة الهدى. لا يتم عرض أي أسماء أو أرقام هواتف أو بيانات شخصية للزائرات، وتقتصر الأرقام على التجميع الإحصائي الإجمالي الصادر عن سجلات المقرأة الرسمية.
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
