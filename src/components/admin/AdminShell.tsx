'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'لوحة التحكم العامة', href: '/admin', icon: LayoutDashboard },
    { name: 'طلبات الطالبات', href: '/admin/students', icon: Users },
    { name: 'طلبات المعلمات والمشرفات', href: '/admin/staff', icon: GraduationCap },
    { name: 'إدارة حلقات المقرأة', href: '/admin/sessions', icon: Calendar },
    { name: 'إدارة الآراء والشهادات', href: '/admin/testimonials', icon: MessageSquare },
    { name: 'سجل التدقيق والإعدادات', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col lg:flex-row text-charcoal-800">
      
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-forest-900 text-white px-4 py-3 flex items-center justify-between border-b border-forest-800">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8">
            <Image src="/logo.png" alt="شعار مقرأة الهدى" fill className="object-contain" />
          </div>
          <span className="font-bold text-sm">إدارة مقرأة الهدى</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg text-ivory-200 hover:bg-forest-800"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop / Responsive Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-40 h-screen w-64 bg-forest-900 text-ivory-100 flex flex-col justify-between border-l border-forest-800 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-forest-800 flex items-center gap-3">
            <div className="relative w-10 h-10 bg-white/10 rounded-xl p-1 border border-gold-500/20">
              <Image src="/logo.png" alt="شعار مقرأة الهدى" fill className="object-contain" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">لوحة الإدارة</div>
              <div className="text-[11px] text-gold-400">مقرأة الهدى الإلكترونية</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-forest-700 text-gold-300 shadow-sm border border-gold-500/20'
                      : 'text-ivory-300 hover:bg-forest-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-forest-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ivory-300 hover:bg-forest-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
              <span>الموقع العام للمقرأة</span>
            </span>
            <span className="text-[10px] bg-forest-800 px-1.5 py-0.5 rounded text-gold-300">زيارة</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
