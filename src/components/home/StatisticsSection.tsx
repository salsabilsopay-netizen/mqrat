'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserCheck, Baby, GraduationCap, ShieldCheck, Globe, ArrowLeft } from 'lucide-react';
import { StatisticsData } from '@/types';
import { Reveal, GoldLineDraw, CountUpNumber } from '@/components/motion/MotionPrimitives';

export default function StatisticsSection() {
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
        console.error('Error fetching statistics:', err);
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'إجمالي الطالبات (ككل)',
      subtext: 'المقبولات رسمياً بالمقرأة',
      value: stats?.total_students ?? 0,
      icon: Users,
    },
    {
      label: 'إجمالي الطالبات الكبار',
      subtext: 'حلقات النساء والبالغات',
      value: stats?.adult_students ?? 0,
      icon: UserCheck,
    },
    {
      label: 'إجمالي عدد الأطفال',
      subtext: 'حلقات البراعم والناشئة',
      value: stats?.child_students ?? 0,
      icon: Baby,
    },
    {
      label: 'إجمالي عدد المعلمات',
      subtext: 'المعلمات المعتمدات',
      value: stats?.total_teachers ?? 0,
      icon: GraduationCap,
    },
    {
      label: 'إجمالي عدد المشرفات',
      subtext: 'الكادر الإشرافي والمتابعة',
      value: stats?.total_supervisors ?? 0,
      icon: ShieldCheck,
    },
  ];

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val) || val === 0) return '0';
    return val.toLocaleString();
  };

  return (
    <section id="statistics" className="scroll-mt-24 py-14 lg:py-20 bg-ivory-100 border-y border-forest-100/70 relative overflow-hidden">
      <div className="absolute inset-0 bg-islamic-pattern opacity-35 animate-ornament-ambient pointer-events-none" />
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Asymmetric Header Layout (Editorial Variation) */}
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-forest-200/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GoldLineDraw className="h-0.5 w-6 bg-gold-500 rounded-full" origin="right" />
              <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">
                بيانات المقرأة المعتمدة
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest-800 tracking-tight">
              إحصائيات المقرأة
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-charcoal-600 max-w-md text-right leading-relaxed">
            تُحسب هذه الإحصائيات آلياً من واقع السجلات المعتمدة في قاعدة البيانات دون أي أرقام تقديرية.
          </p>
        </Reveal>

        {/* 5 Main Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-10">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Reveal key={idx} delay={idx * 75} className="h-full">
                <div className="h-full bg-white p-4 sm:p-5 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-600 mb-2.5 group-hover:scale-110 group-hover:bg-forest-100/70 transition-all duration-300">
                    <Icon className="w-5 h-5 text-forest-700" />
                  </div>
                  
                  <div className="text-2xl sm:text-3xl font-extrabold text-forest-800 font-sans tracking-tight mb-1 min-h-[36px] flex items-center justify-center">
                    {loading ? (
                      <span className="inline-block w-14 h-7 bg-forest-100/60 rounded-md animate-pulse" />
                    ) : hasError ? (
                      <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-sans font-medium">تعذر التحميل</span>
                    ) : (
                      <CountUpNumber value={card.value} />
                    )}
                  </div>
                  
                  <div className="text-xs sm:text-sm font-bold text-charcoal-800 leading-tight mb-1">
                    {card.label}
                  </div>
                  
                  <div className="text-[10px] sm:text-[11px] text-charcoal-500">
                    {card.subtext}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Country Statistics Block */}
        <Reveal delay={180}>
          <div className="bg-white rounded-2xl border border-forest-100 p-5 sm:p-7 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-forest-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-forest-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gold-600" />
                  <span>إحصائيات التسجيل حسب الدول</span>
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  توزيع الطالبات بحسب بلد الإقامة في نموذج التسجيل
                </p>
              </div>

              <Link
                href="/statistics"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-600 hover:text-forest-700 group w-fit"
              >
                <span>عرض التقرير الإحصائي الكامل</span>
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            </div>

            {/* Countries Content or Refined Zero State */}
            <div className="pt-5">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-10 bg-forest-50/70 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : stats?.countries && stats.countries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {stats.countries.slice(0, 6).map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-ivory-50 border border-forest-100/70 hover:border-gold-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-charcoal-800 truncate">
                        {c.country}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-forest-600 text-white font-sans">
                        {formatNumber(c.count)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center text-xs text-charcoal-600 bg-ivory-50 rounded-xl border border-forest-100 flex flex-col items-center justify-center">
                  <span className="font-semibold text-forest-800 mb-1">لا توجد سجلات تسجيل معتمدة حالياً</span>
                  <span className="text-charcoal-500 text-[11px]">
                    يتم تحديث قائمة الدول واحتساب نسب التسجيل بصورة تلقائية فور اعتماد تسجيلات الطالبات الجديدة في قاعدة البيانات.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
