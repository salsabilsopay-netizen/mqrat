'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, UserPlus, GraduationCap, ChevronLeft, ShieldCheck } from 'lucide-react';

const TOP_VISIBLE_OFFSET = 100;
const SCROLLED_STYLE_OFFSET = 20;
const SCROLL_DOWN_THRESHOLD = 10;
const SCROLL_UP_THRESHOLD = 8;

const KEYBOARD_NAV_KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
  ' ',
  'Escape',
]);

export default function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);

  const isScrolledRef = useRef(false);
  const isHiddenRef = useRef(false);
  const mobileMenuOpenRef = useRef(false);
  const lastYRef = useRef(0);
  const anchorYRef = useRef(0);
  const directionRef = useRef<'up' | 'down' | null>(null);
  const hadKeyboardRef = useRef(false);

  const setScrolledSafe = useCallback((next: boolean) => {
    if (isScrolledRef.current !== next) {
      isScrolledRef.current = next;
      setIsScrolled(next);
    }
  }, []);

  const setHiddenSafe = useCallback((next: boolean) => {
    if (isHiddenRef.current !== next) {
      isHiddenRef.current = next;
      setIsHidden(next);
    }
  }, []);

  const resetScrollAnchors = useCallback((y: number) => {
    lastYRef.current = y;
    anchorYRef.current = y;
    directionRef.current = null;
  }, []);

  // Track whether the most recent user interaction was via keyboard for focus reveal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (KEYBOARD_NAV_KEYS.has(e.key)) {
        hadKeyboardRef.current = true;
      }
    };
    const onPointerDown = () => {
      hadKeyboardRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);

  // Reset navigation UI and scroll anchors cleanly across route transitions
  useEffect(() => {
    setMobileMenuOpen(false);
    mobileMenuOpenRef.current = false;
    setHasKeyboardFocus(false);

    const currentY = Math.max(0, window.scrollY);
    resetScrollAnchors(currentY);
    setScrolledSafe(currentY > SCROLLED_STYLE_OFFSET);
    setHiddenSafe(false);
  }, [pathname, resetScrollAnchors, setHiddenSafe, setScrolledSafe]);

  // Keep header visible whenever the mobile navigation drawer is open
  useEffect(() => {
    mobileMenuOpenRef.current = mobileMenuOpen;
    if (mobileMenuOpen) {
      resetScrollAnchors(Math.max(0, window.scrollY));
      setHiddenSafe(false);
    }
  }, [mobileMenuOpen, resetScrollAnchors, setHiddenSafe]);

  // Smart auto-hide header scroll listener (passive + rAF throttled, excluded on admin routes)
  useEffect(() => {
    const syncScroll = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const currentY = Math.min(Math.max(0, window.scrollY), maxScroll);

      setScrolledSafe(currentY > SCROLLED_STYLE_OFFSET);

      if (isAdminRoute || mobileMenuOpenRef.current || currentY <= TOP_VISIBLE_OFFSET) {
        setHiddenSafe(false);
        resetScrollAnchors(currentY);
        return;
      }

      const delta = currentY - lastYRef.current;
      if (delta === 0) return;

      const nextDir: 'up' | 'down' = delta > 0 ? 'down' : 'up';
      if (directionRef.current !== nextDir) {
        directionRef.current = nextDir;
        anchorYRef.current = lastYRef.current;
      }

      const travel = currentY - anchorYRef.current;
      if (nextDir === 'down' && travel >= SCROLL_DOWN_THRESHOLD) {
        setHiddenSafe(true);
      } else if (nextDir === 'up' && travel <= -SCROLL_UP_THRESHOLD) {
        setHiddenSafe(false);
      }

      lastYRef.current = currentY;
    };

    const initialY = Math.max(0, window.scrollY);
    resetScrollAnchors(initialY);
    setScrolledSafe(initialY > SCROLLED_STYLE_OFFSET);
    setHiddenSafe(false);

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncScroll();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isAdminRoute, resetScrollAnchors, setHiddenSafe, setScrolledSafe]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleHeaderFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    let isFocusVisible = hadKeyboardRef.current;
    try {
      isFocusVisible = target.matches(':focus-visible') || hadKeyboardRef.current;
    } catch {
      isFocusVisible = hadKeyboardRef.current;
    }
    if (isFocusVisible) {
      setHasKeyboardFocus(true);
    }
  };

  const handleHeaderBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setHasKeyboardFocus(false);
    }
  };

  const shouldHide =
    !isAdminRoute && isHidden && !mobileMenuOpen && !hasKeyboardFocus;

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'من نحن', href: '/about' },
    { name: 'رؤيتنا', href: '/vision' },
    { name: 'إحصائيات المقرأة', href: '/statistics' },
    { name: 'المقرأة الإلكترونية', href: '/schedule' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        onFocus={handleHeaderFocus}
        onBlur={handleHeaderBlur}
        data-header-hidden={shouldHide ? 'true' : 'false'}
        className={`fixed top-0 left-0 right-0 z-50 transform-gpu transition-[transform,background-color,box-shadow,border-color,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isScrolled
            ? `bg-white/95 backdrop-blur-md border-b border-forest-100 py-2 ${
                shouldHide ? '' : 'shadow-sm'
              }`
            : 'bg-ivory-200/90 backdrop-blur-sm border-b border-forest-100/60 py-2.5 lg:py-3'
        } ${
          shouldHide
            ? '-translate-y-full pointer-events-none'
            : 'translate-y-0'
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 min-[1600px]:px-20 min-[1800px]:px-[88px]">
          <div className="flex items-center justify-between gap-2 lg:gap-4 xl:gap-8">
            {/* Logo and Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40 focus-visible:ring-offset-2"
            >
              <div className="relative w-11 h-11 md:w-12 md:h-12 xl:w-[52px] xl:h-[52px] flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="شعار مقرأة الهدى الإلكترونية"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-lg sm:text-xl xl:text-2xl font-bold text-forest-600 tracking-tight font-sans leading-tight transition-colors duration-200 group-hover:text-forest-700">
                  مقرأة الهدى
                </span>
                <span className="text-[11px] sm:text-xs xl:text-[13px] text-gold-600 font-medium tracking-wide leading-tight mt-0.5">
                  لتعليم القرآن الكريم
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-2 min-[1600px]:gap-3.5 flex-shrink-0">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative px-2.5 xl:px-3.5 py-2 rounded-lg text-[13px] xl:text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40 ${
                      active
                        ? 'text-forest-600 font-semibold bg-forest-50'
                        : 'text-charcoal-700 hover:text-forest-600 hover:bg-forest-50/50'
                    }`}
                  >
                    <span>{link.name}</span>
                    {active ? (
                      <span className="absolute bottom-0 right-2.5 left-2.5 xl:right-3 xl:left-3 h-0.5 bg-forest-600 rounded-full" />
                    ) : (
                      <span className="absolute bottom-0 right-2.5 left-2.5 xl:right-3 xl:left-3 h-0.5 bg-gold-500 rounded-full scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300 ease-out" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action CTAs */}
            <div className="hidden md:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              <Link
                href="/register/staff"
                className="btn-cinematic group inline-flex items-center justify-center gap-1.5 xl:gap-2 px-3 xl:px-4 min-h-[40px] py-2 text-xs xl:text-sm font-medium text-forest-700 bg-sage-200 hover:bg-forest-100 border border-forest-200/70 rounded-xl shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40 focus-visible:ring-offset-2"
              >
                <UserPlus className="w-4 h-4 text-forest-600 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>التسجيل كمعلمة أو مشرفة</span>
              </Link>

              <Link
                href="/schedule"
                className="btn-cinematic group inline-flex items-center justify-center gap-1.5 xl:gap-2 px-3.5 xl:px-4 min-h-[40px] py-2 text-xs xl:text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 border border-forest-600 rounded-xl shadow-sm hover:shadow whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2"
              >
                <GraduationCap className="w-4 h-4 text-gold-300 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>التسجيل كطالبة</span>
              </Link>
            </div>

            {/* Mobile & Compact Tablet Trigger */}
            <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
              <Link
                href="/schedule"
                className="md:hidden btn-cinematic px-3 py-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
              >
                التسجيل
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="تبديل القائمة"
                aria-expanded={mobileMenuOpen}
                className="p-2 rounded-lg text-forest-700 hover:bg-forest-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Smooth Animated RTL Mobile Drawer */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-forest-950/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer content sliding cleanly from right (RTL) */}
        <div
          className={`fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-forest-100">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image src="/logo.png" alt="شعار مقرأة الهدى" fill className="object-contain" />
                </div>
                <div>
                  <div className="font-bold text-forest-600">مقرأة الهدى</div>
                  <div className="text-xs text-gold-600">لتعليم القرآن الكريم</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="p-1.5 rounded-lg text-charcoal-500 hover:bg-forest-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="mt-6 flex flex-col gap-1.5">
              {navLinks.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ transitionDelay: mobileMenuOpen ? `${idx * 35}ms` : '0ms' }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
                    } ${
                      active
                        ? 'bg-forest-50 text-forest-600 font-semibold'
                        : 'text-charcoal-700 hover:bg-ivory-100'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronLeft className="w-4 h-4 text-charcoal-400" />
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-forest-100">
              <Link
                href="/schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-cinematic flex items-center justify-center gap-2 w-full py-3 px-4 bg-forest-600 text-white rounded-xl font-semibold text-sm shadow hover:bg-forest-700"
              >
                <GraduationCap className="w-4 h-4 text-gold-300" />
                <span>التسجيل كطالبة في الحلقات</span>
              </Link>

              <Link
                href="/register/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-cinematic flex items-center justify-center gap-2 w-full py-3 px-4 bg-sage-200 text-forest-700 rounded-xl font-medium text-sm border border-forest-200/80 hover:bg-forest-100"
              >
                <UserPlus className="w-4 h-4 text-forest-600" />
                <span>التسجيل كمعلمة أو مشرفة</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-forest-100 flex items-center justify-between text-xs text-charcoal-400">
            <span>رحلة إيمانية في رحاب القرآن</span>
            <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-forest-600 flex items-center gap-1 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>الإدارة</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
