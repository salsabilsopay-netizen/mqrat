'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, KeyRound, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'بيانات الدخول غير صحيحة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-forest-100 p-8 sm:p-10 shadow-card">
        
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 mb-3">
            <Image
              src="/logo.png"
              alt="شعار مقرأة الهدى"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-forest-800">
            لوحة الإدارة المشرفة
          </h1>
          <p className="text-xs text-gold-600 mt-1">
            مقرأة الهدى الإلكترونية لتعليم القرآن الكريم
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="absolute right-3.5 top-3 w-4 h-4 text-charcoal-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-3 w-4 h-4 text-charcoal-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-charcoal-300 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 text-sm outline-none bg-ivory-50/40"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-forest-100 text-[11px] text-charcoal-500 leading-normal flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
            <span>تسجيل الدخول مخصص فقط لمنسوبي إدارة المقرأة المصرح لهم.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-forest-100 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-forest-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة إلى موقع المقرأة العام</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
