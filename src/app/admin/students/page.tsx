'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  IdCard,
} from 'lucide-react';
import { StudentApplication } from '@/types';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/students?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStudents(data.students);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStudents();
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent({ ...selectedStudent, status, notes });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.id_number.includes(q) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest-200/80">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">
            إدارة طلبات الطالبات
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            مراجعة طلبات التسجيل، اعتماد القبول، وربط الطالبات بالحلقات والمعلمات
          </p>
        </div>

        <button
          onClick={fetchStudents}
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
            placeholder="بحث بالاسم، الجوال، رقم الهوية..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-xs outline-none bg-ivory-50/40"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد المراجعة' },
            { id: 'approved', label: 'المقبولات' },
            { id: 'rejected', label: 'المرفوضة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-forest-600 text-white'
                  : 'bg-ivory-50 text-charcoal-600 hover:bg-forest-50 border border-forest-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-forest-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-charcoal-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-600 mx-auto mb-2" />
            <span>جارٍ تحميل طلبات الطالبات...</span>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-ivory-50 border-b border-forest-100 text-forest-900 font-bold">
                <tr>
                  <th className="py-3 px-4">اسم الطالبة</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">الهوية / الإقامة</th>
                  <th className="py-3 px-4">الدولة والمدينة</th>
                  <th className="py-3 px-4">الحلقة والمعلمة</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ التقديم</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-forest-800">
                      <div>{s.full_name}</div>
                      <div className="text-[10px] text-charcoal-400 font-normal">
                        {s.is_child ? 'طفلة' : 'كبيرة'} • {s.nationality}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-charcoal-700" dir="ltr">
                      {s.phone}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-charcoal-600">
                      <div>{s.id_number}</div>
                      <div className="text-[10px] text-charcoal-400 font-sans">{s.id_type}</div>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700">
                      <div>{s.residence_country}</div>
                      <div className="text-[10px] text-charcoal-400">{s.residence_city}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-forest-700">{s.session_name || 'حلقة'}</div>
                      <div className="text-[10px] text-charcoal-500">المعلمة: {s.teacher_name || 'غير محدد'}</div>
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
                        {s.status === 'approved' ? 'مقبولة' : s.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-charcoal-500 font-mono">
                      {new Date(s.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          title="عرض التفاصيل"
                          className="p-1.5 rounded-lg bg-ivory-100 hover:bg-forest-100 text-forest-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {s.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, 'approved')}
                            disabled={actionLoading}
                            title="قبول واعتماد الطالبة"
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-charcoal-500 text-xs">
            لا توجد طلبات طالبات مطابقة للتصفية الحالية.
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/50 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-elevated border border-forest-100 p-6 sm:p-8 z-10 text-right overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-forest-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-forest-800">
                  تفاصيل طلب الطالبة
                </h3>
                <span className="text-xs text-charcoal-400 font-mono">ID: {selectedStudent.id}</span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:bg-forest-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-ivory-50 p-4 rounded-xl border border-forest-100">
                <div>
                  <span className="text-charcoal-500 block mb-1">الاسم الكامل:</span>
                  <strong className="text-sm text-forest-800">{selectedStudent.full_name}</strong>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">الحالة:</span>
                  <strong className="text-sm text-forest-800">
                    {selectedStudent.status === 'approved' ? 'مقبولة' : selectedStudent.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                  </strong>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">رقم الجوال:</span>
                  <span className="font-mono text-sm" dir="ltr">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">البريد الإلكتروني:</span>
                  <span className="font-mono text-xs">{selectedStudent.email || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">نوع ورقم الهوية:</span>
                  <span className="font-semibold">{selectedStudent.id_type}: {selectedStudent.id_number}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">الجنسية:</span>
                  <span className="font-semibold">{selectedStudent.nationality}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">بلد ومدينة الإقامة:</span>
                  <span className="font-semibold">{selectedStudent.residence_country} — {selectedStudent.residence_city}</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block mb-1">تاريخ الميلاد:</span>
                  <span className="font-mono">{selectedStudent.birth_date}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-forest-50 border border-forest-100">
                <div className="font-bold text-forest-800 mb-2">معلومات الحلقة المختارة:</div>
                <div className="text-xs text-forest-900 space-y-1">
                  <div><strong>الحلقة:</strong> {selectedStudent.session_name || 'حلقة مقرأة الهدى'}</div>
                  <div><strong>المعلمة:</strong> {selectedStudent.teacher_name || 'غير محدد'}</div>
                </div>
              </div>

              {selectedStudent.notes && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <strong>ملاحظات الإدارة:</strong> {selectedStudent.notes}
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-forest-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedStudent.id, 'rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                >
                  رفض الطلب
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedStudent.id, 'approved')}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold"
                >
                  قبول واعتماد الطالبة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
