'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  GraduationCap,
  ShieldCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { StatisticsData } from '@/types';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800">
            لوحة الإدارة العامة
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            متابعة دقيقة لطلبات التسجيل، الحلقات القرآنية، والمؤشرات التشغيلية للمقرأة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sessions"
            className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            + إضافة حلقة قرآنية
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-charcoal-500 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-forest-600 mx-auto mb-2" />
          <span>جارٍ تحميل مؤشرات لوحة التحكم...</span>
        </div>
      ) : (
        <>
          {/* Main KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Student Applications Total */}
            <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-charcoal-600">إجمالي طلبات الطالبات</span>
                <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-forest-800 font-sans mb-1">
                {(stats?.total_student_applications ?? 0).toLocaleString('ar-SA')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-forest-50">
                <span className="text-amber-600 font-semibold">قيد المراجعة: {stats?.pending_student_applications ?? 0}</span>
                <span className="text-emerald-600 font-semibold">المقبولات: {stats?.total_students ?? 0}</span>
              </div>
            </div>

            {/* Approved Students */}
            <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-charcoal-600">الطالبات المعتمدات فعلياً</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-sans mb-1">
                {(stats?.total_students ?? 0).toLocaleString('ar-SA')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-forest-50">
                <span>الكبار: {stats?.adult_students ?? 0}</span>
                <span>الأطفال: {stats?.child_students ?? 0}</span>
              </div>
            </div>

            {/* Staff Applications */}
            <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-charcoal-600">طلبات الكادر التعليمي</span>
                <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gold-700 font-sans mb-1">
                {(stats?.total_staff_applications ?? 0).toLocaleString('ar-SA')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-forest-50">
                <span className="text-amber-600 font-semibold">بانتظار المراجعة: {stats?.pending_staff_applications ?? 0}</span>
                <span className="text-forest-700 font-semibold">معتمدة: {(stats?.total_teachers ?? 0) + (stats?.total_supervisors ?? 0)}</span>
              </div>
            </div>

            {/* Quran Sessions */}
            <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-charcoal-600">حلقات المقرأة</span>
                <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-forest-800 font-sans mb-1">
                {(stats?.total_sessions ?? 0).toLocaleString('ar-SA')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-forest-50">
                <span className="text-emerald-600 font-semibold">متاح للتسجيل: {stats?.active_sessions ?? 0}</span>
                <span className="text-charcoal-400">غير متاح: {(stats?.total_sessions ?? 0) - (stats?.active_sessions ?? 0)}</span>
              </div>
            </div>

          </div>

          {/* Quick Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Link
              href="/admin/students"
              className="p-6 rounded-2xl bg-white border border-forest-100 shadow-subtle hover:shadow-card hover:border-forest-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-forest-800 text-base mb-1">
                  إدارة طلبات الطالبات
                </h3>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  مراجعة طلبات التسجيل، مطابقة الحلقات والمعلمات، وتحديث حالة الطلب (قبول / رفض).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-forest-50 flex items-center justify-between text-xs font-semibold text-forest-600">
                <span>فتح القائمة</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin/staff"
              className="p-6 rounded-2xl bg-white border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-forest-800 text-base mb-1">
                  طلبات المعلمات والمشرفات
                </h3>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  الاطلاع على الحقول الـ 23، فحص التواقيع المرفوعة والشهادات العلمية بخصوصية وأمان.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-forest-50 flex items-center justify-between text-xs font-semibold text-gold-700">
                <span>فحص الملفات</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin/sessions"
              className="p-6 rounded-2xl bg-white border border-forest-100 shadow-subtle hover:shadow-card hover:border-forest-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-forest-800 text-base mb-1">
                  إدارة الحلقات والروابط
                </h3>
                <p className="text-xs text-charcoal-500 leading-relaxed">
                  إنشاء حلقات جديدة، تعيين المعلمات، تحديد المنصات (Zoom/Meet)، وإعداد روابط الواتساب.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-forest-50 flex items-center justify-between text-xs font-semibold text-forest-600">
                <span>إدارة الحلقات</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>

          </div>

          {/* Operational Policy Note */}
          <div className="p-5 rounded-2xl bg-white border border-forest-100 text-xs text-charcoal-600 leading-relaxed">
            <h4 className="font-bold text-forest-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-600" />
              <span>معايير الخصوصية والرقابة الإدارية:</span>
            </h4>
            <p>
              تلتزم إدارة مقرأة الهدى بعدم مشاركة أو كشف السجلات الشخصية لأي جهة غير مصرح لها. الإحصائيات العامة المنشورة للزائرات تعكس فقط المجاميع المعتمدة بدون أسماء أو أرقام هوية.
            </p>
          </div>
        </>
      )}

    </div>
  );
}
