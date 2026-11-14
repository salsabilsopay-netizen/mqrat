import React from 'react';
import { redirect } from 'next/navigation';
import { fetchAuditLogsAdmin, getDataSource } from '@/lib/data-layer';
import { isAdminAuthenticated } from '@/lib/auth';
import { ShieldCheck, History, Database, KeyRound, Server, FileCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const dataSource = getDataSource();
  const logs = (await fetchAuditLogsAdmin(40)) as {
    id: string;
    admin_user: string;
    action: string;
    target_type: string;
    target_id: string | null;
    details: string | null;
    created_at: string;
  }[];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-forest-200/80">
        <h1 className="text-2xl font-bold text-forest-800">
          سجل التدقيق والإعدادات الإدارية
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          مراقبة العمليات الحساسة، حالة قاعدة البيانات، وتكامل خوادم التخزين
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-forest-800">محرك قاعدة البيانات</div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                {dataSource === 'supabase' ? 'متصل ونشط (Supabase PostgreSQL)' : 'متصل ونشط (SQLite WAL Mode)'}
              </div>
            </div>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            قاعدة البيانات المحلية تعمل بكفاءة عبر SQLite مع وجود ملف ترقية Supabase/PostgreSQL جاهز في <code className="bg-ivory-100 px-1 py-0.5 rounded text-[10px]">supabase/schema.sql</code>.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-forest-800">التخزين الخاص للمستندات</div>
              <div className="text-[11px] text-emerald-600 font-semibold">تخزين آمن ومحمي (Private)</div>
            </div>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            جميع صور التواقيع والشهادات العلمية محفوظة في مسار محمي ومقيد فقط بمدير النظام عبر تصريح إداري مشفر.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-forest-100 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-forest-800">جلسات الإدارة</div>
              <div className="text-[11px] text-emerald-600 font-semibold">كوكيز مشفرة ومحمية (HTTP-Only)</div>
            </div>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            تأمين كامل ضد ثغرات XSS مع انتهاء صلاحية تلقائي للجلسات بعد 7 أيام.
          </p>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-forest-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-forest-600" />
            <h2 className="font-bold text-base text-forest-800">
              سجل العمليات الإدارية (Audit Trail)
            </h2>
          </div>
          <span className="text-xs text-charcoal-400">آخر 40 عملية مسجلة</span>
        </div>

        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-ivory-50 border-b border-forest-100 text-forest-900 font-bold">
                <tr>
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">العملية الإدارية</th>
                  <th className="py-3 px-4">نوع الهدف</th>
                  <th className="py-3 px-4">التفاصيل</th>
                  <th className="py-3 px-4">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ivory-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-forest-700">{log.admin_user}</td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-charcoal-500">{log.target_type}</td>
                    <td className="py-3 px-4 text-charcoal-600 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-charcoal-400">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-charcoal-500 text-xs">
            لا توجد سجلات تدقيق حتى الآن.
          </div>
        )}
      </div>

    </div>
  );
}
